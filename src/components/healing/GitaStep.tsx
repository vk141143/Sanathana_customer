import React from 'react';
import { AnimatedReveal, RevealItem } from './AnimatedTextReveal';
import { DevotionalImage } from './DevotionalImage';
import { SupabaseEmotion } from '../EmotionDetailView';

interface Props { emotion: SupabaseEmotion; }

export const GitaStep: React.FC<Props> = ({ emotion }) => (
  <AnimatedReveal className="space-y-5 pb-10">
    <RevealItem>
      <div>
        <h2 className="font-cinzel text-xl font-bold text-[#FFD978]">What Bhagavad Gita Says</h2>
        <p className="text-[#C9B9A2] text-xs font-label-sm uppercase tracking-widest mt-0.5">
          Ancient wisdom for {emotion.name.toLowerCase()}
        </p>
      </div>
    </RevealItem>

    {emotion.gita_image_url && (
      <RevealItem>
        <DevotionalImage src={emotion.gita_image_url} alt="Gita Illustration" className="w-full h-52" />
      </RevealItem>
    )}

    <RevealItem>
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{ background: 'rgba(33,19,13,0.8)', border: '1px solid rgba(233,180,76,0.2)' }}
      >
        {emotion.gita_sanskrit && (
          <p className="font-cinzel text-[#FFD978] text-lg leading-relaxed whitespace-pre-line"
             style={{ textShadow: '0 0 12px rgba(242,195,119,0.3)' }}>
            {emotion.gita_sanskrit}
          </p>
        )}
        {emotion.gita_reference && (
          <p className="text-[#E9B44C] text-sm italic font-garamond">{emotion.gita_reference}</p>
        )}
      </div>
    </RevealItem>

    {emotion.gita_transliteration && (
      <RevealItem>
        <p className="text-[#C9B9A2] text-xs italic leading-relaxed px-1 whitespace-pre-line">
          {emotion.gita_transliteration}
        </p>
      </RevealItem>
    )}

    {emotion.gita_translation && (
      <RevealItem>
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(43,26,16,0.6)', border: '1px solid rgba(233,180,76,0.15)' }}
        >
          <p className="text-[#F8EBD2] text-sm leading-relaxed font-garamond text-base">
            "{emotion.gita_translation}"
          </p>
        </div>
      </RevealItem>
    )}
  </AnimatedReveal>
);
