import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeSadhanaPractice, PRACTICE_COLUMNS, getPracticeMedia, isMalaCounterEnabled, isSafePlayableUrl, type SadhanaPractice } from '../services/sadhana/practiceCatalog';

export type ChantPractice = SadhanaPractice & { category:'mantra'|'japa'; created_at:string|null; updated_at:string|null };
export const CHANT_PRACTICE_COLUMNS = `${PRACTICE_COLUMNS},created_at,updated_at`;
export const PRACTICE_CHANT_CATEGORIES = {mantra:'Mantra',japa:'Japa'} as const;
const record = (value:unknown):Record<string,unknown> => value!==null && typeof value==='object' && !Array.isArray(value) ? value as Record<string,unknown> : {};
const text = (value:unknown) => typeof value==='string' && value.trim() ? value : null;
const count = (value:unknown) => typeof value==='number' && Number.isSafeInteger(value) && value>0 && value<=1000000 ? value : null;

export function normalizeChantPractice(value:unknown):ChantPractice|null {
  const practice=normalizeSadhanaPractice(value),raw=record(value);
  if(!practice || !['mantra','japa'].includes(practice.category) || !practice.is_active || practice.archived_at!==null)return null;
  return {...practice,category:practice.category as ChantPractice['category'],created_at:text(raw.created_at),updated_at:text(raw.updated_at)};
}

export function practiceChantContent(practice:ChantPractice,language:string) {
  const config=practice.category_config;
  const selected=record(record(config.localized_content)[language.toLowerCase().split('-')[0]]);
  const localizedMeaning=text(selected.meaning),localizedInstructions=text(selected.instructions);
  // Base content has no declared language; never label it as the requested language.
  return {
    mantraName:text(config.mantra_name),originalText:text(config.mantra_text),transliteration:text(config.transliteration),
    meaning:localizedMeaning??text(config.meaning),meaningIsLocalized:!!localizedMeaning,
    instructions:localizedInstructions??practice.instructions,instructionsAreLocalized:!!localizedInstructions,
    counterInstructions:text(config.counter_instructions),
  };
}

export function practiceChantCounter(practice:ChantPractice) {
  const config=practice.category_config;
  const target=count(config.count_preset)??(practice.target_type==='repetitions'?count(practice.target_count):null);
  const enabled=config.counter_enabled===true || (config.counter_enabled===undefined && practice.practice_mode==='repetition' && practice.target_type==='repetitions');
  return {enabled:enabled&&config.counter_enabled!==false,target,malaEnabled:isMalaCounterEnabled(practice),instructions:text(config.counter_instructions)};
}

export function practiceChantArtwork(practice:ChantPractice) {
  if(isSafePlayableUrl(practice.cover_image_url))return practice.cover_image_url;
  return practice.media_type && /image/i.test(practice.media_type) && isSafePlayableUrl(practice.media_url)?practice.media_url:null;
}
export {getPracticeMedia as practiceChantMedia};

export function filterChantPractices(practices:ChantPractice[],search='',category='') {
  const term=search.trim().toLocaleLowerCase();
  return practices.filter(practice=>{
    if(category&&practice.category!==category)return false;
    const content=practiceChantContent(practice,'original');
    return !term || [practice.name,practice.subtitle,practice.description,content.mantraName,content.originalText,content.transliteration]
      .some(value=>value?.toLocaleLowerCase().includes(term));
  });
}

export function createPracticeChantCatalogue(client:SupabaseClient) {
  const query=()=>client.from('sadhana_practices').select(CHANT_PRACTICE_COLUMNS)
    .eq('is_active',true).is('archived_at',null).in('category',['mantra','japa']);
  let pending:Promise<ChantPractice[]>|null=null;
  async function fetchAll() {
    const records:ChantPractice[]=[];
    // Explicit stable ranges avoid silently truncating at Supabase's row limit.
    for(let offset=0;;offset+=200){
      const {data,error}=await query().order('display_order',{ascending:true}).order('name',{ascending:true}).order('id',{ascending:true}).range(offset,offset+199);
      if(error){console.warn('Chant practice catalogue failed',{operation:'active mantra/japa list',code:error.code});throw new Error('Unable to load mantra and Japa practices. Please retry.');}
      for(const row of data??[]){const practice=normalizeChantPractice(row);if(practice)records.push(practice);}
      if((data?.length??0)<200)break;
    }
    return records;
  }
  return {
    async list():Promise<ChantPractice[]> {
      if(pending)return pending;
      const request=fetchAll();pending=request;
      try{return await request;}finally{if(pending===request)pending=null;}
    },
    async detail(id:string):Promise<ChantPractice> {
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new Error('Invalid practice ID.');
      const {data,error}=await query().eq('id',id).maybeSingle();
      if(error){console.warn('Chant practice detail failed',{operation:'active practice detail',code:error.code});throw new Error('Unable to load this practice. Please retry.');}
      const practice=normalizeChantPractice(data);
      if(!practice)throw new Error('This mantra or Japa practice is no longer available.');
      return practice;
    },
  };
}
