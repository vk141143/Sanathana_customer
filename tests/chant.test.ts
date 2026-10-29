import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { chantConfigurationIssue, createChantRouter, parseZeroBasedPage, pickContent, uploadExtension, validUuid } from '../server/chantRouter';
import { createChantTransport } from '../src/lib/chantTransport';

test('backend configuration rejects missing and public keys without exposing credentials',()=>{
 assert.match(chantConfigurationIssue({}),/server-only/);
 const missingKey=chantConfigurationIssue({VITE_SUPABASE_URL:'https://example.test'});
 assert.match(missingKey,/Missing SUPABASE_SERVICE_ROLE_KEY\./);
 assert.doesNotMatch(missingKey,/Missing VITE_SUPABASE_URL/);
 assert.match(chantConfigurationIssue({VITE_SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'   '}),/Missing SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(chantConfigurationIssue({VITE_SUPABASE_URL:'invalid',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_test'}),/valid HTTP/);
 assert.match(chantConfigurationIssue({VITE_SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'your_supabase_service_role_key'}),/placeholder/);
 assert.match(chantConfigurationIssue({VITE_SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'sb_publishable_test'}),/public key/);
 const anon=`header.${Buffer.from(JSON.stringify({role:'anon'})).toString('base64url')}.signature`;
 assert.match(chantConfigurationIssue({VITE_SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:anon}),/public key/);
 assert.equal(chantConfigurationIssue({VITE_SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_test'}),null);
});

test('frontend coalesces effect replay, sends page zero and surfaces error bodies without retry loops', async () => {
 let calls=0;
 let release!:()=>void;
 const wait=new Promise<void>(resolve=>{release=resolve;});
 const api=createChantTransport('',async()=> 'token',async(input,init)=>{
  calls++;
  assert.equal(input,'/api/chant/me?page=0');
  assert.equal(init?.headers?.['Authorization'],'Bearer token');
  await wait;
  return new Response(JSON.stringify({error:'Chant backend is not configured.'}),{status:503});
 });
 const first=api('/me'),second=api('/me?page=0');
 release();
 const results=await Promise.allSettled([first,second]);
 assert.equal(calls,1);
 for(const result of results){assert.equal(result.status,'rejected');if(result.status==='rejected')assert.match(result.reason.message,/not configured/);}
 await assert.rejects(api('/me'),/not configured/);
 assert.equal(calls,2);
});

test('frontend rejects signed-out calls without fetching and distinguishes account requests', async () => {
 let calls=0;
 const signedOut=createChantTransport('',async()=>null,async()=>{calls++;return new Response('{}');});
 await assert.rejects(signedOut('/me'),/sign in/);
 assert.equal(calls,0);
 let token='one';
 const api=createChantTransport('',async()=>token,async()=>{calls++;return new Response('{}');});
 const first=api('/me');token='two';await Promise.all([first,api('/me')]);
 assert.equal(calls,2);
});

test('frontend reports invalid JSON and preserves explicit history pages', async () => {
 const api=createChantTransport('',async()=> 'token',async(input)=>{
  assert.equal(input,'/api/chant/me?page=2');return new Response('invalid');
 });
 await assert.rejects(api('/me?page=2'),/invalid response/);
});

function meDependencies(options:{sessionError?:string}={}) {
 const ranges:Array<[string,number,number]>=[],userId='00000000-0000-4000-8000-000000000001';
 const client:any={
  from:(table:string)=>{
   const query:any={table};
   for(const method of ['select','upsert','eq','order','in','limit'])query[method]=()=>query;
   query.range=(start:number,end:number)=>{ranges.push([table,start,end]);return query;};
   query.single=async()=>({data:table==='chant_identities'?{id:userId}:null,error:null});
   query.maybeSingle=async()=>({data:null,error:null});
   query.then=(resolve:any,reject:any)=>Promise.resolve({
    data:table==='chant_identities'?null:[],
    error:options.sessionError&&table==='chant_sessions'?{code:options.sessionError,message:'private database diagnostic'}:null,
   }).then(resolve,reject);
   return query;
  },
  rpc:async()=>({data:{repetitions:0,sessions:0},error:null}),
 };
 return {
  ranges,
  verify:async(token:string)=>token==='valid-token'?'verified-firebase-uid':Promise.reject(new Error('invalid token')),
  db:()=>client,
 };
}

async function withMeRoute(
 dependencies:Parameters<typeof createChantRouter>[0],
 run:(url:string)=>Promise<void>,
) {
 const app=express();app.use(express.json());app.use('/api/chant',createChantRouter(dependencies));
 const server=app.listen(0);await new Promise<void>(resolve=>server.once('listening',resolve));
 try{await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/chant/me`);}
 finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
}

test('missing private key returns 503 after authentication, not a page-zero or identity error',async()=>{
 const previous=process.env.SUPABASE_SERVICE_ROLE_KEY;
 delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 try {
  await withMeRoute({verify:async()=> 'verified-firebase-uid'},async url=>{
   const anonymous=await fetch(`${url}?page=0`);
   assert.equal(anonymous.status,401);
   const response=await fetch(`${url}?page=0`,{headers:{Authorization:'Bearer valid-token'}});
   assert.equal(response.status,503);
   assert.deepEqual(await response.json(),{error:'Chant backend is not configured. Please contact support.',code:'CHANT_NOT_CONFIGURED'});
   assert.ok(response.headers.get('X-Request-ID'));
  });
 } finally {
  if(previous===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY=previous;
 }
});

test('chant history pagination is zero-based and page zero is valid',()=>{
 assert.equal(parseZeroBasedPage(undefined),0);
 assert.equal(parseZeroBasedPage('0'),0);
 assert.equal(parseZeroBasedPage('1'),1);
 assert.throws(()=>parseZeroBasedPage('-1'),/non-negative integer/);
 assert.throws(()=>parseZeroBasedPage('1abc'),/non-negative integer/);
 assert.throws(()=>parseZeroBasedPage(['0','1']),/non-negative integer/);
 assert.throws(()=>parseZeroBasedPage('100001'),/between 0 and 100000/);
});

test('GET /me?page=0 returns empty history and zero totals for a new user',async()=>{
 const dependencies=meDependencies();
 await withMeRoute(dependencies,async url=>{
  const response=await fetch(`${url}?page=0`,{headers:{Authorization:'Bearer valid-token'}});
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{
   sessions:[],favourites:[],stats:[],resumable:[],totals:{repetitions:0,sessions:0},adminRole:null,
  });
 });
 assert.ok(dependencies.ranges.some(([table,start,end])=>table==='chant_sessions'&&start===0&&end===19));
});

test('GET /me?page=1 requests the second zero-based page',async()=>{
 const dependencies=meDependencies();
 await withMeRoute(dependencies,async url=>{
  const response=await fetch(`${url}?page=1`,{headers:{Authorization:'Bearer valid-token'}});
  assert.equal(response.status,200);
 });
 assert.ok(dependencies.ranges.some(([table,start,end])=>table==='chant_sessions'&&start===20&&end===39));
});

test('GET /me rejects malformed pages and unauthenticated access with the right status',async()=>{
 let databaseCalls=0;
 const dependencies=meDependencies();
 const originalDb=dependencies.db;
 dependencies.db=()=>{databaseCalls++;return originalDb();};
 await withMeRoute(dependencies,async url=>{
  const invalid=await fetch(`${url}?page=1abc`,{headers:{Authorization:'Bearer valid-token'}});
  assert.equal(invalid.status,400);
  assert.match((await invalid.json()).error,/non-negative integer/);
  const duplicate=await fetch(`${url}?page=0&page=1`,{headers:{Authorization:'Bearer valid-token'}});
  assert.equal(duplicate.status,400);
  const unauthorized=await fetch(`${url}?page=0`);
  assert.equal(unauthorized.status,401);
 });
 assert.equal(databaseCalls,0);
});

test('GET /me reports database and RLS failures safely with correlated server diagnostics',async()=>{
 for(const code of ['42501','XX000','42P01','42703','PGRST202']) {
 const dependencies=meDependencies({sessionError:code});
 const logs:unknown[][]=[];
 const originalError=console.error;console.error=(...args)=>{logs.push(args);};
 try{
  await withMeRoute(dependencies,async url=>{
   const response=await fetch(`${url}?page=0`,{headers:{Authorization:'Bearer valid-token'}});
   const missing=['42P01','42703','PGRST202'].includes(code);
   assert.equal(response.status,missing?503:500);
   const body=await response.json();
   assert.equal(body.code,missing?'CHANT_SCHEMA_UNAVAILABLE':'CHANT_DATABASE_ERROR');
   assert.ok(!JSON.stringify(body).includes('private database diagnostic'));
   assert.equal(response.headers.get('X-Chant-API-Version'),'2');
   const diagnostic=logs[0][1] as any;
   assert.equal(diagnostic.requestId,response.headers.get('X-Request-ID'));
   assert.equal(diagnostic.code,code);
   assert.equal(diagnostic.operation,'history sessions');
  });
 }finally{console.error=originalError;}
 }
});

test('content allowlists cannot overwrite ownership, generated totals, or upload location',()=>{
 assert.deepEqual(pickContent('chants',{title:'Test',created_by:'attacker',user_id:'victim',id:'bad'}),{title:'Test'});
 assert.deepEqual(pickContent('media',{title:'Track',storage_key:'other/file',public_url:'https://bad',created_by:'attacker'}),{title:'Track'});
 assert.equal(validUuid('not-a-uuid'),false);
});
test('uploads check file signatures and refuse SVG and disguised files',()=>{
 assert.equal(uploadExtension('image/svg+xml',Buffer.from('<svg/>')),null);
 assert.equal(uploadExtension('image/png',Buffer.from('<script>')),null);
 assert.equal(uploadExtension('image/png',Buffer.from([137,80,78,71,13,10,26,10])),'png');
 assert.equal(uploadExtension('audio/mpeg',Buffer.from('ID3sample')),'mp3');
});
test('backend rejects missing and invalid Firebase tokens before database access',async()=>{
 const app=express();app.use('/api/chant',createChantRouter({verify:async()=>{throw new Error('invalid');},db:()=>{throw new Error('Database must not be called');}}));
 const server=app.listen(0);await new Promise<void>(resolve=>server.once('listening',resolve));
 try{const url=`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/chant/me`;
 assert.equal((await fetch(url)).status,401);assert.equal((await fetch(url,{headers:{Authorization:'Bearer invalid'}})).status,401);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
});

test('admin roles are checked server-side, including uploads and customer details',async()=>{
 for(const role of ['viewer','editor','super_admin','unbound']) {
  const client:any={from:(table:string)=>{
   const result=table==='chant_admin_bindings'?{admin_id:'admin'}:table==='admin_users'?{id:'admin',role,is_active:role!=='unbound'}:[];
   const query:any={};for(const method of ['select','eq','order','range'])query[method]=()=>query;
   query.maybeSingle=async()=>({data:result,error:null});query.then=(resolve:any)=>Promise.resolve({data:result,error:null}).then(resolve);return query;
  }};
  const app=express();app.use(express.json());app.use('/api/chant',createChantRouter({verify:async()=> 'verified',db:()=>client}));
  const server=app.listen(0);await new Promise<void>(resolve=>server.once('listening',resolve));
  const url=`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/chant`;
  const headers={Authorization:'Bearer verified','Content-Type':'application/json'};
  try{
   assert.equal((await fetch(`${url}/admin/customers`,{headers})).status,role==='super_admin'?200:403);
   if(role==='viewer'||role==='unbound'){
    assert.equal((await fetch(`${url}/admin/chants`,{method:'POST',headers,body:JSON.stringify({title:'Unauthorized'})})).status,403);
    assert.equal((await fetch(`${url}/admin/upload/00000000-0000-0000-0000-000000000000`,{method:'POST',headers})).status,403);
   }
  }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
 }
});

test('PostgreSQL migrations, RLS, state machine, ownership, aggregates and publication',async(t)=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
   create table public.admin_users(id uuid primary key default gen_random_uuid(),role text,is_active boolean);
   grant usage on schema public to anon,authenticated,service_role;`);
  await db.exec(await readFile(new URL('../supabase/migrations/202610180001_chant.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202610180002_chant_analytics.sql',import.meta.url),'utf8'));
  const one=async(sql:string,args:unknown[]=[])=> (await db.query<any>(sql,args)).rows[0];
  const category=await one(`update chant_categories set status='published' where slug='shiva' returning id`);
  const chant=await one(`insert into chants(title,slug,original_text,source_title,copyright_status,category_id,status) values('Test mantra','test','Original','Test source','public domain',$1,'published') returning id`,[category.id]);
  const user=await one(`insert into chant_identities(firebase_uid) values('verified-firebase-uid') returning id`);
  const other=await one(`insert into chant_identities(firebase_uid) values('other-firebase-uid') returning id`);
  const session=await one(`insert into chant_sessions(user_id,chant_id,target_count,client_session_key) values($1,$2,1,gen_random_uuid()) returning *`,[user.id,chant.id]);
  await t.test('constraints reject invalid targets, duplicate identities, favourites and languages',async()=>{
   await assert.rejects(db.query(`insert into chant_sessions(user_id,chant_id,target_count,client_session_key) values($1,$2,0,gen_random_uuid())`,[user.id,chant.id]));
   await assert.rejects(db.query(`insert into user_chant_favourites(user_id,chant_id) values(gen_random_uuid(),$1)`,[chant.id]));
   await assert.rejects(db.query(`insert into chants(title,slug,available_targets) values('Invalid','bad','{0}')`));
   await assert.rejects(db.query(`insert into chant_identities(firebase_uid) values('verified-firebase-uid')`));
   await db.query(`insert into user_chant_favourites(user_id,chant_id) values($1,$2)`,[user.id,chant.id]);
   await assert.rejects(db.query(`insert into user_chant_favourites(user_id,chant_id) values($1,$2)`,[user.id,chant.id]));
   await assert.rejects(db.query(`insert into chant_sessions(user_id,chant_id,target_count,client_session_key) values($1,$2,1,$3)`,[user.id,chant.id,session.client_session_key]));
   await assert.rejects(db.query(`insert into chant_translations(chant_id,language_code,status) values($1,'en','published')`,[chant.id]));
  });
  await t.test('anonymous and Supabase authenticated users cannot access private records or RPCs',async()=>{
   for(const role of ['anon','authenticated']){
    await db.exec(`set role ${role}`);
    await assert.rejects(db.query('select * from chant_sessions'));
    await assert.rejects(db.query('select * from chant_identities'));
    await assert.rejects(db.query('select * from user_chant_favourites'));
    await assert.rejects(db.query('select chant_analytics()'));
    await assert.rejects(db.query(`select chant_session_action($1,$2,'complete',0)`,[user.id,session.id]));
    await assert.rejects(db.query(`update chants set status='draft'`));
    await db.exec('reset role');
   }
  });
  await t.test('publication requires published parent; missing translations never appear',async()=>{
   await db.query(`insert into chant_translations(chant_id,language_code,meaning,status) values($1,'en','Meaning','draft')`,[chant.id]);
   await db.exec('set role anon');assert.equal((await db.query('select * from chants')).rows.length,1);assert.equal((await db.query('select * from chant_translations')).rows.length,0);await db.exec('reset role');
   await db.query(`update chant_translations set status='published'`);
   await db.exec('set role anon');assert.equal((await db.query('select * from chant_translations')).rows.length,1);await db.exec('reset role');
   await db.query(`update chant_categories set status='archived' where id=$1`,[category.id]);
   await db.exec('set role anon');assert.equal((await db.query('select * from chants')).rows.length,0);assert.equal((await db.query('select * from chant_translations')).rows.length,0);await db.exec('reset role');
   await db.query(`update chant_categories set status='published' where id=$1`,[category.id]);
  });
  await t.test('cross-user mutation fails; tap replay fails; undo, pause and resume persist',async()=>{
   await assert.rejects(db.query(`select chant_session_action($1,$2,'tap',0)`,[other.id,session.id]));
   await db.query(`select chant_session_action($1,$2,'tap',0)`,[user.id,session.id]);
   await assert.rejects(db.query(`select chant_session_action($1,$2,'tap',0)`,[user.id,session.id]));
   await db.query(`select chant_session_action($1,$2,'undo',1)`,[user.id,session.id]);
   assert.equal((await one('select current_count from chant_sessions where id=$1',[session.id])).current_count,0);
   await db.query(`select chant_session_action($1,$2,'pause',2)`,[user.id,session.id]);
   await assert.rejects(db.query(`select chant_session_action($1,$2,'tap',3)`,[user.id,session.id]));
   await db.query(`select chant_session_action($1,$2,'resume',3)`,[user.id,session.id]);
   await db.query(`select chant_session_action($1,$2,'tap',4)`,[user.id,session.id]);
   await db.query(`select chant_session_action($1,$2,'tap',5)`,[user.id,session.id]);
   assert.equal((await one('select current_count from chant_sessions where id=$1',[session.id])).current_count,2);
  });
  await t.test('completion is idempotent and daily aggregate matches session exactly',async()=>{
   await db.query(`select chant_session_action($1,$2,'complete',6,'Peaceful')`,[user.id,session.id]);
   await db.query(`select chant_session_action($1,$2,'complete',6,'Repeated')`,[user.id,session.id]);
   const saved=await one('select * from chant_sessions where id=$1',[session.id]);assert.equal(saved.version,7);assert.equal(saved.reflection,'Peaceful');assert.equal(saved.status,'completed');
   const daily=await one('select * from chant_daily_stats where user_id=$1',[user.id]);assert.equal(Number(daily.completed_sessions),1);assert.equal(Number(daily.total_repetitions),2);assert.equal(Number(daily.total_duration_seconds),saved.duration_seconds);
   await assert.rejects(db.query(`select chant_session_action($1,$2,'undo',7)`,[user.id,session.id]));
   const metrics=await one('select chant_analytics() data');assert.equal(metrics.data.completed_sessions,1);assert.equal(metrics.data.total_repetitions,2);assert.equal(metrics.data.completion_rate,100);
   const totals=await one('select chant_customer_totals($1) data',[user.id]);assert.equal(totals.data.repetitions,2);
  });
 } finally { await db.close(); }
});
