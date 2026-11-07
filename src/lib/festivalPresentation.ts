import { isFestivalUrl } from './festivalData';

export function formatFestivalDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return '';
  return date.toLocaleDateString('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatFestivalTime(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return '';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true,
  }) : '';
}

export function formatFestivalClock(value: unknown): string {
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : '';
}

export async function fetchFestivalSections(url: string, signal?: AbortSignal): Promise<{ title: string; content: string }[]> {
  if (!isFestivalUrl(url)) throw new Error('Invalid content URL.');
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Festival content could not be loaded.');
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || !('sections' in payload) || !Array.isArray(payload.sections)
    || !payload.sections.length || !payload.sections.every(section => section && typeof section === 'object'
      && typeof section.title === 'string' && typeof section.content === 'string' && section.content.trim())) {
    throw new Error('Invalid festival content document.');
  }
  return payload.sections.map(section => ({ title: section.title, content: section.content }));
}
