import React from 'react';
import type { Chant, ChantTranslation } from '../../lib/chant';
import { CHANT_TYPE_LABELS, configuredChantTargets } from '../../lib/chantCatalog';
import { ChantArtwork } from './ChantArtwork';

export function ChantCard({chant,category,translation,onSelect}:{chant:Chant;category?:string;translation?:ChantTranslation;onSelect:(chant:Chant)=>void}) {
  return <button className="chant-card" onClick={()=>onSelect(chant)} aria-label={`View mantra: ${chant.title}`}>
    <ChantArtwork src={chant.cover_image_url}/>
    <div className="chant-card-body">
      <div className="chant-card-labels"><span className="chant-eyebrow">{category||'MANTRA'}</span>{chant.featured&&<span className="chant-badge">Featured</span>}</div>
      <h3>{chant.title}</h3>
      {chant.short_description&&<p className="chant-preview">{chant.short_description}</p>}
      {chant.original_text&&<p className="chant-text-preview" lang="sa">{chant.original_text}</p>}
      {translation?.meaning&&<p className="chant-preview chant-meaning-preview" lang={translation.language_code}>{translation.meaning}</p>}
      <p className="chant-muted">{chant.mantra_type&&CHANT_TYPE_LABELS[chant.mantra_type]}{chant.is_beginner_friendly?' · Beginner friendly':''}</p>
      <p>Default: {chant.default_repetition_target} repetitions<br/>Targets: {configuredChantTargets(chant).join(', ')}</p>
      <span className="chant-gold">View mantra →</span>
    </div>
  </button>;
}
