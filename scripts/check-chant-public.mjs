// Read-only check using exactly the browser-safe project URL and public key.
// Prints counts/status only, never credentials, record contents or customer IDs.
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });
const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = process.env;
if (!url || !key) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
console.log(JSON.stringify({projectHost:new URL(url).hostname}));
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
for (const table of ['chant_categories', 'chants', 'chant_translations', 'chant_media']) {
  for (const publication of ['published', 'draft', 'archived']) {
    const { count, error, status } = await client.from(table)
      .select('id', { count: 'exact', head: true }).eq('status', publication)
      .abortSignal(AbortSignal.timeout(15000));
    console.log(JSON.stringify({ table, publication, status, count, errorCode: error?.code ?? null }));
    if (error || (publication !== 'published' && count !== 0)) process.exitCode = 1;
    if (status === 0) throw new Error('Supabase could not be reached; public reads were not verified.');
  }
}
for (const table of ['chant_identities', 'chant_sessions', 'user_chant_favourites']) {
  const { count, error, status } = await client.from(table)
    .select('id', { count: 'exact', head: true }).abortSignal(AbortSignal.timeout(15000));
  console.log(JSON.stringify({ table, status, count, errorCode: error?.code ?? null }));
  // A denied query or zero visible rows are both safe anonymous read outcomes.
  // Zero rows alone cannot prove that policies protect populated private tables.
  if (!error && count !== 0) process.exitCode = 1;
  if (error && status !== 401 && status !== 403) process.exitCode = 1;
}
// Validate the actual category relationship used by the discovery filter.
const categories = await client.from('chant_categories').select('*,chants!inner(id)')
  .eq('status','published').eq('chants.status','published').order('sort_order')
  .limit(1,{referencedTable:'chants'}).abortSignal(AbortSignal.timeout(15000));
console.log(JSON.stringify({operation:'published category relationship',status:categories.status,
  visibleCategories:categories.data?.length??null,errorCode:categories.error?.code??null}));
if(categories.error)process.exitCode=1;
const search = await client.from('chants').select('id').eq('status','published')
  .or('title.ilike."%test%",original_text.ilike."%test%",transliteration.ilike."%test%",short_description.ilike."%test%"')
  .limit(1).abortSignal(AbortSignal.timeout(15000));
console.log(JSON.stringify({operation:'title/text search schema',status:search.status,errorCode:search.error?.code??null}));
if(search.error)process.exitCode=1;
