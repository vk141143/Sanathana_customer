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
import type { Chant, ChantMe, ChantMedia, ChantSession, ChantTranslation } from '../src/lib/chant';

const empty:ChantMe={sessions:[],favourites:[],stats:[],resumable:[],totals:{sessions:0,repetitions:0},adminRole:null};

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
    await t.test('actual discovery view selects details, changes published language and starts the selected Japa counter',async()=>{
      const first={id:'11111111-1111-4111-8111-111111111111',title:'First published mantra',original_text:'First original',category_id:'cat',mantra_type:'mantra',default_repetition_target:27,available_targets:[27,54]} as Chant;
      const second={...first,id:'22222222-2222-4222-8222-222222222222',title:'Selected stotram',original_text:'द्वितीय मन्त्र\nमूल पाठ',mantra_type:'stotram',featured:true,cover_image_url:'https://media.example/cover.png'} as Chant;
      const translations=[{language_code:'te',meaning:'తెలుగు అర్థం',explanation:'తెలుగు వివరణ'},
        {language_code:'en',meaning:'English meaning',life_context:'Daily application'}] as ChantTranslation[];
      const calls:Array<{path:string;body:any}>=[],detailIds:string[]=[];
      let saved:ChantSession;
      const services:ChantExperienceServices={
        currentUid:()=> 'owner',subscribeAuth:listener=>{listener('owner');return()=>{};},renderAdmin:()=>null,
        library:async(_search,_category,_page,type)=>({chants:[first,second].filter(c=>!type||c.mantra_type===type),categories:[{id:'cat',name:'Published category',slug:'published',description:null,cover_image_url:null}],previews:{[second.id]:translations[0]}}),
        getPublishedChant:async id=>id===second.id?second:first,
        details:async id=>{detailIds.push(id);return {chant:id===second.id?second:first,translations,media:translations.map(t=>({id:t.language_code,title:t.language_code,language_code:t.language_code,media_type:'audio',is_default:true,public_url:`https://media.example/${t.language_code}.mp3`}))};},
        api:async<T,>(path:string,body?:unknown)=>{
          calls.push({path,body});
          if(path==='/sessions')saved={id:'session',chant_id:(body as any).chant_id,user_id:'owner',target_count:(body as any).target_count,language_code:(body as any).language_code,current_count:0,version:0,status:'active',duration_seconds:0,completed_malas:0,started_at:new Date().toISOString(),completed_at:null,reflection:null};
          else if(path.endsWith('/action'))saved={...saved,current_count:saved.current_count+1,version:saved.version+1};
          else throw new Error('Private history unavailable');
          return saved as T;
        },
      };
      const view=await mount(<StrictMode><ChantExperienceContent services={services} preferredLanguage="te" onClose={()=>{}} onComplete={()=>{}}/></StrictMode>);
      const button=(label:string)=>Array.from(view.container.querySelectorAll('button')).find(b=>b.textContent===label)!;
      try {
        await act(async()=>{await new Promise(resolve=>setTimeout(resolve,250));});
        assert.equal(calls.length,0);assert.equal(view.container.querySelectorAll('.chant-card').length,2);
        assert.match(view.container.querySelectorAll('.chant-card')[1].textContent!,/తెలుగు అర్థం/);
        const artwork=view.container.querySelector('img')!;
        await act(async()=>artwork.dispatchEvent(new dom.window.Event('error')));
        assert.equal(view.container.querySelectorAll('img').length,0);
        const type=view.container.querySelectorAll('select')[0];
        await act(async()=>{type.value='stotram';type.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
        await act(async()=>{await new Promise(resolve=>setTimeout(resolve,250));});
        assert.equal(view.container.querySelectorAll('.chant-card').length,1);
        await act(async()=>view.container.querySelector<HTMLButtonElement>('.chant-card')!.click());
        assert.deepEqual(detailIds,[second.id]);assert.match(view.container.textContent!,/द्वितीय मन्त्र/);
        assert.match(view.container.textContent!,/తెలుగు వివరణ/);assert.doesNotMatch(view.container.textContent!,/English meaning/);
        const language=view.container.querySelector('select')!;
        assert.equal(language.value,'te');assert.equal(language.querySelector<HTMLOptionElement>('option[value=ml]')!.disabled,true);
        await act(async()=>{language.value='en';language.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
        assert.match(view.container.textContent!,/English meaning/);assert.doesNotMatch(view.container.textContent!,/తెలుగు అర్థం/);
        assert.match(view.container.querySelector('audio')!.src,/en\.mp3$/);
        // Going back keeps the type filter and selection context.
        await act(async()=>view.container.querySelector<HTMLButtonElement>('[aria-label="Go back"]')!.click());
        await act(async()=>{await new Promise(resolve=>setTimeout(resolve,250));});
        assert.equal(view.container.querySelector('select')!.value,'stotram');
        await act(async()=>view.container.querySelector<HTMLButtonElement>('.chant-card')!.click());
        const detailLanguage=view.container.querySelector('select')!;
        await act(async()=>{detailLanguage.value='en';detailLanguage.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
        await act(async()=>button('54').click());
        await act(async()=>button('Begin chanting').click());
        assert.equal(calls.length,1);assert.equal(calls[0].path,'/sessions');
        assert.equal(calls[0].body.chant_id,second.id);assert.equal(calls[0].body.language_code,'en');assert.equal(calls[0].body.target_count,54);
        assert.match(view.container.querySelector('.chant-practice')!.textContent!,/English meaning/);
        assert.match(view.container.querySelector('.chant-counter')!.textContent!,/OF 54/);
        await act(async()=>view.container.querySelector<HTMLButtonElement>('.chant-counter')!.click());
        assert.equal(calls[1].path,'/sessions/session/action');assert.equal(calls[1].body.action,'tap');assert.equal(calls[1].body.version,0);
        assert.match(view.container.querySelector('.chant-counter')!.getAttribute('aria-label')!,/count 1/);
      } finally {await view.close();}
    });
    await t.test('actual catalogue distinguishes empty, failed and private-history failure states',async()=>{
      let mode:'empty'|'failure'|'published'='empty';
      let privateCalls=0;
      const chant={id:'visible',title:'Visible without account service',default_repetition_target:27,available_targets:[27],original_text:'Original'} as Chant;
      const services:ChantExperienceServices={currentUid:()=> 'owner',subscribeAuth:listener=>{listener('owner');return()=>{};},renderAdmin:()=>null,
        library:async()=>{if(mode==='failure')throw new Error('Public query failed');return {chants:mode==='published'?[chant]:[],categories:[]};},
        details:async()=>({chant,translations:[],media:[]}),getPublishedChant:async()=>chant,
        api:async()=>{privateCalls++;throw new Error('Private history unavailable');}};
      const view=await mount(<ChantExperienceContent services={services} onClose={()=>{}} onComplete={()=>{}}/>);
      const button=(label:string)=>Array.from(view.container.querySelectorAll('button')).find(b=>b.textContent===label)!;
      try {
        await act(async()=>{await new Promise(resolve=>setTimeout(resolve,250));});
        assert.match(view.container.textContent!,/No published mantras yet/);assert.match(view.container.textContent!,/Saved drafts remain private/);assert.equal(privateCalls,0);
        mode='failure';await act(async()=>button('Refresh library').click());
        await act(async()=>{await new Promise(resolve=>setTimeout(resolve,250));});
        assert.match(view.container.querySelector('[role=alert]')!.textContent!,/Public query failed/);assert.equal(view.container.querySelector('.chant-empty'),null);
        mode='published';await act(async()=>button('Retry catalogue').click());
        await act(async()=>{await new Promise(resolve=>setTimeout(resolve,250));});
        await act(async()=>button('history').click());assert.equal(privateCalls,1);
        await act(async()=>button('discover').click());assert.match(view.container.querySelector('.chant-card')!.textContent!,/Visible without account service/);
        await act(async()=>view.container.querySelector<HTMLButtonElement>('.chant-card')!.click());
        assert.match(view.container.textContent!,/No published audio/);assert.equal(view.container.querySelector('audio'),null);
        assert.equal(button('Begin chanting').disabled,false);
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
