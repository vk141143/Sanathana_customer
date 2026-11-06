import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { createPracticeChantCatalogue, CHANT_PRACTICE_COLUMNS, normalizeChantPractice, practiceChantContent, practiceChantCounter, practiceChantMedia } from '../src/lib/practiceChantCatalog';
import { PRACTICE_COLUMNS } from '../src/services/sadhana/practiceCatalog';

// Independent schema contract supplied by the database owner, not derived from the SELECT.
const columns = new Set('id name slug description category instructions target_count duration_minutes media_url display_order is_active archived_at created_at updated_at media_type subtitle difficulty practice_mode target_type target_unit completion_rule time_of_day is_featured benefits tags category_config cover_image_url guided_audio_url ambient_audio_url meditation_category_id'.split(' '));
const japa = {
  id:'d372156c-e861-47cb-bc94-3a55849efeb2',name:'Hare Krishna Maha Mantra Japa',slug:'hare-krishna-maha-mantra-japa',category:'japa',
  is_active:true,archived_at:null,display_order:1,target_count:15,duration_minutes:15,practice_mode:'timer',target_type:'duration',difficulty:'beginner',
  category_config:{mantra_name:'Maha Mantra',mantra_text:'Fixture source text',transliteration:'Fixture transliteration',meaning:'Fixture meaning',count_preset:108,mala_counter:true,counter_enabled:true,counter_instructions:'Fixture instructions',
    localized_content:Object.fromEntries(['en','hi','kn','ml','ta','te'].map(lang=>[lang,{meaning:`${lang} meaning`,instructions:`${lang} instructions`}])),
  },
};
const mantra={...japa,id:'11111111-1111-4111-8111-111111111111',name:'Active Mantra',category:'mantra'};
function catalogue(rows:Record<string,unknown>[], failFirst=false) {
  let calls=0;
  const client=createClient('https://schema-test.supabase.co','test-anon-key',{auth:{persistSession:false},global:{fetch:async(input)=>{
    calls++; const url=new URL(String(input));
    assert.equal(url.pathname,'/rest/v1/sadhana_practices');
    const invalid=(url.searchParams.get('select')??'').split(',').find(column=>!columns.has(column));
    for(const key of url.searchParams.keys()) if(!['select','order','offset','limit'].includes(key)) assert.ok(columns.has(key),`Unknown filter ${key}`);
    for(const order of url.searchParams.get('order')!.split(',')) assert.ok(columns.has(order.split('.')[0]));
    if(invalid||failFirst&&calls===1)return new Response(JSON.stringify({code:'42703',message:`column ${invalid??'missing'} does not exist`,details:'schema mismatch',hint:'check selection'}),{status:400,headers:{'Content-Type':'application/json'}});
    assert.equal(url.searchParams.get('is_active'),'eq.true');assert.equal(url.searchParams.get('archived_at'),'is.null');assert.equal(url.searchParams.get('category'),'in.(mantra,japa)');
    assert.equal(url.searchParams.get('order'),'display_order.asc,name.asc,id.asc');
    const data=rows.filter(row=>row.is_active===true&&row.archived_at===null&&['japa','mantra'].includes(String(row.category)));
    return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
  }}});
  return createPracticeChantCatalogue(client);
}
test('shared and Japa selections contain only confirmed sadhana_practices columns',()=>{
  for(const selection of [PRACTICE_COLUMNS,CHANT_PRACTICE_COLUMNS]) for(const column of selection.split(',')) assert.ok(columns.has(column),column);
});
test('actual Supabase query retrieves active Japa and Mantra separately and together, excluding inactive/archived/other categories',async()=>{
  for(const rows of [[japa],[mantra],[japa,mantra]]){
    const result=await catalogue([...rows,{...japa,is_active:false},{...japa,archived_at:'2026-01-01'},{...japa,category:'meditation'}]).list();
    assert.deepEqual(result.map(row=>row.id),rows.map(row=>row.id));
  }
});
test('confirmed Hare Krishna record shape retains duration, 108-count preset, six translations and optional media safety',()=>{
  const practice=normalizeChantPractice(japa)!;
  assert.equal(practice.id,japa.id);assert.equal(practice.target_count,15);assert.equal(practice.duration_minutes,15);
  assert.equal(practiceChantCounter(practice).target,108);assert.equal(practiceChantCounter(practice).malaEnabled,true);
  for(const lang of ['en','hi','kn','ml','ta','te'])assert.equal(practiceChantContent(practice,lang).meaning,`${lang} meaning`);
  assert.deepEqual(practiceChantMedia(practice),[]);
  for(const config of [null,[],false,'invalid'])assert.deepEqual(normalizeChantPractice({...japa,category_config:config})?.category_config,{});
});
test('Supabase errors include diagnostics and rejected loads can be retried',async()=>{
  const original=console.warn,logs:unknown[][]=[];console.warn=(...args)=>logs.push(args);
  try {
    const service=catalogue([japa],true);
    await assert.rejects(service.list(),/Unable to load mantra and Japa practices/);
    assert.deepEqual(logs[0][1],{operation:'active mantra/japa list',code:'42703',message:'column missing does not exist',details:'schema mismatch',hint:'check selection'});
    assert.equal((await service.list())[0].id,japa.id);
  } finally {console.warn=original;}
});
