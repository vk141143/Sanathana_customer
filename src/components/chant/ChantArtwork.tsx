import React, { useState } from 'react';
import { isSafePlayableUrl } from '../../services/sadhana/practiceCatalog';

export function ChantArtwork({src, detail=false}:{src?:string|null;detail?:boolean}) {
  const [failed,setFailed]=useState<string|null>(null);
  return src && src !== failed && isSafePlayableUrl(src)
    ? <img className={detail?'chant-cover':undefined} src={src} alt="" loading="lazy" onError={()=>setFailed(src)}/>
    : <div className={`chant-card-symbol${detail?' chant-cover':''}`} aria-hidden="true">ॐ</div>;
}
