import express from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const CONTENT_FIELDS: Record<string, string[]> = {
 categories: ['name','slug','description','icon_url','cover_image_url','sort_order','status'],
 chants: ['slug','title','short_description','category_id','mantra_type','original_text','transliteration','pronunciation_guide','source_title','source_reference','copyright_status','rights_notes','default_repetition_target','available_targets','is_beginner_friendly','sort_order','featured','status','cover_image_url','cover_image_r2_key'],
 translations: ['chant_id','language_code','display_title','transliteration','pronunciation_guide','meaning','explanation','life_context','status'],
 media: ['title','language_code','duration_seconds','is_default','status','display_order'],
};
const TABLES = { categories: 'chant_categories', chants: 'chants', translations: 'chant_translations', media: 'chant_media' };
export function pickContent(kind: string, body: Record<string, unknown>) {
 if (!CONTENT_FIELDS[kind]) throw new Error('Unknown content type');
 return Object.fromEntries(Object.entries(body).filter(([key]) => CONTENT_FIELDS[kind].includes(key)));
}
export function validUuid(value: unknown): value is string {
 return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
export function uploadExtension(mime: string, bytes: Buffer): string | null {
 if (mime==='image/png' && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
 if (mime==='image/jpeg' && bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return 'jpg';
 if (mime==='image/webp' && bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP') return 'webp';
 if (mime==='audio/wav' && bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WAVE') return 'wav';
 if (mime==='audio/mpeg' && (bytes.toString('ascii',0,3)==='ID3' || (bytes[0]===255 && (bytes[1]&224)===224))) return 'mp3';
 if (mime==='audio/ogg' && bytes.toString('ascii',0,4)==='OggS') return 'ogg';
 return null;
}
type Dependencies = { db?: () => SupabaseClient; verify?: (token: string) => Promise<string> };
export class ChantApiError extends Error {
 constructor(public readonly status: number, message: string, public readonly code = 'INVALID_REQUEST') { super(message); }
}
class ChantDatabaseError extends Error {
 constructor(public readonly operation: string, public readonly code: string | undefined, message: string) { super(message); }
}
export function parseZeroBasedPage(value: unknown): number {
 if(value===undefined)return 0;
 if(typeof value!=='string'||! /^(0|[1-9]\d*)$/.test(value))throw new ChantApiError(400,'Page must be a non-negative integer.');
 const page=Number(value);
 if(!Number.isSafeInteger(page)||page>100000)throw new ChantApiError(400,'Page must be between 0 and 100000.');
 return page;
}
export function chantConfigurationIssue(env: NodeJS.ProcessEnv = process.env): string | null {
 const missing=['VITE_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'].filter(name=>!env[name]?.trim());
 if(missing.length)return `Missing ${missing.join(', ')}. Set ${missing.length===1?'it':'them'} in the backend .env.local or deployment environment; SUPABASE_SERVICE_ROLE_KEY is server-only. Restart the server after changing environment variables.`;
 try {
  const url=new URL(env.VITE_SUPABASE_URL!);
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('Invalid URL');
 } catch {return 'VITE_SUPABASE_URL must be a valid HTTP(S) Supabase project URL.';}
 const key=env.SUPABASE_SERVICE_ROLE_KEY;
 if(key==='your_supabase_service_role_key')return 'Replace the SUPABASE_SERVICE_ROLE_KEY example placeholder with your project’s server-only key.';
 if(key.startsWith('sb_publishable_'))return 'SUPABASE_SERVICE_ROLE_KEY contains a public key. Private Chant tables require a server-only key.';
 try {
  const role=JSON.parse(Buffer.from(key.split('.')[1]??'','base64url').toString()).role;
  if(role==='anon'||role==='authenticated')return 'SUPABASE_SERVICE_ROLE_KEY contains a public key. Private Chant tables require a server-only key.';
 } catch { /* New opaque Supabase secret keys do not contain JWT claims. */ }
 return null;
}
export function createChantRouter(deps: Dependencies = {}) {
 const router = express.Router();
 router.use((_req,res,next)=>{
  res.locals.requestId=randomUUID();
  res.setHeader('X-Request-ID',res.locals.requestId);
  res.setHeader('X-Chant-API-Version','2');
  res.setHeader('Cache-Control','no-store');
  next();
 });
 const db = deps.db ?? (() => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (chantConfigurationIssue()) throw new ChantApiError(503,'Chant backend is not configured. Please contact support.','CHANT_NOT_CONFIGURED');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 });
 const verify = deps.verify ?? (async token => {
  const projectId=process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) throw new ChantApiError(503,'Chant sign-in verification is not configured. Please contact support.','AUTH_NOT_CONFIGURED');
  const app=getApps().find(a=>a.name==='chant') ?? initializeApp({projectId},'chant');
  try { return (await getAuth(app).verifyIdToken(token)).uid; }
  catch(error) {
   const code=(error as {code?:string})?.code;
   if(['auth/argument-error','auth/id-token-expired','auth/id-token-revoked','auth/invalid-id-token','auth/user-disabled'].includes(code??'')) throw new ChantApiError(401,'Your sign-in has expired or is invalid. Please sign in again.','AUTH_INVALID');
   throw new ChantApiError(503,'Sign-in verification is temporarily unavailable. Please retry.','AUTH_UNAVAILABLE');
  }
 });
 const checked = async (query: any, operation='database query') => {
  const {data,error}=await query;
  if(error) throw new ChantDatabaseError(operation,error.code,error.message??'Database request failed');
  return data;
 };
 const route = (fn: (req: express.Request,res: express.Response)=>Promise<unknown>): express.RequestHandler => async(req,res) => {
  try { await fn(req,res); } catch(error) {
   const missingSchema=error instanceof ChantDatabaseError&&['42P01','42703','PGRST202','PGRST204','PGRST205'].includes(error.code??'');
   const status=error instanceof ChantApiError?error.status:missingSchema?503:500;
   const code=error&&typeof error==='object'&&'code' in error?error.code:undefined;
   const message=error&&typeof error==='object'&&'message' in error&&typeof error.message==='string'?error.message:'Unknown error';
   console.error('Chant request failed:',{requestId:res.locals.requestId,method:req.method,path:req.path,status,code,operation:error instanceof ChantDatabaseError?error.operation:undefined,message});
   res.status(status).json({error:error instanceof ChantApiError?error.message:missingSchema?'Chant database setup is incomplete. Please contact support.':'Chant service is temporarily unavailable. Please retry.',code:error instanceof ChantApiError?error.code:missingSchema?'CHANT_SCHEMA_UNAVAILABLE':'CHANT_DATABASE_ERROR'});
  }
 };
 router.use(async (req,res,next)=>{
  const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if(!token) {res.status(401).json({error:'Sign in to use Chant.',code:'AUTH_REQUIRED'});return;}
  try {res.locals.uid=await verify(token);if(!res.locals.uid)throw new Error('Empty verified UID'); next();}
  catch(error) {res.status(error instanceof ChantApiError?error.status:401).json({error:error instanceof ChantApiError?error.message:'Your sign-in has expired. Please sign in again.',code:error instanceof ChantApiError?error.code:'AUTH_INVALID'});}
 });
 async function identity(res: express.Response) {
  // Independent identity table avoids trusting the legacy publicly writable users table.
  const client=db();
  await checked(client.from('chant_identities').upsert({firebase_uid:res.locals.uid},{onConflict:'firebase_uid',ignoreDuplicates:true}),'resolve identity: insert if absent');
  const row=await checked(client.from('chant_identities').select('id').eq('firebase_uid',res.locals.uid).single(),'resolve identity: select by verified Firebase UID');
  if(!validUuid(row?.id))throw new ChantApiError(500,'Unable to resolve your Chant account. Please retry.','CHANT_IDENTITY_UNAVAILABLE');
  return row.id as string;
 }
 async function admin(res: express.Response, write=false) {
  const binding=await checked(db().from('chant_admin_bindings').select('admin_id').eq('firebase_uid',res.locals.uid).maybeSingle());
  const user=binding ? await checked(db().from('admin_users').select('id,role,is_active').eq('id',binding.admin_id).maybeSingle()) : null;
  if(!user?.is_active || (write && !['super_admin','editor'].includes(user.role))) {res.status(403).json({error:'You do not have permission for this action.'});return null;}
  return user;
 }
 async function published(id: unknown) {
  if(!validUuid(id)) throw new ChantApiError(400,'Invalid chant ID.');
  const row=await checked(db().from('chants').select('id,category_id,default_repetition_target,available_targets').eq('id',id).eq('status','published').maybeSingle(),'published chant lookup');
  if(!row) throw new ChantApiError(404,'This published chant is unavailable.');
  if(row.category_id && !await checked(db().from('chant_categories').select('id').eq('id',row.category_id).eq('status','published').maybeSingle())) throw new ChantApiError(404,'This chant category is unavailable.');
  return row;
 }
 router.get('/me',route(async(req,res)=>{
  const page=parseZeroBasedPage(req.query.page);
  const user=await identity(res), client=db();
  const [sessions,favourites,stats,binding]=await Promise.all([
   checked(client.from('chant_sessions').select('*').eq('user_id',user).order('started_at',{ascending:false}).order('id',{ascending:false}).range(page*20,page*20+19),'history sessions'),
   checked(client.from('user_chant_favourites').select('chant_id').eq('user_id',user),'history favourites'),
   checked(client.from('chant_daily_stats').select('*').eq('user_id',user).order('practice_date',{ascending:false}).limit(90),'history daily stats'),
   checked(client.from('chant_admin_bindings').select('admin_id').eq('firebase_uid',res.locals.uid).maybeSingle(),'history admin binding'),
  ]);
  const adminUser=binding ? await checked(client.from('admin_users').select('role,is_active').eq('id',binding.admin_id).maybeSingle()) : null;
  const resumable=await checked(client.from('chant_sessions').select('*').eq('user_id',user).in('status',['active','paused']).order('last_activity_at',{ascending:false}).order('id',{ascending:false}).limit(10),'history resumable sessions');
  const totals=await checked(client.rpc('chant_customer_totals',{p_user:user}),'history customer totals');
  res.json({sessions,favourites,stats,resumable,totals,adminRole:adminUser?.is_active?adminUser.role:null});
 }));
 router.put('/favourites/:id',route(async(req,res)=>{
  const user=await identity(res); await published(req.params.id);
  await checked(db().from('user_chant_favourites').upsert({user_id:user,chant_id:req.params.id},{onConflict:'user_id,chant_id'})); res.json({ok:true});
 }));
 router.delete('/favourites/:id',route(async(req,res)=>{
  if(!validUuid(req.params.id))throw new ChantApiError(400,'Invalid chant ID.');
  const user=await identity(res);
  await checked(db().from('user_chant_favourites').delete().eq('user_id',user).eq('chant_id',req.params.id)); res.json({ok:true});
 }));
 router.post('/sessions',route(async(req,res)=>{
  const {chant_id,target_count,client_session_key,language_code}=req.body??{};
  if(!validUuid(client_session_key) || !Number.isInteger(target_count) || target_count<1 || target_count>1000000) throw new ChantApiError(400,'Invalid session settings.');
  if(language_code!=null&&!['te','hi','en','kn','ta','ml'].includes(language_code))throw new ChantApiError(400,'Choose a supported translation language.');
  const chant=await published(chant_id);
  if(target_count!==chant.default_repetition_target&&!(chant.available_targets??[]).includes(target_count))throw new ChantApiError(400,'Choose one of this chant’s configured repetition targets.');
  if(language_code && !await checked(db().from('chant_translations').select('id').eq('chant_id',chant_id).eq('language_code',language_code).eq('status','published').maybeSingle())) throw new ChantApiError(422,'This translation is unavailable.');
  const user=await identity(res),client=db();
  await checked(client.from('chant_sessions').upsert({user_id:user,chant_id,target_count,client_session_key,language_code:language_code||null},{onConflict:'user_id,client_session_key',ignoreDuplicates:true}));
  const saved=await checked(client.from('chant_sessions').select('*').eq('user_id',user).eq('client_session_key',client_session_key).single(),'session creation result');
  if(saved.chant_id!==chant_id||saved.target_count!==target_count||(saved.language_code??null)!==(language_code||null))throw new ChantApiError(409,'This retry key already belongs to a different session configuration. Reopen the chant before starting.','CHANT_SESSION_CONFLICT');
  res.json(saved);
 }));
 router.post('/sessions/:id/action',route(async(req,res)=>{
  req.body=req.body??{};
  if(!validUuid(req.params.id) || !Number.isInteger(req.body.version) || req.body.version<0 || req.body.version>2147483647 ||
     !['tap','undo','pause','resume','complete','abandon','heartbeat'].includes(req.body.action) ||
     (req.body.reflection!=null&&(typeof req.body.reflection!=='string'||req.body.reflection.length>2000))) throw new ChantApiError(400,'Invalid session settings.');
  const user=await identity(res);
  const result=await db().rpc('chant_session_action',{p_user:user,p_session:req.params.id,p_action:req.body.action,p_version:req.body.version,p_reflection:req.body.reflection??null});
  if(result.error) {
   if(result.error.code!=='P0001')throw new ChantDatabaseError('session action',result.error.code,result.error.message);
   res.status(409).json({error:'Session changed or this action is unavailable. Reload your saved practice before retrying.',code:'CHANT_SESSION_CONFLICT'});return;
  }
  res.json(result.data);
 }));
 router.get('/admin/:kind',route(async(req,res)=>{
  const actor=await admin(res); if(!actor)return;
  const kind=String(req.params.kind), client=db();
  if(kind==='analytics') {
   const data=await checked(client.rpc('chant_analytics')); res.json(data);return;
  }
  if(kind==='customers') {
   if(actor.role!=='super_admin'){res.status(403).json({error:'Customer details require super admin access.'});return;}
   const page=Math.max(0,Number(req.query.page)||0);
   let query=client.from('chant_sessions').select('*').order('started_at',{ascending:false});
   if(req.query.user_id){if(!validUuid(req.query.user_id)) throw new ChantApiError(400,'Enter a valid customer UUID.'); query=query.eq('user_id',req.query.user_id);}
   res.json(await checked(query.range(page*20,page*20+19))); return;
  }
  if(!(kind in TABLES)) {res.status(404).end();return;}
  const page=Math.max(0,Number(req.query.page)||0);
  let query=client.from(TABLES[kind]).select('*').order('created_at',{ascending:false});
  if(req.query.chant_id) query=query.eq('chant_id',req.query.chant_id);
  if(req.query.status) query=query.eq('status',req.query.status);
  if(req.query.search && ['chants','categories'].includes(kind)) query=query.ilike(kind==='chants'?'title':'name',`%${String(req.query.search).replace(/[%_]/g,'')}%`);
  res.json(await checked(query.range(page*20,page*20+19)));
 }));
 router.post('/admin/:kind',route(async(req,res)=>{
  const actor=await admin(res,true);if(!actor)return;
  const kind=String(req.params.kind); if(!(kind in TABLES))throw new ChantApiError(400,'Invalid content type.');
  const data=pickContent(kind,req.body);
  if(kind==='media' && !req.body.id)throw new ChantApiError(400,'Upload media first.');
  if(kind==='chants' || kind==='translations') data.updated_by=actor.id;
  if(kind==='chants' && data.status==='published')data.published_at=new Date().toISOString();
  if(req.body.id){
   if(!validUuid(req.body.id))throw new ChantApiError(400,'Invalid content ID.');
   res.json(await checked(db().from(TABLES[kind]).update(data).eq('id',req.body.id).select().single()));
  }else{
   data.created_by=actor.id;
   res.json(await checked(db().from(TABLES[kind]).insert(data).select().single()));
  }
 }));
 // Authenticate and authorize BEFORE buffering large uploads.
 router.post(['/admin/upload/:id','/admin/category-artwork/:id'],route(async(req,res)=>{
  const actor=await admin(res,true);if(!actor)return;res.locals.actor=actor;
  if(!validUuid(req.params.id))throw new ChantApiError(400,'Invalid content ID.');
  const isCategory=req.path.startsWith('/admin/category-artwork/');
  await checked(db().from(isCategory?'chant_categories':'chants').select('id').eq('id',req.params.id).single());
  await new Promise<void>((resolve,reject)=>express.raw({type:()=>true,limit:'25mb'})(req,res,error=>error?reject(error):resolve()));
  const bytes=req.body as Buffer, mime=req.headers['content-type']?.split(';')[0]??'';
  const ext=Buffer.isBuffer(bytes) && uploadExtension(mime,bytes);
  const mediaType=isCategory?'artwork':String(req.query.type||'audio');
  if(!ext || !bytes.length || !['audio','pronunciation','artwork','ambience'].includes(mediaType) || (mediaType==='artwork')!==mime.startsWith('image/') || (mime.startsWith('image/') && bytes.length>5*1024*1024))throw new ChantApiError(400,'Unsupported media.');
  const env=process.env, origin=env.CLOUDFLARE_R2_PUBLIC_URL;
  if(!origin?.startsWith('https://') || !env.CLOUDFLARE_R2_ACCOUNT_ID || !env.CLOUDFLARE_R2_ACCESS_KEY_ID || !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || !env.CLOUDFLARE_R2_BUCKET_NAME)throw new ChantApiError(503,'Chant media storage is not configured.');
  const key=`${isCategory?'chant-categories':'chants'}/${req.params.id}/${randomUUID()}.${ext}`;
  const client=new S3Client({region:'auto',endpoint:`https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,credentials:{accessKeyId:env.CLOUDFLARE_R2_ACCESS_KEY_ID,secretAccessKey:env.CLOUDFLARE_R2_SECRET_ACCESS_KEY}});
  await client.send(new PutObjectCommand({Bucket:env.CLOUDFLARE_R2_BUCKET_NAME,Key:key,Body:bytes,ContentType:mime}));
  const publicUrl=`${origin.replace(/\/$/,'')}/${key}`;
  if(isCategory){res.json(await checked(db().from('chant_categories').update({cover_image_url:publicUrl}).eq('id',req.params.id).select().single()));return;}
  res.json(await checked(db().from('chant_media').insert({chant_id:req.params.id,media_type:mediaType,storage_key:key,public_url:publicUrl,mime_type:mime,file_size_bytes:bytes.length,created_by:actor.id}).select().single()));
 }));
 return router;
}
