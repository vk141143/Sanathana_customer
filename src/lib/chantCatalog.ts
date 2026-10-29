import type { SupabaseClient } from '@supabase/supabase-js';
import type { Chant, ChantCategory, ChantMedia, ChantTranslation, ChantType } from './chant';

export const CHANT_TYPE_LABELS: Record<ChantType, string> = { mantra: 'Mantra', nama_japa: 'Nama Japa', stotram: 'Stotram' };
export interface ChantLibraryResult {
  chants: Chant[];
  categories: ChantCategory[];
  previews?: Record<string, ChantTranslation>;
  previewError?: string;
}

// Keep diagnostics limited to operation/code; never log keys, customer IDs or query text.
function catalogueDiagnostic(operation: string, code?: string) {
  console.warn('Chant catalogue:', { operation, code: code || 'UNKNOWN',
    check: 'Check the configured Supabase project, publication status, published parent category and public RLS policies.' });
}

export function configuredChantTargets(chant: Pick<Chant, 'default_repetition_target' | 'available_targets'>): number[] {
  return [...new Set([chant.default_repetition_target, ...(chant.available_targets ?? [])])]
    .filter(value => Number.isInteger(value) && value >= 1 && value <= 1000000);
}

export function preferredChantLanguage(translations: ChantTranslation[], preference: string): string {
  const language = preference.toLowerCase().split('-')[0];
  return translations.some(row => row.language_code === language) ? language : 'original';
}

export function createChantCatalogue(client: SupabaseClient) {
  async function publishedChant(id: string): Promise<Chant | null> {
    const { data, error } = await client.from('chants').select('*').eq('id', id).eq('status', 'published').maybeSingle();
    if (error) { catalogueDiagnostic('load mantra', error.code); throw new Error('Unable to load mantra. Please retry.'); }
    if (!data) return null;
    if (data.category_id) {
      const category = await client.from('chant_categories').select('id').eq('id', data.category_id).eq('status', 'published').maybeSingle();
      if (category.error) throw new Error('Unable to load mantra category. Please retry.');
      if (!category.data) return null;
    }
    return data;
  }
  return {
    getPublishedChant: publishedChant,
    async chantLibrary(search = '', category = '', page = 0, mantraType: ChantType | '' = '', language = ''): Promise<ChantLibraryResult> {
      if (!Number.isSafeInteger(page) || page < 0 || page > 100000) throw new Error('Choose a valid library page.');
      if (mantraType && !(mantraType in CHANT_TYPE_LABELS)) throw new Error('Choose a valid mantra type.');
      let query = client.from('chants').select('*').eq('status', 'published').order('featured', { ascending: false }).order('sort_order').order('id');
      // Quote values and remove PostgREST filter syntax, preserving Indic text.
      const term = search.replace(/[,%_*()"\\]/g, ' ').trim();
      if (term) query = query.or(['title','original_text','transliteration','short_description'].map(column => `${column}.ilike."%${term}%"`).join(','));
      if (category) query = query.eq('category_id', category);
      if (mantraType) query = query.eq('mantra_type', mantraType);
      const [chants, categories] = await Promise.all([
        query.range(page * 24, page * 24 + 23),
        // Inner relation is only for category navigation: optional translations/media
        // never participate in the primary chant query or remove a mantra from it.
        client.from('chant_categories').select('*,chants!inner(id)').eq('status', 'published')
          .eq('chants.status', 'published').order('sort_order').limit(1, { referencedTable: 'chants' }),
      ]);
      if (chants.error || categories.error) {
        catalogueDiagnostic(chants.error ? 'load mantras' : 'load categories', (chants.error || categories.error)?.code);
        throw new Error('The Chant library could not be loaded. Please try again.');
      }
      const visibleCategories = categories.data as unknown as ChantCategory[];
      const visibleChants = (chants.data as Chant[]).filter(row => !row.category_id || visibleCategories.some(item => item.id === row.category_id));
      if (!visibleChants.length && !search && !category && !mantraType && page === 0) catalogueDiagnostic('no publicly visible published mantras', 'EMPTY_VISIBLE_CATALOGUE');
      const previews: Record<string, ChantTranslation> = {};
      let previewError: string | undefined;
      if (visibleChants.length && ['en','te','hi','kn','ta','ml'].includes(language)) {
        const translations = await client.from('chant_translations').select('*').eq('status','published')
          .eq('language_code',language).in('chant_id',visibleChants.map(row=>row.id));
        if (translations.error) {
          catalogueDiagnostic('load meaning previews', translations.error.code);
          previewError = 'Meaning previews could not be loaded. You can still open a mantra; retry the catalogue to reload previews.';
        } else for (const translation of translations.data as ChantTranslation[]) {
          if (translation.chant_id) previews[translation.chant_id] = translation;
        }
      }
      return {
        chants: visibleChants,
        categories: visibleCategories,
        previews,
        previewError,
      };
    },
    async chantDetails(id: string) {
      // Recheck availability when opening a cached card or guessing an ID.
      const chant = await publishedChant(id);
      if (!chant) throw new Error('This published chant is no longer available.');
      const [translations, media] = await Promise.all([
        client.from('chant_translations').select('*').eq('chant_id', id).eq('status', 'published'),
        client.from('chant_media').select('*').eq('chant_id', id).eq('status', 'published').order('is_default', { ascending: false }).order('display_order'),
      ]);
      if (translations.error || media.error) throw new Error('Unable to load mantra details. Please retry.');
      return { chant, translations: translations.data as ChantTranslation[], media: media.data as ChantMedia[] };
    },
  };
}
