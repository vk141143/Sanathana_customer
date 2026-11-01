import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  fetchFestivalDetail,
  fetchFestivalList,
  filterFestivalList,
  festivalCache,
  isFestivalDetailCache,
  isFestivalListCache,
  mapFestivalListData,
  selectCurrentYearOccurrence,
  selectFestivalContent,
  selectFestivalCover,
  selectRelevantOccurrence,
} from '../src/lib/festivalData';
import type {
  Festival,
  FestivalContent,
  FestivalMedia,
  FestivalOccurrence,
  FestivalSettings,
} from '../src/types';

const festival = (id: string, overrides: Partial<Festival> = {}): Festival => ({
  id,
  name: `Festival ${id}`,
  alternate_name: null,
  slug: `festival-${id}`,
  festival_type: 'major_festival',
  short_description: null,
  primary_deity: null,
  associated_deities: [],
  tradition: 'general',
  status: 'Published',
  is_active: true,
  cover_media_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const occurrence = (
  id: string,
  festivalId: string,
  year: number,
  overrides: Partial<FestivalOccurrence> = {},
): FestivalOccurrence => ({
  id,
  festival_id: festivalId,
  year,
  festival_date: `${year}-10-20`,
  tithi_name: null,
  paksha: null,
  nakshatra_name: null,
  yoga_name: null,
  shubha_muhurta_start: null,
  shubha_muhurta_end: null,
  puja_time_start: null,
  puja_time_end: null,
  rahu_kalam_start: null,
  rahu_kalam_end: null,
  yamagandam_start: null,
  yamagandam_end: null,
  gulika_kalam_start: null,
  gulika_kalam_end: null,
  fasting_enabled: false,
  fasting_type: null,
  parana_required: false,
  parana_time: null,
  fasting_rules: null,
  custom_timings: [],
  status: 'published',
  ...overrides,
});

const settings = (
  festivalId: string,
  overrides: Partial<FestivalSettings> = {},
): FestivalSettings => ({
  id: `settings-${festivalId}`,
  festival_id: festivalId,
  show_on_home: false,
  is_featured: false,
  priority: 0,
  show_from: null,
  show_until: null,
  show_in_calendar: true,
  ...overrides,
});

const media = (id: string, festivalId: string, overrides: Partial<FestivalMedia> = {}): FestivalMedia => ({
  id,
  festival_id: festivalId,
  occurrence_id: null,
  media_type: 'banner',
  storage_key: `${id}.jpg`,
  public_url: `https://media.example/${id}.jpg`,
  file_name: `${id}.jpg`,
  mime_type: 'image/jpeg',
  file_size: 100,
  display_order: 0,
  title: null,
  description: null,
  r2_key: null,
  duration_seconds: null,
  language_code: null,
  alt_text: null,
  caption: null,
  sort_order: 0,
  is_cover: false,
  ...overrides,
});

const content = (id: string, festivalId: string, occurrenceId: string | null): FestivalContent => ({
  id,
  festival_id: festivalId,
  occurrence_id: occurrenceId,
  festival_description: null,
  spiritual_significance: null,
  festival_story: [],
  scriptural_references: [],
  puja_name: null,
  puja_duration_minutes: null,
  puja_description: null,
  puja_samagri: [],
  puja_vidhi: [],
  story_r2_key: null,
  story_r2_url: null,
  puja_r2_key: null,
  puja_r2_url: null,
  related_scriptures: [],
  related_slokas: [],
  related_mantras: [],
  related_stotrams: [],
  related_music: [],
  related_stories: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

function mockClient(tables: Record<string, unknown[]>, errors: Record<string, Error> = {}) {
  const calls: Array<{ table: string; filters: Array<[string, unknown]> }> = [];
  const client = {
    from(table: string) {
      assert.ok(table in tables, `Unexpected festival table ${table}`);
      const filters: Array<[string, unknown]> = [];
      const predicates: Array<(row: Record<string, unknown>) => boolean> = [];
      calls.push({ table, filters });
      const query: Record<string, unknown> = {};
      const execute = async () => {
        const rows = tables[table] as Record<string, unknown>[];
        const filtered = rows.filter(row => predicates.every(predicate => predicate(row)));
        return { data: filtered, error: errors[table] ?? null };
      };
      query.select = () => query;
      query.eq = (key: string, value: unknown) => {
        filters.push([key, value]);
        predicates.push(row => row[key] === value);
        return query;
      };
      query.in = (key: string, values: unknown[]) => {
        filters.push([key, values]);
        predicates.push(row => values.includes(row[key]));
        return query;
      };
      query.order = () => query;
      query.maybeSingle = async () => {
        const result = await execute();
        return { ...result, data: result.data[0] ?? null };
      };
      query.then = (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
        execute().then(resolve, reject);
      return query;
    },
  };
  return { client, calls };
}

test('normalized list mapping selects current-year published occurrences and ignores hidden or inactive festivals', () => {
  const current = occurrence('occ-current', 'one', 2026);
  const hidden = settings('two', { show_from: '2026-11-01' });
  const results = mapFestivalListData(
    [
      festival('one', { cover_media_id: 'cover-one' }),
      festival('two'),
      festival('inactive', { is_active: false }),
      festival('draft', { status: 'Draft' }),
    ],
    [current, occurrence('occ-old', 'one', 2025), occurrence('occ-draft', 'two', 2026, { status: 'draft' })],
    [media('cover-one', 'one', { is_cover: true })],
    [hidden, settings('one', { is_featured: true, priority: 2 })],
    2026,
    '2026-10-31',
  );
  assert.deepEqual(results.map(item => item.id), ['one']);
  assert.equal(results[0].occurrence?.id, 'occ-current');
  assert.equal(results[0].coverMedia?.id, 'cover-one');
  assert.equal(results[0].settings?.is_featured, true);
});

test('festival without current-year occurrence remains in list with no date occurrence', () => {
  const [item] = mapFestivalListData(
    [festival('one')],
    [occurrence('past', 'one', 2025)],
    [],
    [],
    2026,
    '2026-10-31',
  );
  assert.equal(item.occurrence, null);
});

test('empty publication result maps to an empty list and search/type filters are case-insensitive', () => {
  assert.deepEqual(mapFestivalListData([], [], [], [], 2026, '2026-10-31'), []);
  const rows = mapFestivalListData(
    [
      festival('one', { name: 'Deepavali', alternate_name: 'Diwali', primary_deity: 'Lakshmi' }),
      festival('two', { name: 'Maha Shivaratri', festival_type: 'Jayanti' }),
    ],
    [],
    [],
    [],
    2026,
    '2026-10-31',
  );
  assert.deepEqual(filterFestivalList(rows, 'diw', 'All').map(item => item.id), ['one']);
  assert.deepEqual(filterFestivalList(rows, '', 'major festival').map(item => item.id), ['one']);
  assert.deepEqual(filterFestivalList(rows, 'lakshmi', 'All').map(item => item.id), ['one']);
});

test('detail occurrence prefers current year, then nearest future, then latest past', () => {
  const rows = [
    occurrence('past', 'one', 2024),
    occurrence('future-later', 'one', 2028),
    occurrence('current', 'one', 2026),
    occurrence('future', 'one', 2027),
    occurrence('unpublished', 'one', 2026, { id: 'hidden', status: 'draft' }),
  ];
  assert.equal(selectCurrentYearOccurrence(rows, 2026)?.id, 'current');
  assert.equal(selectRelevantOccurrence(rows, 2026)?.id, 'current');
  assert.equal(selectRelevantOccurrence(rows.filter(row => row.year !== 2026), 2026)?.id, 'future');
  assert.equal(selectRelevantOccurrence(rows.filter(row => row.year === 2024), 2026)?.id, 'past');
});

test('festival content prefers selected occurrence content and falls back to festival-level content', () => {
  const global = content('global', 'one', null);
  const selected = content('selected', 'one', 'occurrence-id');
  assert.equal(selectFestivalContent([global, selected], 'occurrence-id')?.id, 'selected');
  assert.equal(selectFestivalContent([global], 'occurrence-id')?.id, 'global');
  assert.equal(selectFestivalContent([selected], null), null);
});

test('cover media prefers cover_media_id then is_cover then ordered image media', () => {
  const owner = festival('one', { cover_media_id: 'requested' });
  const requested = media('requested', 'one');
  const marked = media('marked', 'one', { is_cover: true, sort_order: 1 });
  const fallback = media('fallback', 'one', { media_type: 'image', sort_order: 2 });
  assert.equal(selectFestivalCover(owner, [marked, fallback, requested])?.id, 'requested');
  assert.equal(selectFestivalCover(festival('one'), [fallback, marked])?.id, 'marked');
  assert.equal(selectFestivalCover(festival('one'), [fallback])?.id, 'fallback');
});

test('list reads active published data in batched table queries', async () => {
  const currentYear = new Date().getFullYear();
  const db = mockClient({
    festivals: [
      festival('one', { cover_media_id: 'cover' }),
      festival('inactive', { is_active: false }),
    ],
    festival_occurrences: [occurrence('occ', 'one', currentYear)],
    festival_media: [media('cover', 'one', { is_cover: true })],
    festival_settings: [settings('one', { is_featured: true })],
  });
  const result = await fetchFestivalList(db.client as never, currentYear);
  assert.equal(result.length, 1);
  assert.equal(result[0].occurrence?.id, 'occ');
  assert.equal(result[0].coverMedia?.id, 'cover');
  assert.deepEqual(db.calls.map(call => call.table).sort(), [
    'festival_media',
    'festival_occurrences',
    'festival_settings',
    'festivals',
  ]);
  const masterQuery = db.calls.find(call => call.table === 'festivals')!;
  assert.ok(masterQuery.filters.some(([key, value]) => key === 'status' && value === 'Published'));
  assert.ok(masterQuery.filters.some(([key, value]) => key === 'is_active' && value === true));
  assert.ok(db.calls.find(call => call.table === 'festival_occurrences')?.filters.some(([key, value]) => key === 'status' && value === 'published'));
});

test('festival permission/query errors are surfaced to the caller for retry UI', async () => {
  const db = mockClient(
    { festivals: [] },
    { festivals: new Error('permission denied for table festivals') },
  );
  await assert.rejects(fetchFestivalList(db.client as never, 2026), /permission denied/);
});

test('detail fetch loads normalized related tables and applies occurrence content fallback', async () => {
  const selectedOccurrence = occurrence('occ-current', 'one', 2026);
  const globalContent = content('global', 'one', null);
  globalContent.spiritual_significance = 'Festival significance';
  const db = mockClient({
    festivals: [festival('one')],
    festival_occurrences: [selectedOccurrence],
    festival_content: [globalContent],
    festival_media: [media('cover', 'one', { is_cover: true })],
    festival_settings: [settings('one')],
  });
  const detail = await fetchFestivalDetail('one', db.client as never, 2026);
  assert.equal(detail?.occurrence?.id, 'occ-current');
  assert.equal(detail?.content?.id, 'global');
  assert.equal(detail?.content?.spiritual_significance, 'Festival significance');
  assert.equal(detail?.media[0].id, 'cover');
  assert.equal(detail?.settings?.festival_id, 'one');
  assert.equal(db.calls.length, 5);
});

test('festival cache keys are versioned, year-specific, and type guards reject legacy data', () => {
  assert.match(festivalCache.listKey(2026), /^festivals_list_v2_2026$/);
  assert.match(festivalCache.detailKey('festival-id'), /^festival_detail_v2_festival-id_\d{4}$/);
  assert.equal(isFestivalListCache([{ id: 'old', name: 'Old' }]), false);
  assert.equal(isFestivalDetailCache({ id: 'old', name: 'Old' }), false);
});
