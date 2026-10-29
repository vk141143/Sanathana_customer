import React, { useState } from 'react';
import type { ChantMedia } from '../../lib/chant';
import { isSafePlayableUrl } from '../../services/sadhana/practiceCatalog';

export function ChantAudio({ media, language }: { media: ChantMedia[]; language: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  const groups = [
    { type: 'audio', label: 'Chant audio' },
    { type: 'pronunciation', label: 'Pronunciation recordings' },
    { type: 'ambience', label: 'Ambient audio' },
  ].map(group => ({ ...group, items: media.filter(item => item.media_type === group.type &&
    isSafePlayableUrl(item.public_url) && (!item.language_code || item.language_code === language)) }));
  return <>
    {!groups.some(group => group.items.length) && <p className="chant-muted">No published audio is available for this language.</p>}
    {groups.filter(group => group.items.length).map(group => <section key={group.type} aria-label={group.label}>
      <h3>{group.label}</h3>
      {group.items.map(item => <div className="chant-audio" key={item.id}>
        <label htmlFor={`chant-audio-${item.id}`}>{item.title || group.label}{item.is_default ? ' · Recommended' : ''}</label>
        <audio id={`chant-audio-${item.id}`} controls preload="none" src={item.public_url}
          onError={() => setFailed(item.id)} />
        {failed === item.id && <p role="alert">This recording could not be played. Please retry later.</p>}
      </div>)}
    </section>)}
  </>;
}
