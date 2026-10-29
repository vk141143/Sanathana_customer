import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { chantApi, chantLibrary, getPublishedChant, type Chant, type ChantMe } from '../../lib/chant';
import { useChantLibrary } from './useChantLibrary';

export function ChantHomeSection({onOpen}:{onOpen:()=>void}) {
 const [me,setMe]=useState<ChantMe|null>(null),[saved,setSaved]=useState<Chant[]>([]),[historyError,setHistoryError]=useState('');
 const {chants:library,error,loading}=useChantLibrary(chantLibrary,'','',0,0);
 const chants=library.slice(0,3);
 useEffect(()=>{
  let alive=true,generation=0;
  async function load(){
   const request=++generation,uid=auth.currentUser?.uid;
   setMe(null);setSaved([]);setHistoryError('');
   if(!uid)return;
   const current=()=>alive&&request===generation&&auth.currentUser?.uid===uid;
   try{
    const progress=await chantApi<ChantMe>('/me');
    if(!current())return;
    const favourites=await Promise.all(progress.favourites.slice(0,3).map(f=>getPublishedChant(f.chant_id)));
    if(current()){setMe(progress);setSaved(favourites.filter((c):c is Chant=>!!c));}
   }catch(error){if(current())setHistoryError((error as Error).message);}
  }
  const unsubscribe=onAuthStateChanged(auth,()=>{generation++;setMe(null);setSaved([]);setHistoryError('');});
  window.addEventListener('chant-progress',load);
  return()=>{alive=false;generation++;unsubscribe();window.removeEventListener('chant-progress',load);};
 },[]);
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());const daily=me?.stats.find(s=>s.practice_date===today);
 return <section className="mx-5 my-8 rounded-2xl border border-[#c7a777]/25 bg-[#19110c] p-5" aria-label="Daily chanting">
  <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] tracking-[0.2em] text-[#c7a777]">YOUR DAILY PRACTICE</p><h2 className="text-3xl mt-2 text-[#ead4ad]">A moment for mantra</h2></div><span className="text-4xl text-[#c7a777]" aria-hidden="true">ॐ</span></div>
  {loading?<p className="text-sm py-4 text-[#bdb2a4]">Loading Chant…</p>:error?<p className="text-sm py-4 text-[#bdb2a4]">Chant is temporarily unavailable. Open the library to retry.</p>:<><p className="text-sm py-4 text-[#bdb2a4]">{me?daily?.total_repetitions??0:'--'} repetitions · {me?daily?.completed_sessions??0:'--'} completed practices today</p>{chants.length?chants.map(c=><button key={c.id} onClick={onOpen} className="block w-full py-3 border-t border-[#c7a777]/15 text-left text-[#ead4ad]">{c.title} <span className="float-right">→</span></button>):<p className="text-sm text-[#bdb2a4] mb-4">Published mantras will appear here.</p>}{!!saved.length&&<p className="text-sm text-[#bdb2a4] my-3">Saved: {saved.map(c=>c.title).join(' · ')}</p>}</>}
  {historyError&&<p role="alert" className="text-sm py-3 text-[#bdb2a4]">{historyError}</p>}
  <button onClick={onOpen} className="w-full rounded-xl bg-[#d9b779] text-[#24180e] py-3 mt-4 font-semibold">{me?.resumable.length?'Continue practice':'Explore Chant library'}</button>
 </section>;
}
