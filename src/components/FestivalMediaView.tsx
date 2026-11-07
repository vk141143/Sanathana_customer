import React, { useState } from 'react';
import { isFestivalUrl } from '../lib/festivalData';
import type { FestivalMedia } from '../types';

export function FestivalImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  if (!isFestivalUrl(src) || failed === src) return <div role="img" aria-label={`${alt} — image unavailable`} className={`${className} bg-[#24170E] flex items-center justify-center`}>✦</div>;
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(src)} onLoad={() => setLoaded(src)}
    className={`${className} ${loaded === src ? '' : 'bg-[#24170E] animate-pulse'}`} />;
}

export function FestivalPlayer({ media }: { media: FestivalMedia }) {
  const [failed, setFailed] = useState(false);
  return <div className="space-y-2">
    {media.title && <p>{media.title}</p>}
    {(media.language_code || media.duration_seconds) && <p className="text-xs text-[#d2c4b3]/70">{[media.language_code,
      media.duration_seconds ? `${Math.floor(media.duration_seconds / 60)}:${String(media.duration_seconds % 60).padStart(2, '0')}` : null].filter(Boolean).join(' · ')}</p>}
    {failed || !isFestivalUrl(media.public_url) ? <p role="status">This media is currently unavailable.</p>
      : media.media_type === 'audio' ? <audio controls preload="none" src={media.public_url} onError={() => setFailed(true)} className="w-full" />
      : <video controls preload="none" src={media.public_url} onError={() => setFailed(true)} className="w-full rounded-xl" />}
    {media.description && <p className="text-xs">{media.description}</p>}
  </div>;
}
