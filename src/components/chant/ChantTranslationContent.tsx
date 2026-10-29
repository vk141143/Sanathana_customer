import React from 'react';
import type { ChantTranslation } from '../../lib/chant';

export function ChantTranslationContent({translation}:{translation?:ChantTranslation}) {
  if(!translation)return null;
  return <div className="chant-scripture" lang={translation.language_code}>
    {translation.display_title&&<h3>{translation.display_title}</h3>}
    {translation.transliteration&&<p>{translation.transliteration}</p>}
    {translation.pronunciation_guide&&<p>Pronunciation: {translation.pronunciation_guide}</p>}
    {translation.meaning&&<><h3>Meaning</h3><p>{translation.meaning}</p></>}
    {translation.explanation&&<><h3>Explanation</h3><p>{translation.explanation}</p></>}
    {translation.life_context&&<><h3>In daily life</h3><p>{translation.life_context}</p></>}
  </div>;
}
