import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { EmotionHealingPage } from '../src/components/healing/EmotionHealingPage';
import { BottomNav } from '../src/components/BottomNav';
import { getReadingStages } from '../src/components/healing/readingStages';
import type { SupabaseEmotion } from '../src/components/EmotionDetailView';

const topic = {
  id: 'anger', name: 'Anger', tagline: 'Published introduction',
  gita_sanskrit: 'Source Sanskrit', gita_reference: 'Source reference', gita_transliteration: 'Source transliteration', gita_translation: 'Source translation',
  what_it_means: Array.from({length:150}, (_,i) => `Paragraph ${i}`).join('\n\n'), example_text: 'Published example',
  how_to_overcome: [{title:'First practice',sub:'First instruction'}, {title:'Second practice',sub:'Second instruction'}],
  mantra_sanskrit: 'Source mantra', mantra_transliteration: 'Mantra transliteration', mantra_meaning: 'Mantra meaning',
} as SupabaseEmotion;

test('adapter retains source fields in five stable sections and does not fabricate missing causes', () => {
  const stages = getReadingStages(topic);
  assert.deepEqual(stages.map(s=>s.id), ['understanding','wisdom','meaning','application','practices']);
  assert.deepEqual(stages[3].blocks, []);
  const text = stages.flatMap(s=>s.blocks).map(b=>[b.heading,b.text].join('\n')).join('\n');
  for(const field of ['tagline','gita_sanskrit','gita_reference','gita_transliteration','gita_translation','what_it_means','example_text','mantra_sanskrit','mantra_transliteration','mantra_meaning'] as const) assert.ok(text.includes(topic[field]), field);
  assert.ok(text.indexOf('First practice') < text.indexOf('Second practice'));
  assert.equal(getReadingStages(topic,'healing')[1].title,'Relevant Spiritual Wisdom');
  assert.equal(getReadingStages(topic,'healing')[3].title,'Applying It in Everyday Life');
  assert.ok(getReadingStages({...topic,gita_translation:'Translated source'})[1].blocks.some(b=>b.text==='Translated source'));
});

test('reader arrows, boundaries, empty states, topic reset, back and five-position navigation work', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = {window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:(globalThis as any).IS_REACT_ACT_ENVIRONMENT};
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  const host=document.getElementById('root')!; const root=createRoot(host); let back=0; let tab='';
  const button=(name:string)=>host.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
  const click=async(name:string)=>{await act(async()=>button(name).click());};
  try {
    await act(async()=>root.render(<EmotionHealingPage emotion={topic} onBack={()=>back++}/>));
    assert.equal(button('Previous section').disabled,true);
    assert.ok(host.textContent?.includes(topic.tagline));
    for(let i=1;i<5;i++) { await click('Next section'); assert.equal(host.querySelector('h2')?.textContent,getReadingStages(topic)[i].title); }
    assert.equal(button('Next section').disabled,true);
    assert.ok(host.textContent?.includes('Mantra meaning'));
    await click('Previous section'); assert.ok(host.textContent?.includes('has not been published yet'));
    await click('Previous section'); assert.ok(host.textContent?.includes('Paragraph 149'));
    assert.equal(host.querySelector('img,.sacred-scroll,[role="progressbar"]'),null);
    await act(async()=>root.render(<EmotionHealingPage emotion={{...topic,id:'fear',name:'Fear',tagline:'Fear introduction'}} onBack={()=>back++}/>));
    assert.equal(button('Previous section').disabled,true); assert.ok(host.textContent?.includes('Fear introduction'));
    await click('Back to Emotions & Healing'); assert.equal(back,1);
    await act(async()=>root.render(<EmotionHealingPage emotion={topic} topicKind="healing" onBack={()=>{}}/>));
    await click('Next section'); assert.equal(host.querySelector('h2')?.textContent,'Relevant Spiritual Wisdom');
    await act(async()=>root.render(<BottomNav currentTab="explore" onTabChange={value=>{tab=value}}/>));
    const buttons=host.querySelectorAll('button'); assert.equal(buttons.length,5);
    assert.equal(buttons[2].getAttribute('aria-label'),'Explore divine guidance');
    await act(async()=>buttons[2].click()); assert.equal(tab,'explore');
  } finally {await act(async()=>root.unmount());dom.window.close();Object.assign(globalThis,previous);}
});

test('album retains original grid dimensions, artwork and typography with existing publication query', () => {
  const source=readFileSync('src/components/ExploreView.tsx','utf8');
  for(const value of ['grid grid-cols-2 gap-4','h-36 rounded-[24px]','golden-border','outside_image_url || em.card_image_url','absolute bottom-4 left-4','text-base text-[#f2c377] font-cinzel font-bold tracking-wider',".eq('is_active', true).order('sort_order')"]) assert.ok(source.includes(value),value);
});

