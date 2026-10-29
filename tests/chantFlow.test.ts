import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { ChantApiError, createChantRouter } from '../server/chantRouter';
import { createChantCatalogue, configuredChantTargets, preferredChantLanguage } from '../src/lib/chantCatalog';
import { ChantRequestError, createChantTransport } from '../src/lib/chantTransport';

// A stateful query double: unlike a canned response, every owner/status filter
// changes the returned rows. SQL concurrency/RLS itself is tested with PGlite.
function database() {
  const owner=randomUUID(), other=randomUUID(), category=randomUUID(), chant=randomUUID();
  const rows:Record<string,any[]>={
    chant_identities:[{id:owner,firebase_uid:'firebase-a'},{id:other,firebase_uid:'firebase-b'}],
    chant_categories:[{id:category,status:'published',name:'Published'}],
    chants:[{id:chant,category_id:category,status:'published',default_repetition_target:27,available_targets:[27,54],title:'Configured chant'}],
    chant_sessions:[
      ...Array.from({length:21},(_,index)=>({id:randomUUID(),user_id:owner,chant_id:chant,status:'completed',current_count:index+1,started_at:index})),
      {id:randomUUID(),user_id:other,chant_id:chant,status:'paused',current_count:999,started_at:99},
    ],
    user_chant_favourites:[{user_id:owner,chant_id:chant},{user_id:other,chant_id:'other-only'}],
    chant_daily_stats:[{user_id:owner,completed_sessions:21},{user_id:other,completed_sessions:999}],
    chant_admin_bindings:[],admin_users:[],chant_translations:[],chant_media:[],
  };
  const queries:Array<{table:string;filters:Array<[string,unknown]>}>=[];
  const rpcCalls:Array<{name:string;args:any}>=[];
  let actionError:{code:string;message:string}|null=null;
  const client:any={
    from(table:string) {
      assert.ok(table in rows,`Unexpected table ${table}`);
      const filters:Array<[string,unknown]>=[], predicates:Array<(row:any)=>boolean>=[],sorts:Array<[string,boolean]>=[];
      let range:[number,number]|null=null, limit:number|undefined, insert:any, options:any, remove=false;
      queries.push({table,filters});
      const execute=async()=>{
        if(insert){
          const keys=(options?.onConflict??'id').split(',');
          const existing=rows[table].find(row=>keys.every((key:string)=>row[key]===insert[key]));
          if(!existing)rows[table].push({id:randomUUID(),status:'active',current_count:0,version:0,counting_mode:'manual',...insert});
        }
        let data=rows[table].filter(row=>predicates.every(predicate=>predicate(row)));
        if(remove){rows[table]=rows[table].filter(row=>!data.includes(row));return {data:null,error:null};}
        data=[...data].sort((a,b)=>{for(const [key,ascending] of sorts){if(a[key]!==b[key])return (a[key]<b[key]?-1:1)*(ascending?1:-1);}return 0;});
        if(range)data=data.slice(range[0],range[1]+1);
        if(limit!==undefined)data=data.slice(0,limit);
        return {data,error:null};
      };
      const query:any={
        select:()=>query,
        eq:(key:string,value:unknown)=>{filters.push([key,value]);predicates.push(row=>key==='chants.status'
          ? rows.chants.some(chant=>chant.category_id===row.id&&chant.status===value)
          : row[key]===value);return query;},
        in:(key:string,values:unknown[])=>{predicates.push(row=>values.includes(row[key]));return query;},
        ilike:()=>query,
        or:(filter:string)=>{
          const clauses=filter.split(',').map(clause=>{
            const match=clause.match(/^(\w+)\.ilike\."%(.*)%"$/);assert.ok(match,'Search must use quoted field values');return {field:match[1],term:match[2].toLowerCase()};
          });
          predicates.push(row=>clauses.some(({field,term})=>String(row[field]??'').toLowerCase().includes(term)));return query;
        },
        order:(key:string,options?:{ascending?:boolean})=>{sorts.push([key,options?.ascending!==false]);return query;},
        range:(start:number,end:number)=>{range=[start,end];return query;},
        limit:(value:number,config?:{referencedTable?:string})=>{if(!config?.referencedTable)limit=value;return query;},
        upsert:(value:any,config:any)=>{insert=value;options=config;return query;},
        delete:()=>{remove=true;return query;},
        maybeSingle:async()=>{const result=await execute();return {...result,data:result.data?.[0]??null};},
        single:async()=>{const result=await execute();return result.data?.length===1?{data:result.data[0],error:null}:{data:null,error:{code:'PGRST116',message:'Expected one identity'}};},
        then:(resolve:any,reject:any)=>execute().then(resolve,reject),
      };
      return query;
    },
    rpc:async(name:string,args:any)=>{
      rpcCalls.push({name,args});
      if(name==='chant_session_action')return {data:null,error:actionError};
      const sessions=rows.chant_sessions.filter(row=>row.user_id===args.p_user&&row.status==='completed');
      return {data:{sessions:sessions.length,repetitions:sessions.reduce((total,row)=>total+row.current_count,0)},error:null};
    },
  };
  return {client,rows,owner,other,category,chant,queries,rpcCalls,setActionError:(value:typeof actionError)=>{actionError=value;}};
}

async function withRouter(db:ReturnType<typeof database>,run:(base:string)=>Promise<void>) {
  const app=express();app.use(express.json());
  app.use('/api/chant',createChantRouter({db:()=>db.client,verify:async token=>{
    if(token==='a')return 'firebase-a';if(token==='b')return 'firebase-b';if(token==='new')return 'firebase-new';
    throw new ChantApiError(401,'Invalid token','AUTH_INVALID');
  }}));
  const server=app.listen(0);await new Promise<void>(resolve=>server.once('listening',resolve));
  try{await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/chant`);}
  finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
}
const headers=(token='a')=>({Authorization:`Bearer ${token}`,'Content-Type':'application/json'});

test('history uses the verified Firebase identity, preserves its shape, and never leaks another owner',async()=>{
  const db=database();
  await withRouter(db,async base=>{
    const first=await fetch(`${base}/me?page=0&user_id=${db.other}`,{headers:headers()});
    assert.equal(first.status,200);
    const body=await first.json();
    assert.deepEqual(Object.keys(body).sort(),['adminRole','favourites','resumable','sessions','stats','totals']);
    assert.equal(body.sessions.length,20);
    assert.ok(body.sessions.every((row:any)=>row.user_id===db.owner));
    assert.deepEqual(body.resumable,[]);
    assert.equal(body.favourites.length,1);assert.equal(body.stats.length,1);
    assert.equal(body.totals.sessions,21);
    const second=await (await fetch(`${base}/me?page=1`,{headers:headers()})).json();
    assert.equal(second.sessions.length,1);
    assert.ok(!body.sessions.some((row:any)=>row.id===second.sessions[0].id));
    const last=await (await fetch(`${base}/me?page=100000`,{headers:headers()})).json();
    assert.deepEqual(last.sessions,[]);
    const other=await (await fetch(`${base}/me`,{headers:headers('b')})).json();
    assert.equal(other.resumable[0].user_id,db.other);
    assert.ok(!other.sessions.some((row:any)=>row.user_id===db.owner));
    for(const query of db.queries.filter(query=>['chant_sessions','user_chant_favourites','chant_daily_stats'].includes(query.table))) {
      assert.ok(query.filters.some(([key,value])=>key==='user_id'&&(value===db.owner||value===db.other)));
    }
    assert.ok(db.rpcCalls.every(call=>call.args.p_user===db.owner||call.args.p_user===db.other));
  });
});

test('unknown verified Firebase user receives a unique identity and empty history, never another account',async()=>{
  const db=database();
  await withRouter(db,async base=>{
    const responses=await Promise.all([1,2].map(()=>fetch(`${base}/me?page=0`,{headers:headers('new')})));
    for(const response of responses){assert.equal(response.status,200);const body=await response.json();assert.deepEqual(body.sessions,[]);assert.deepEqual(body.totals,{sessions:0,repetitions:0});}
    const identities=db.rows.chant_identities.filter(row=>row.firebase_uid==='firebase-new');
    assert.equal(identities.length,1);assert.notEqual(identities[0].id,db.owner);
  });
});

test('session creation enforces publication, configured targets, owned UUIDs, and duplicate retry keys',async()=>{
  const db=database();
  await withRouter(db,async base=>{
    const body={chant_id:db.chant,target_count:54,client_session_key:randomUUID(),user_id:db.other};
    const create=async(value:any,token='a')=>fetch(`${base}/sessions`,{method:'POST',headers:headers(token),body:JSON.stringify(value)});
    const [first,duplicate]=await Promise.all([create(body),create(body)]);
    assert.equal(first.status,200);assert.equal(duplicate.status,200);
    const saved=await first.json();assert.equal(saved.id,(await duplicate.json()).id);
    assert.equal(saved.user_id,db.owner);assert.equal(saved.chant_id,db.chant);
    assert.equal(saved.target_count,54);assert.equal(saved.current_count,0);assert.equal(saved.counting_mode,'manual');
    assert.equal((await create({...body,target_count:108,client_session_key:randomUUID()})).status,400);
    assert.equal((await create({...body,chant_id:randomUUID(),client_session_key:randomUUID()})).status,404);
    assert.equal((await create({...body,target_count:27,client_session_key:randomUUID()})).status,200);
    db.rows.chants[0].status='draft';assert.equal((await create({...body,client_session_key:randomUUID()})).status,404);
    db.rows.chants[0].status='published';db.rows.chant_categories[0].status='archived';
    assert.equal((await create({...body,client_session_key:randomUUID()})).status,404);
  });
});

test('session action passes the server identity and separates stale versions from database failures',async()=>{
  const db=database();
  await withRouter(db,async base=>{
    const action=async(body:any)=>fetch(`${base}/sessions/${db.rows.chant_sessions[0].id}/action`,{method:'POST',headers:headers(),body:JSON.stringify(body)});
    for(const body of [{action:'play_audio',version:0},{action:'tap',version:-1},{action:'tap',version:0,reflection:12}])assert.equal((await action(body)).status,400);
    db.setActionError({code:'P0001',message:'Session changed; reload before retrying'});
    assert.equal((await action({action:'tap',version:0,user_id:db.other})).status,409);
    assert.equal(db.rpcCalls.at(-1)?.args.p_user,db.owner);
    db.setActionError({code:'42501',message:'permission denied'});
    assert.equal((await action({action:'tap',version:0})).status,500);
    db.setActionError({code:'PGRST202',message:'RPC missing'});
    assert.equal((await action({action:'tap',version:0})).status,503);
  });
});

test('catalogue queries use published Chant definitions and their real child relationships',async()=>{
  const db=database();
  const archived=randomUUID();db.rows.chant_categories.push({id:archived,status:'archived'});
  db.rows.chants.push({id:randomUUID(),status:'draft'},{id:randomUUID(),status:'archived'},{id:randomUUID(),status:'published',category_id:archived});
  db.rows.chant_translations.push({chant_id:db.chant,status:'published',language_code:'te'},{chant_id:db.chant,status:'draft',language_code:'en'},{chant_id:randomUUID(),status:'published',language_code:'hi'});
  db.rows.chant_media.push({chant_id:db.chant,status:'published',id:'audio',language_code:'te'},{chant_id:db.chant,status:'archived',id:'hidden'},{chant_id:randomUUID(),status:'published',id:'other-chant-audio'});
  const catalogue=createChantCatalogue(db.client);
  const library=await catalogue.chantLibrary();
  assert.deepEqual(library.chants.map(row=>row.id),[db.chant]);assert.equal(library.categories.length,1);
  assert.equal(library.chants[0].title,'Configured chant');
  const details=await catalogue.chantDetails(db.chant);
  assert.deepEqual(details.translations.map(row=>row.language_code),['te']);
  assert.deepEqual(details.media.map(row=>row.id),['audio']);
  assert.equal(details.media[0].language_code,'te');
  assert.equal(preferredChantLanguage(details.translations,'te-IN'),'te');
  assert.equal(preferredChantLanguage(details.translations,'en'),'original');
  assert.deepEqual(configuredChantTargets(details.chant),[27,54]);
  await assert.rejects(catalogue.chantDetails(randomUUID()),/no longer available/);
  db.rows.chant_categories[0].status='archived';
  assert.equal(await catalogue.getPublishedChant(db.chant),null);
  await assert.rejects(catalogue.chantDetails(db.chant),/no longer available/);
  assert.ok(db.queries.every(query=>['chants','chant_categories','chant_translations','chant_media'].includes(query.table)));
});

test('public catalogue failures are errors, never fabricated or empty successful results',async()=>{
  const query:any={select:()=>query,eq:()=>query,order:()=>query,range:()=>query,limit:()=>query,
    then:(resolve:any)=>Promise.resolve({data:null,error:{code:'42501'}}).then(resolve)};
  const catalogue=createChantCatalogue({from:()=>query} as any);
  await assert.rejects(catalogue.chantLibrary(),/could not be loaded/);
});

test('search covers original text and transliteration; category/type filters and meaning language remain independent',async()=>{
  const db=database(),category=randomUUID(),emptyCategory=randomUUID(),second=randomUUID();
  Object.assign(db.rows.chants[0],{original_text:'शान्तिः',transliteration:'Shanti',mantra_type:'mantra',featured:true});
  db.rows.chant_categories.push({id:category,name:'Stotrams',status:'published'},{id:emptyCategory,name:'Empty',status:'published'});
  db.rows.chants.push({id:second,category_id:category,status:'published',mantra_type:'stotram',title:'Second published record'});
  db.rows.chant_translations.push({chant_id:db.chant,language_code:'te',status:'published',meaning:'తెలుగు అర్థం'},
    {chant_id:db.chant,language_code:'hi',status:'published',meaning:'हिन्दी अर्थ'},
    {chant_id:second,language_code:'te',status:'draft',meaning:'Hidden draft'});
  const catalogue=createChantCatalogue(db.client);
  const list=await catalogue.chantLibrary('','',0,'','te');
  assert.equal(list.chants.length,2); // Neither media nor a translation is required.
  assert.ok(!list.categories.some(row=>row.id===emptyCategory));
  assert.equal(list.previews?.[db.chant].meaning,'తెలుగు అర్థం');
  assert.equal(list.previews?.[second],undefined);
  assert.deepEqual((await catalogue.chantLibrary('शान्तिः')).chants.map(row=>row.id),[db.chant]);
  assert.deepEqual((await catalogue.chantLibrary('shanti')).chants.map(row=>row.id),[db.chant]);
  assert.deepEqual((await catalogue.chantLibrary('',category)).chants.map(row=>row.id),[second]);
  assert.deepEqual((await catalogue.chantLibrary('','',0,'stotram')).chants.map(row=>row.id),[second]);
  const hindi=await catalogue.chantLibrary('','',0,'','hi');
  assert.equal(hindi.previews?.[db.chant].meaning,'हिन्दी अर्थ');
  const absent=await catalogue.chantLibrary('','',0,'','ml');assert.deepEqual(absent.previews,{});
});

test('transport preserves error classification and request ID without retrying network failures',async()=>{
  const api=createChantTransport('',async()=> 'token',async()=>new Response(JSON.stringify({error:'Sign-in expired',code:'AUTH_INVALID'}),{status:401,headers:{'X-Request-ID':'request-id'}}));
  await assert.rejects(api('/me'),error=>error instanceof ChantRequestError&&error.status===401&&error.code==='AUTH_INVALID'&&error.requestId==='request-id');
  let calls=0;
  const offline=createChantTransport('',async()=> 'token',async()=>{calls++;throw new TypeError('Failed to fetch');});
  await assert.rejects(offline('/me'),error=>error instanceof ChantRequestError&&error.code==='NETWORK_ERROR');
  assert.equal(calls,1);
});
