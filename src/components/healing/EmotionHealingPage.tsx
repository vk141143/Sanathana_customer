import React, { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { SupabaseEmotion } from '../EmotionDetailView';
import { getReadingStages, type StageId, type TopicKind } from './readingStages';
interface Props { emotion: SupabaseEmotion; onBack: () => void; topicKind?: TopicKind }
export const EmotionHealingPage: React.FC<Props> = props => (
  <TopicReader key={`${props.topicKind ?? 'emotion'}:${props.emotion.id}`} {...props} />
);
function TopicReader({ emotion, onBack, topicKind = 'emotion' }: Props) {
  const [stageId, setStageId] = useState<StageId>('understanding');
  const stages = getReadingStages(emotion, topicKind);
  const index = stages.findIndex(stage => stage.id === stageId);
  const stage = stages[index];
  const scroller = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (scroller.current) scroller.current.scrollTop = 0; }, [stageId]);
  const arrowClass = 'shrink-0 p-3 rounded-full border border-[#f2c377]/30 text-[#f2c377] disabled:opacity-25 focus-visible:outline-2 focus-visible:outline-[#f2c377]';
  return (
    <div className="healing-reader fixed inset-x-0 top-0 bottom-[calc(100px+env(safe-area-inset-bottom))] z-40 max-w-lg mx-auto flex flex-col bg-[#120B08] text-[#F8EBD2] [overflow-wrap:anywhere]">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-[#f2c377]/20 shrink-0">
        <button type="button" onClick={onBack} aria-label="Back to Emotions & Healing" className={arrowClass}><ArrowLeft size={20} aria-hidden="true" /></button>
        <h1 className="font-cinzel text-xl font-bold min-w-0 text-[#f2c377]">{emotion.name}</h1>
      </header>
      <nav aria-label="Reading sections" className="flex justify-between px-5 py-3 shrink-0">
        <button type="button" aria-label="Previous section" disabled={index === 0} onClick={() => setStageId(stages[index - 1].id)} className={arrowClass}><ArrowLeft size={20} aria-hidden="true" /></button>
        <button type="button" aria-label="Next section" disabled={index === stages.length - 1} onClick={() => setStageId(stages[index + 1].id)} className={arrowClass}><ArrowRight size={20} aria-hidden="true" /></button>
      </nav>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
        <article key={`${emotion.id}:${stage.id}`} aria-labelledby="healing-stage-title" className="py-4">
          <h2 id="healing-stage-title" className="font-cinzel text-2xl leading-relaxed text-[#f2c377] mb-6" aria-live="polite">{stage.title}</h2>
          {stage.blocks.length === 0 && <p className="text-[#C9B9A2] leading-relaxed">Content for this section of {emotion.name} has not been published yet.</p>}
          <div className="space-y-6">
            {stage.blocks.map(block => <section key={block.id}>
              {block.heading && <h3 className="font-cinzel text-lg text-[#f2c377] mb-2">{block.heading}</h3>}
              {block.kind === 'quote'
                ? <blockquote className="border-l-2 border-[#f2c377]/40 pl-4 font-serif-main text-lg leading-loose whitespace-pre-wrap">{block.text}</blockquote>
                : <p lang={block.lang} className={`whitespace-pre-wrap text-lg leading-loose ${block.kind === 'verse' ? 'font-sanskrit text-[#f2c377]' : 'font-serif-main'}`}>{block.text}</p>}
            </section>)}
          </div>
        </article>
      </div>
    </div>
  );
}
