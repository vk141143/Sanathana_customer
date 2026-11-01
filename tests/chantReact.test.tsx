import assert from 'node:assert/strict';
import { test } from 'node:test';
import React, { StrictMode, useState } from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { useChantHistory } from '../src/components/chant/useChantHistory';
import { useChantLibrary } from '../src/components/chant/useChantLibrary';
import { ChantAudio } from '../src/components/chant/ChantAudio';
import { ChantCounter } from '../src/components/chant/ChantCounter';
import { ChantExperienceContent, type ChantExperienceServices } from '../src/components/chant/ChantExperienceContent';
import { createChantTransport } from '../src/lib/chantTransport';
import type { Chant, ChantMe, ChantMedia } from '../src/lib/chant';
import { normalizeChantPractice, type ChantPractice } from '../src/lib/practiceChantCatalog';

const empty:ChantMe={sessions:[],favourites:[],stats:[],resumable:[],totals:{sessions:0,repetitions:0},adminRole:null};
const makePractice=(overrides:Record<string,unknown>={})=>normalizeChantPractice({
  id:'11111111-1111-4111-8111-111111111111',name:'Morning Japa',slug:'morning-japa',category:'japa',
  is_active:true,archived_at:null,subtitle:'A gentle daily practice',description:'Begin the day with a sacred mantra.',
  practice_mode:'repetition',target_type:'repetitions',target_count:27,cover_image_url:'https://media.example/japa.png',
  instructions:'Sit comfortably and repeat with attention.',
  category_config:{counter_enabled:true,count_preset:27,mantra_name:'Om Namah Shivaya',mantra_text:'ॐ नमः शिवाय',
    transliteration:'Om Namah Shivaya',meaning:'I bow to Shiva.',localized_content:{te:{meaning:'శివునికి నమస్కరిస్తున్నాను.'}}},
  ...overrides,
}) as ChantPractice;

test('mounted Chant components handle Strict Mode, account changes, retries and media events',async t=>{
  const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost'});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
  async function mount(element:React.ReactNode) {
    const container=document.createElement('div');document.body.append(container);
    const root=createRoot(container);
    await act(async()=>{root.render(element);});
    return {container,render:async(next:React.ReactNode)=>{await act(async()=>root.render(next));},close:async()=>{await act(async()=>root.unmount());container.remove();}};
  }
  try {
    await t.test('Home Japa displays Admin practices, opens detail and counts without using Chant session IDs',async()=>{
      const practice=makePractice({guided_audio_url:'https://media.example/japa.mp3'});
      const mantra=makePractice({id:'22222222-2222-4222-8222-222222222222',name:'Published mantra',slug:'published-mantra',category:'mantra',
        category_config:{mantra_text:'ॐ शान्तिः',counter_enabled:false}});
      const calls:Array<{path:string;body:any}>=[],completed:number[]=[];
      const services:ChantExperienceServices={
        currentUid:()=> 'owner',subscribeAuth:listener=>{listener('owner');return()=>{};},renderAdmin:()=>null,
        getPublishedChant:async()=>null,details:async()=>{throw new Error('Legacy Chant details must not load from Japa.');},
        api:async<T,>(path:string,body?:unknown)=>{calls.push({path,body});throw new Error('Admin practice IDs must not call Chant APIs.');},
        practices:{list:async()=>[practice,mantra]},
      };
      const view=await mount(<StrictMode><ChantExperienceContent services={services} preferredLanguage="te" onClose={()=>{}} onComplete={count=>completed.push(count)}/></StrictMode>);
      try {
        await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});
        assert.equal(view.container.querySelectorAll('.chant-card').length,2);
        assert.match(view.container.textContent!,/Japa practices/);
        assert.doesNotMatch(view.container.textContent!,/Mantra Library|Stotrams|Search mantras|Practice type/);
        assert.match(view.container.querySelectorAll('.chant-card')[0].textContent!,/27 repetitions/);
        await act(async()=>view.container.querySelector<HTMLButtonElement>('.chant-card')!.click());
        assert.match(view.container.textContent!,/ॐ नमः शिवाय/);
        assert.match(view.container.textContent!,/Om Namah Shivaya/);
        assert.match(view.container.textContent!,/శివునికి నమస్కరిస్తున్నాను/);
        assert.match(view.container.textContent!,/Sit comfortably and repeat with attention/);
        assert.equal(view.container.querySelector('audio')?.getAttribute('preload'),'none');
        const button=(label:string)=>Array.from(view.container.querySelectorAll('button')).find(b=>b.textContent===label)!;
        await act(async()=>button('Begin Japa practice').click());
        await act(async()=>view.container.querySelector<HTMLButtonElement>('.chant-counter')!.click());
        assert.match(view.container.querySelector('.chant-counter')!.getAttribute('aria-label')!,/count 1/);
        await act(async()=>button('Finish practice').click());
        assert.deepEqual(completed,[1]);assert.equal(calls.length,0);
      } finally {await view.close();}
    });
    await t.test('actual catalogue distinguishes empty, failed and private-history failure states',async()=>{
      let mode:'empty'|'failure'|'published'='empty';
      let privateCalls=0;
      const chant={id:'visible',title:'Visible without account service',default_repetition_target:27,available_targets:[27],original_text:'Original'} as Chant;
      const services:ChantExperienceServices={currentUid:()=> 'owner',subscribeAuth:listener=>{listener('owner');return()=>{};},renderAdmin:()=>null,
        practices:{list:async()=>{if(mode==='failure')throw new Error('Public query failed');return mode==='published'?[makePractice({name:'Visible Japa'})]:[];}},
        details:async()=>({chant,translations:[],media:[]}),getPublishedChant:async()=>chant,
        api:async()=>{privateCalls++;throw new Error('Private history unavailable');}};
      const view=await mount(<ChantExperienceContent services={services} onClose={()=>{}} onComplete={()=>{}}/>);
      const button=(label:string)=>Array.from(view.container.querySelectorAll('button')).find(b=>b.textContent===label)!;
      try {
        await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});
        assert.match(view.container.textContent!,/No Japa practices available yet\. Please check back soon\./);assert.equal(privateCalls,0);
        mode='failure';await act(async()=>button('Refresh practices').click());
        await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});
        assert.match(view.container.querySelector('[role=alert]')!.textContent!,/Public query failed/);assert.equal(view.container.querySelector('.chant-empty'),null);
        mode='published';await act(async()=>button('Retry Japa practices').click());
        await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});
        await act(async()=>button('history').click());assert.equal(privateCalls,1);
        await act(async()=>button('Japa practices').click());assert.match(view.container.querySelector('.chant-card')!.textContent!,/Visible Japa/);
        assert.equal(button('history').disabled,false);
      } finally {await view.close();}
    });
    await t.test('public catalogue renders without private requests and survives private failure and retry',async()=>{
      let privateCalls=0,publicCalls=0;
      const publicLoad=async()=>{publicCalls++;return {chants:[{id:'published-admin-chant',title:'Admin published mantra'} as Chant],categories:[]};};
      const api=createChantTransport('',async()=> 'token',async()=>{
        privateCalls++;return new Response(JSON.stringify({error:'Not configured',code:'CHANT_NOT_CONFIGURED'}),{status:503});
      });
      const privateLoad=(path:string)=>api<ChantMe>(path),current=()=> 'owner';
      function Harness(){
        const [enabled,setEnabled]=useState(false),[revision,setRevision]=useState(0);
        const library=useChantLibrary(publicLoad,'','',0,0);
        const history=useChantHistory('owner',0,revision,privateLoad,current,enabled);
        return <><p>{library.loading?'Loading':library.chants.map(c=>c.title).join(', ')}</p>
          {history.error&&<p role="alert">{history.error}</p>}
          <button onClick={()=>setEnabled(true)}>History</button><button onClick={()=>setRevision(v=>v+1)}>Retry history</button></>;
      }
      const view=await mount(<StrictMode><Harness/></StrictMode>);
      await act(async()=>{await new Promise(resolve=>setTimeout(resolve,250));});
      assert.equal(publicCalls,1);assert.equal(privateCalls,0);
      assert.match(view.container.textContent!,/Admin published mantra/);
      await act(async()=>view.container.querySelector('button')!.click());
      assert.equal(privateCalls,1);assert.equal(publicCalls,1);
      assert.match(view.container.querySelector('[role=alert]')!.textContent!,/secure account service/);
      assert.match(view.container.textContent!,/Admin published mantra/);
      await act(async()=>view.container.querySelectorAll('button')[1].click());
      assert.equal(privateCalls,2);assert.equal(publicCalls,1);
      await act(async()=>{await new Promise(resolve=>setTimeout(resolve,250));});
      assert.equal(privateCalls,2);await view.close();
    });
    await t.test('catalogue failures expose an error instead of an empty catalogue, retry clears it, unmount ignores responses',async()=>{
      let calls=0;
      let resolveLate!:(value:{chants:Chant[];categories:[]})=>void;
      const load=async()=>{
        calls++;
        if(calls===1)throw new Error('Published catalogue could not be loaded.');
        if(calls===3)return new Promise<{chants:Chant[];categories:[]}>(resolve=>{resolveLate=resolve;});
        return {chants:[{id:'real',title:'Published record'} as Chant],categories:[]};
      };
      function Harness(){const [revision,setRevision]=useState(0);const library=useChantLibrary(load,'','',0,revision);
        return <>{library.error?<p role="alert">{library.error}</p>:<p>{library.loading?'Loading':library.chants.length?library.chants[0].title:'Empty catalogue'}</p>}<button onClick={()=>setRevision(v=>v+1)}>Retry</button></>;}
      const view=await mount(<Harness/>);
      await act(async()=>{await new Promise(resolve=>setTimeout(resolve,250));});
      assert.match(view.container.textContent!,/could not be loaded/);assert.doesNotMatch(view.container.textContent!,/Empty catalogue/);
      await act(async()=>view.container.querySelector('button')!.click());
      await act(async()=>{await new Promise(resolve=>setTimeout(resolve,250));});
      assert.equal(view.container.querySelector('[role=alert]'),null);assert.match(view.container.textContent!,/Published record/);
      await act(async()=>view.container.querySelector('button')!.click());
      await act(async()=>{await new Promise(resolve=>setTimeout(resolve,250));});
      await view.close();await act(async()=>resolveLate({chants:[],categories:[]}));
    });
    await t.test('effect replay shares one request and a failed history request exposes an explicit retry',async()=>{
      let calls=0;
      const api=createChantTransport('',async()=> 'token',async()=>{
        calls++;return calls===1?new Response(JSON.stringify({error:'History unavailable',code:'CHANT_DATABASE_ERROR'}),{status:500}):new Response(JSON.stringify(empty));
      });
      const load=(path:string)=>api<ChantMe>(path),current=()=> 'owner';
      function Harness(){const [revision,setRevision]=useState(0);const history=useChantHistory('owner',0,revision,load,current);
        return <><p role="status">{history.loading?'Loading':history.me?'No previous sessions':''}</p>{history.error&&<p role="alert">{history.error}</p>}<button onClick={()=>setRevision(value=>value+1)}>Retry</button></>;}
      const view=await mount(<StrictMode><Harness/></StrictMode>);
      assert.equal(calls,1);assert.match(view.container.querySelector('[role=alert]')!.textContent!,/History unavailable/);
      await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});assert.equal(calls,1);
      await act(async()=>view.container.querySelector('button')!.click());
      assert.equal(calls,2);assert.equal(view.container.querySelector('[role=alert]'),null);
      assert.match(view.container.textContent!,/No previous sessions/);await view.close();
    });
    await t.test('stale page and signed-out responses cannot replace current history',async()=>{
      let uid:string|null='owner';
      const current=()=>uid;
      const pending:Array<(value:ChantMe)=>void>=[];
      const load=()=>new Promise<ChantMe>(resolve=>pending.push(resolve));
      function Harness({page}:{page:number}){const history=useChantHistory(uid,page,0,load,current);return <p>{history.error||history.me?.totals.repetitions||'Loading'}</p>;}
      const view=await mount(<Harness page={0}/>);
      await view.render(<Harness page={1}/>);
      await act(async()=>pending[1]({...empty,totals:{sessions:1,repetitions:54}}));
      assert.equal(view.container.textContent,'54');
      await act(async()=>pending[0]({...empty,totals:{sessions:1,repetitions:999}}));
      assert.equal(view.container.textContent,'54');
      await view.render(<Harness page={2}/>);
      uid=null;await view.render(<Harness page={2}/>);
      await act(async()=>pending[2]({...empty,totals:{sessions:1,repetitions:999}}));
      assert.match(view.container.textContent!,/Sign in/);
      uid='owner';await view.render(<Harness page={3}/>);await view.close();
      await act(async()=>pending[3](empty));
    });
    await t.test('audio playback never counts or completes; only an explicit active counter click counts',async()=>{
      const media:ChantMedia[]=['audio','pronunciation','ambience'].map((type,index)=>({id:`media-${index}`,media_type:type,title:type,public_url:`https://media.example/${type}.mp3`,language_code:null,is_default:false}));
      media.push({...media[0],id:'unsafe',public_url:'javascript:alert(1)'});
      let counts=0;
      function Harness({status='active'}:{status?:'active'|'paused'|'completed'}){
        const [count,setCount]=useState(0);
        return <><ChantAudio media={media} language="original"/><ChantCounter session={{current_count:count,target_count:27,status}} busy={false} onCount={()=>{counts++;setCount(value=>value+1);}}/></>;
      }
      const view=await mount(<Harness/>);
      assert.equal(view.container.querySelectorAll('audio').length,3);
      assert.equal(view.container.querySelectorAll('section').length,3);
      await act(async()=>{for(const audio of view.container.querySelectorAll('audio'))for(const event of ['play','timeupdate','ended'])audio.dispatchEvent(new dom.window.Event(event,{bubbles:true}));});
      assert.equal(counts,0);assert.match(view.container.querySelector('button')!.textContent!,/OF 27/);
      await act(async()=>view.container.querySelector('button')!.click());assert.equal(counts,1);
      await view.render(<Harness status="paused"/>);await act(async()=>view.container.querySelector('button')!.click());assert.equal(counts,1);
      await view.render(<Harness status="completed"/>);await act(async()=>view.container.querySelector('button')!.click());assert.equal(counts,1);
      await view.close();
    });
  } finally { dom.window.close(); }
});
