import { CHANT_LANGUAGES } from '../../lib/chantLanguages';
import type { createChantCatalogue } from '../../lib/chantCatalog';
export interface ChantExperienceProps {
 onClose:()=>void;
 onComplete:(count:number)=>void;
 preferredLanguage?:string;
}
export interface ChantExperienceServices {
 api:<T>(path:string,body?:unknown,method?:string)=>Promise<T>;
 library:ReturnType<typeof createChantCatalogue>['chantLibrary'];
 details:ReturnType<typeof createChantCatalogue>['chantDetails'];
 getPublishedChant:ReturnType<typeof createChantCatalogue>['getPublishedChant'];
 currentUid:()=>string|null|undefined;
 subscribeAuth:(listener:(uid:string|null)=>void)=>()=>void;
 renderAdmin:(role:string)=>React.ReactNode;
}
import { ChantCounter } from './ChantCounter';
import { useChantHistory } from './useChantHistory';
import { useChantLibrary } from './useChantLibrary';
import { CHANT_TYPE_LABELS, configuredChantTargets, preferredChantLanguage } from '../../lib/chantCatalog';
import type { ChantType } from '../../lib/chant';
import { ChantCard } from './ChantCard';
import { ChantArtwork } from './ChantArtwork';
import { ChantTranslationContent } from './ChantTranslationContent';
import { ChantAudio } from './ChantAudio';


import { isSafePlayableUrl } from '../../services/sadhana/practiceCatalog';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Chant, ChantMe, ChantMedia, ChantSession, ChantTranslation } from '../../lib/chant';






export function ChantExperienceContent({onClose,onComplete,preferredLanguage='en',services}:ChantExperienceProps & {services:ChantExperienceServices}) {
 const loadChantHistory=useCallback((path:string)=>services.api<ChantMe>(path),[services]);
 const [tab,setTab]=useState('discover');
 const [mantraType,setMantraType]=useState<ChantType|''>('');
 const [catalogueLanguage,setCatalogueLanguage]=useState(()=>{
  const code=preferredLanguage.toLowerCase().split('-')[0];return code in CHANT_LANGUAGES?code:'original';
 });
 const [privateRequested,setPrivateRequested]=useState(false),[historyRevision,setHistoryRevision]=useState(0);
 const [selected,setSelected]=useState<Chant|null>(null);
 const [translations,setTranslations]=useState<ChantTranslation[]>([]),[media,setMedia]=useState<ChantMedia[]>([]);
 const [language,setLanguage]=useState('original'),[target,setTarget]=useState(0),[search,setSearch]=useState(''),[category,setCategory]=useState('');
 const [page,setPage]=useState(0),[historyPage,setHistoryPage]=useState(0),[session,setSession]=useState<ChantSession|null>(null),[reflection,setReflection]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[reload,setReload]=useState(0),[detailsReady,setDetailsReady]=useState(false);
 const {chants,categories,previews,previewError,loading,error:catalogueError}=useChantLibrary(services.library,search,category,page,reload,mantraType,catalogueLanguage);
 const lock=useRef(false),startKey=useRef(crypto.randomUUID()),notified=useRef(new Set<string>()),sessionRef=useRef(session),detailsRequest=useRef(0),dialogRef=useRef<HTMLDivElement>(null);sessionRef.current=session;
 const mounted=useRef(false),syncFailed=useRef(false);
 const [uid,setUid]=useState<string|null>(null);
 const {me,error:historyError,loading:historyLoading,refresh:refreshMe,clear:clearHistory}=useChantHistory(uid,historyPage,historyRevision,loadChantHistory,services.currentUid,privateRequested);
 useEffect(()=>{mounted.current=true;const unsubscribe=services.subscribeAuth(nextUid=>{setUid(nextUid);setPrivateRequested(false);setTab('discover');clearHistory();setSession(null);sessionRef.current=null;setReflection('');setHistoryPage(0);});return()=>{mounted.current=false;detailsRequest.current++;unsubscribe();};},[]);
 useEffect(()=>{const prior=document.body.style.overflow,focused=document.activeElement as HTMLElement|null;document.body.style.overflow='hidden';dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();return()=>{document.body.style.overflow=prior;focused?.focus();};},[]);
 async function open(chant:Chant) {
  const request=++detailsRequest.current;
  setSelected(chant);setTarget(chant.default_repetition_target);setLanguage('original');setDetailsReady(false);setTranslations([]);setMedia([]);setError('');startKey.current=crypto.randomUUID();
  try {const detail=await services.details(chant.id);if(!mounted.current||request!==detailsRequest.current)return;setSelected(detail.chant);setTarget(detail.chant.default_repetition_target);setLanguage(preferredChantLanguage(detail.translations,catalogueLanguage));setTranslations(detail.translations);setMedia(detail.media);setDetailsReady(true);}catch(e){if(mounted.current&&request===detailsRequest.current)setError((e as Error).message);}
 }
 async function act(action:string) {
  const current=sessionRef.current;if(!current||lock.current||(action==='heartbeat'&&syncFailed.current))return;lock.current=true;setBusy(true);setError('');
  try {
   const actor=services.currentUid();const next=await services.api<ChantSession>(`/sessions/${current.id}/action`,{action,version:current.version,reflection:action==='complete'?reflection:undefined});if(!mounted.current||services.currentUid()!==actor)return;syncFailed.current=false;sessionRef.current=next;setSession(next);
   if(next.status==='completed'&&!notified.current.has(next.id)){notified.current.add(next.id);onComplete(next.current_count);window.dispatchEvent(new Event('chant-progress'));await refreshMe();}
  }catch(e){syncFailed.current=true;if(!mounted.current)return;setError((e as Error).message);try{const data=await refreshMe();if(!mounted.current||!data)return;const saved=[...data.sessions,...data.resumable].find(s=>s.id===current.id);if(saved){sessionRef.current=saved;setSession(saved);}}catch{/* Keep last acknowledged state. */}}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 }
 const actRef=useRef(act);actRef.current=act;
 useEffect(()=>{
  const timer=setInterval(()=>{if(document.visibilityState==='visible'&&sessionRef.current?.status==='active')void actRef.current('heartbeat');},15000);
  const hide=()=>{if(document.visibilityState==='hidden'&&sessionRef.current?.status==='active')void actRef.current('pause');};document.addEventListener('visibilitychange',hide);
  return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',hide);};
 },[]);
 async function resume(saved:ChantSession) {
  const actor=services.currentUid();
  setError('');setBusy(true);try {const chant=await services.getPublishedChant(saved.chant_id);if(!mounted.current||services.currentUid()!==actor)return;if(chant)await open(chant);else{setSelected(null);setMedia([]);setTranslations([]);setError('This mantra is no longer published. Your saved session is still available.');}if(!mounted.current||services.currentUid()!==actor)return;setSession(saved);sessionRef.current=saved;setReflection(saved.reflection||'');}catch(e){if(mounted.current)setError((e as Error).message);}finally{if(mounted.current)setBusy(false);}
 }
 async function start() {
  const actor=services.currentUid();
  if(!selected||lock.current)return;lock.current=true;setBusy(true);setError('');try{const saved=await services.api<ChantSession>('/sessions',{chant_id:selected.id,target_count:target,client_session_key:startKey.current,language_code:language==='original'?null:language});if(!mounted.current||services.currentUid()!==actor)return;setSession(saved);sessionRef.current=saved;setReflection('');}catch(e){if(mounted.current)setError((e as Error).message);}finally{lock.current=false;if(mounted.current)setBusy(false);}
 }
 async function favourite(chant:Chant) {
  const actor=services.currentUid();
  if(!actor){setError('Please sign in to save a favourite.');return;}
  setBusy(true);try{const account=me??await refreshMe();if(!account||!mounted.current||services.currentUid()!==actor)return;const saved=account.favourites.some(f=>f.chant_id===chant.id);await services.api(`/favourites/${chant.id}`,undefined,saved?'DELETE':'PUT');await refreshMe();if(!mounted.current)return;window.dispatchEvent(new Event('chant-progress'));}catch(e){if(mounted.current)setError((e as Error).message);}finally{if(mounted.current)setBusy(false);}
 }
 async function back(close=false) {
  if(lock.current)return;if(sessionRef.current?.status==='active'){await act('pause');if(sessionRef.current?.status==='active')return;}
  if(!mounted.current)return;detailsRequest.current++;if(close){onClose();return;}setSession(null);sessionRef.current=null;setSelected(null);setReload(v=>v+1);
 }
 const translation=translations.find(t=>t.language_code===language),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date()),todayStats=me?.stats.find(s=>s.practice_date===today);
 const [favouriteChants,setFavouriteChants]=useState<Chant[]>([]);
 useEffect(()=>{let alive=true;if(tab==='favourites')Promise.all((me?.favourites||[]).map(f=>services.getPublishedChant(f.chant_id))).then(rows=>alive&&setFavouriteChants(rows.filter((c):c is Chant=>!!c))).catch(e=>alive&&setError(e.message));return()=>{alive=false;};},[tab,me?.favourites]);
 const shown=tab==='favourites'?favouriteChants:chants;
 return <div ref={dialogRef} className="chant-shell" role="dialog" aria-modal="true" aria-label="Chant practice" onKeyDown={event=>{
  if(event.key==='Escape'){event.preventDefault();void back(true);}
  if(event.key==='Tab'){const items=Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),audio[controls]')||[]).filter(el=>el.getClientRects().length);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
 }}><div className="chant-container">
  <header className="chant-header"><button onClick={()=>void back(selected||session?false:true)} disabled={busy} aria-label="Go back">←</button><div><span className="chant-eyebrow">SANATANA · DAILY SADHANA</span><h1>Chant</h1></div><button onClick={()=>void back(true)} disabled={busy} aria-label="Close Chant">✕</button></header>
  {(tab==='history'||tab==='favourites'||privateRequested)&&historyError&&<div className="chant-error" role="alert">{historyError} {uid&&<button onClick={()=>setHistoryRevision(v=>v+1)}>Retry history</button>}</div>}
  {error&&<div className="chant-error" role="alert">{error} <button onClick={()=>{setError('');setReload(v=>v+1);if(selected)void open(selected);}}>Retry</button></div>}
  {session ? <section className="chant-practice">
   <span className="chant-eyebrow">{session.status==='completed'?'PRACTICE COMPLETE':'ONE REPETITION. ONE MOMENT OF PRESENCE.'}</span><h2>{selected?.title||'Saved practice'}</h2><p className="chant-original">{selected?.original_text}</p><p>{selected?.transliteration}</p>
   <ChantTranslationContent translation={translations.find(t=>t.language_code===session.language_code)}/><ChantAudio key={selected?.id} media={media} language={session.language_code}/>
   <ChantCounter session={session} busy={busy} onCount={()=>void act('tap')}/>
   <p>{session.completed_malas} malas · {Math.floor(session.duration_seconds/60)} min {session.duration_seconds%60} sec</p>
   {session.current_count>=session.target_count&&session.status!=='completed'&&<p className="chant-gold">Your target is reached. Continue chanting or finish when you’re ready.</p>}
   {['active','paused'].includes(session.status)?<><div className="chant-actions"><button disabled={busy||session.status!=='active'||session.current_count===0} onClick={()=>void act('undo')}>Undo last count</button><button disabled={busy} onClick={()=>void act(session.status==='active'?'pause':'resume')}>{session.status==='active'?'Pause':'Resume'}</button></div><label className="chant-field">Reflection<textarea maxLength={2000} value={reflection} onChange={e=>setReflection(e.target.value)} placeholder="How do you feel? (optional)"/></label><button className="chant-primary" disabled={busy||session.current_count===0} onClick={()=>void act('complete')}>Finish & save practice</button><button className="chant-link" disabled={busy} onClick={()=>void act('abandon')}>Abandon session</button><p className="chant-muted" role="status">{busy?'Saving…':'Every accepted tap is saved. Leave this page to pause.'}</p></>:<><p>{session.status==='completed'?'Your practice is saved to your history.':'This session will not count toward your progress.'}</p><button className="chant-primary" onClick={()=>void back()}>Return to library</button></>}
  </section> : selected ? <section className="chant-detail">
   <ChantArtwork src={selected.cover_image_url} detail/><div className="chant-title-row"><h2>{selected.title}</h2><button disabled={busy} onClick={()=>void favourite(selected)}>{me?.favourites.some(f=>f.chant_id===selected.id)?'♥ Saved':'♡ Save'}</button></div><p>{selected.short_description}</p>{categories.find(c=>c.id===selected.category_id)&&<p className="chant-eyebrow">{categories.find(c=>c.id===selected.category_id)?.name}</p>}<p className="chant-muted">{selected.mantra_type?.replace(/_/g,' ')}{selected.featured?' · Featured':''}</p>
   <div className="chant-scripture"><p className="chant-original">{selected.original_text}</p><p>{selected.transliteration}</p>{selected.pronunciation_guide&&<p>Pronunciation: {selected.pronunciation_guide}</p>}</div>
   <label className="chant-field">Meaning language<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="original">Original only</option>{Object.entries(CHANT_LANGUAGES).map(([code,name])=><option key={code} value={code} disabled={!translations.some(t=>t.language_code===code)}>{name}{!translations.some(t=>t.language_code===code)?' — unavailable':''}</option>)}</select></label>
   {!detailsReady&&<p>Loading language and audio details…</p>}<ChantTranslationContent translation={translation}/>{detailsReady&&language==='original'&&<p className="chant-muted">Original text is shown. Select an available language to read its published meaning.</p>}
   <ChantAudio key={selected?.id} media={media} language={language}/>
   {(selected.source_title||selected.source_reference)&&<p className="chant-muted">Source: {selected.source_title} {selected.source_reference}</p>}<h3>Set your intention</h3><div className="chant-actions">{configuredChantTargets(selected).map(n=><button className={target===n?'selected':''} key={n} onClick={()=>setTarget(n)}>{n}</button>)}</div><button className="chant-primary" disabled={busy||!detailsReady||!configuredChantTargets(selected).includes(target)} onClick={()=>void start()}>Begin chanting</button><p className="chant-muted">Free, ad-free practice. You can continue beyond your target.</p>
  </section> : <>
   <section className="chant-intro"><span className="chant-eyebrow">A QUIETER MIND, ONE MANTRA AT A TIME</span><h2>Return to the sacred.</h2><p>Discover a mantra, understand its meaning, and make space for your daily practice.</p><div className="chant-stats"><div><strong>{me?todayStats?.total_repetitions??0:'--'}</strong><span>repetitions today</span></div><div><strong>{me?todayStats?.completed_sessions??0:'--'}</strong><span>practices today</span></div><div><strong>{me?Math.floor((todayStats?.total_duration_seconds??0)/60):'--'}</strong><span>minutes today</span></div></div></section>
   {!privateRequested&&<button className="chant-link" onClick={()=>setPrivateRequested(true)}>Load saved practice &amp; progress</button>}{!!me?.resumable.length&&<section className="chant-continue"><h3>Continue your practice</h3>{me.resumable.map(s=><button key={s.id} disabled={busy} onClick={()=>void resume(s)}>{s.current_count} / {s.target_count} repetitions · {new Date(s.started_at).toLocaleDateString()} →</button>)}</section>}
   <nav className="chant-tabs" aria-label="Chant sections">{['discover','favourites','history',...(me?.adminRole?['admin']:[])].map(t=><button key={t} className={tab===t?'selected':''} onClick={()=>{setTab(t);if(t!=='discover')setPrivateRequested(true);}}>{t==='admin'?'Manage Chant':t}</button>)}</nav>
   {tab==='admin'?services.renderAdmin(me!.adminRole!) : tab==='history'?<section><h2>Your practice history</h2>{historyLoading?<p role="status">Loading history...</p>:historyError?null:me?.sessions.length?me.sessions.map(s=><article className="chant-history" key={s.id}><div><strong>{s.current_count} repetitions</strong><p>{s.status} · {Math.floor(s.duration_seconds/60)} min · {new Date(s.started_at).toLocaleString()}</p>{s.reflection&&<p>{s.reflection}</p>}</div><button onClick={()=>void resume(s)}>View</button></article>):<p className="chant-empty">Your saved sessions will appear here.</p>}<div className="chant-actions"><button disabled={historyPage===0} onClick={()=>setHistoryPage(p=>p-1)}>Previous</button><span>Page {historyPage+1}</span><button disabled={(me?.sessions.length??0)<20} onClick={()=>setHistoryPage(p=>p+1)}>Next</button></div></section>:<>
    {tab==='discover'&&<>
     <div className="chant-discovery-filters">
      <label className="chant-field">Search mantras<input type="search" placeholder="Search title, mantra text or transliteration" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/></label>
      <label className="chant-field">Practice type<select value={mantraType} onChange={e=>{setMantraType(e.target.value as ChantType|'');setPage(0);}}><option value="">All types</option>{Object.entries(CHANT_TYPE_LABELS).map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label>
      <label className="chant-field">Preview language<select value={catalogueLanguage} onChange={e=>setCatalogueLanguage(e.target.value)}><option value="original">Original only</option>{Object.entries(CHANT_LANGUAGES).map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label>
     </div>
     <div className="chant-categories"><button className={!category?'selected':''} onClick={()=>{setCategory('');setPage(0);}}>All mantras</button>{categories.map(c=><button className={category===c.id?'selected':''} key={c.id} onClick={()=>{setCategory(c.id);setPage(0);}}>{isSafePlayableUrl(c.icon_url)&&<img src={c.icon_url!} alt="" width={20} height={20}/>} {c.name}</button>)}</div>
     <div className="chant-results-heading"><h3>Mantra library</h3><span className="chant-muted">Mantras · Nama Japa · Stotrams</span></div>
     {previewError&&<div className="chant-preview-notice" role="alert">{previewError} <button onClick={()=>setReload(v=>v+1)}>Retry previews</button></div>}
    </>}
    {tab==='discover'&&catalogueError?<div className="chant-error" role="alert">{catalogueError} <button onClick={()=>setReload(v=>v+1)}>Retry catalogue</button></div>
     :tab==='favourites'&&historyError?<p className="chant-empty">Saved chants could not be loaded.</p>
     :(tab==='discover'&&loading)||(tab==='favourites'&&historyLoading)?<p role="status">Loading mantras…</p>
     :shown.length?<div className="chant-grid">{shown.map(c=><ChantCard key={c.id} chant={c} category={categories.find(k=>k.id===c.category_id)?.name} translation={previews?.[c.id]} onSelect={chant=>void open(chant)}/>)}</div>
     :<div className="chant-empty" role="status"><h3>{tab==='favourites'?'Your saved mantras':search||category||mantraType||page?'No matching mantras':'No published mantras yet'}</h3>
       <p>{tab==='favourites'?'Save a mantra to keep it close to your heart.':search||category||mantraType||page?'Try another search, category or practice type.':'Only published mantras appear here. Saved drafts remain private until they and their assigned categories are published.'}</p>
       {tab==='discover'&&<button onClick={()=>{setSearch('');setCategory('');setMantraType('');setPage(0);setReload(v=>v+1);}}>{search||category||mantraType||page?'Clear filters':'Refresh library'}</button>}
      </div>}
    {tab==='discover'&&<div className="chant-actions"><button disabled={page===0||loading} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page+1}</span><button disabled={chants.length<24||loading} onClick={()=>setPage(p=>p+1)}>Next</button></div>}
   </>}
  </>}
 </div></div>;
}
