export interface SlokaMetadata {
  id: string;
  chapter_id: string;
  verse_number: number;
  verse_id: string;
  json_url: string;
  audio_url?: string | null;
  audio_r2_key?: string | null;
  audio_r2_path?: string | null;
  audio_status?: string | null;
  audio_duration_seconds?: number | null;
  audio_file_size_bytes?: number | null;
  audio_updated_at?: string | null;
  status?: string;
}

const normalizeString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

export function normalizeSlokaMetadata(row: any): SlokaMetadata {
  return {
    id: normalizeString(row.id, ''),
    chapter_id: normalizeString(row.chapter_id, ''),
    verse_number: Number(row.verse_number ?? 0),
    verse_id: normalizeString(row.verse_id ?? row.id, ''),
    json_url: normalizeString(row.json_url ?? '', ''),
    audio_url: normalizeString(row.audio_url, '') || null,
    audio_r2_key: normalizeString(row.audio_r2_key, '') || null,
    audio_r2_path: normalizeString(row.audio_r2_path, '') || null,
    audio_status: normalizeString(row.audio_status, '') || null,
    audio_duration_seconds: typeof row.audio_duration_seconds === 'number' ? row.audio_duration_seconds : null,
    audio_file_size_bytes: typeof row.audio_file_size_bytes === 'number' ? row.audio_file_size_bytes : null,
    audio_updated_at: normalizeString(row.audio_updated_at, '') || null,
    status: normalizeString(row.status, ''),
  };
}
