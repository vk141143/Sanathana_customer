import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({path:['.env.local','.env'],quiet:true});
const url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_ANON_KEY;
if(!url||!key)throw new Error('Public Supabase configuration is missing.');
console.log(JSON.stringify({projectHost:new URL(url).hostname}));
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const columns='id,name,slug,subtitle,description,category,instructions,difficulty,practice_mode,target_type,target_count,target_unit,duration_minutes,completion_rule,time_of_day,is_featured,benefits,tags,display_order,category_config,cover_image_url,guided_audio_url,ambient_audio_url,media_type,media_url,is_active,archived_at,created_at,updated_at';
const result=await client.from('sadhana_practices').select(columns,{count:'exact'})
  .eq('is_active',true).is('archived_at',null).in('category',['mantra','japa'])
  .order('display_order').order('name').order('id').range(0,199).abortSignal(AbortSignal.timeout(15000));
console.log(JSON.stringify({operation:'active mantra/japa catalogue',status:result.status,count:result.count,errorCode:result.error?.code??null}));
if(result.error){console.log(JSON.stringify({message:result.error.message}));process.exitCode=1;}
else for(const row of result.data){const config=row.category_config??{};console.log(JSON.stringify({id:row.id,name:row.name,category:row.category,is_active:row.is_active,archived_at:row.archived_at,
  practice_mode:row.practice_mode,target_type:row.target_type,target_count:row.target_count,target_unit:row.target_unit,duration_minutes:row.duration_minutes,completion_rule:row.completion_rule,
  configKeys:Object.keys(config),count_preset:config.count_preset,counter_enabled:config.counter_enabled,mala_counter:config.mala_counter,
  languages:Object.keys(config.localized_content??{}),hasMantraText:!!config.mantra_text,hasCover:!!row.cover_image_url,hasGuidedAudio:!!row.guided_audio_url,hasAmbientAudio:!!row.ambient_audio_url}));}
for(const filter of ['inactive','archived']){
  let query=client.from('sadhana_practices').select('id',{count:'exact',head:true});
  query=filter==='inactive'?query.eq('is_active',false):query.not('archived_at','is',null);
  const response=await query.abortSignal(AbortSignal.timeout(15000));
  console.log(JSON.stringify({operation:filter+' public visibility',status:response.status,count:response.count,errorCode:response.error?.code??null}));
  if(response.error||response.count!==0)process.exitCode=1;
}
