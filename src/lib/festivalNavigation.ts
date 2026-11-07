export function festivalLocation(hash: string) {
  const [tab, query] = hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(query);
  return { tab, festivalId: tab === 'festivals' ? params.get('festival') : null,
    occurrenceId: tab === 'festivals' ? params.get('occurrence') : null };
}

export function festivalDetailHash(festivalId: string, occurrenceId?: string) {
  const params = new URLSearchParams({ festival: festivalId });
  if (occurrenceId) params.set('occurrence', occurrenceId);
  return `#festivals?${params}`;
}
