import React from 'react';
import { AnimatedReveal, RevealItem } from './AnimatedTextReveal';
import { DevotionalImage } from './DevotionalImage';
import { SupabaseEmotion } from '../EmotionDetailView';

interface Props { emotion: SupabaseEmotion; }

export const MeaningStep: React.FC<Props> = ({ emotion }) => (
  <AnimatedReveal className="space-y-5 pb-10">
    <RevealItem>
      <div>
        <h2 className="font-cinzel text-xl font-bold text-[#FFD978]">What This Means</h2>
        <p className="text-[#C9B9A2] text-xs font-label-sm uppercase tracking-widest mt-0.5">
          The deeper spiritual lesson
        </p>
      </div>
    </RevealItem>

    {emotion.means_image_url && (
      <RevealItem>
        <DevotionalImage src={emotion.means_image_url} alt="Meaning Illustration" className="w-full h-48" />
      </RevealItem>
    )}

    {emotion.what_it_means && (
      <RevealItem>
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(33,19,13,0.8)', border: '1px solid rgba(233,180,76,0.2)' }}
        >
          <p className="text-[#F8EBD2] text-sm leading-relaxed font-garamond text-base">
            {emotion.what_it_means}
          </p>
        </div>
      </RevealItem>
    )}

    <RevealItem>
      <div
        className="rounded-2xl p-4 flex gap-3 items-start"
        style={{
          background: 'linear-gradient(135deg, rgba(43,26,16,0.9), rgba(33,19,13,0.7))',
          border: '1px solid rgba(233,180,76,0.35)',
          boxShadow: '0 0 20px rgba(233,180,76,0.08)',
        }}
      >
        <span className="text-[#E9B44C] text-xl mt-0.5">✦</span>
        <p className="text-[#FFD978] text-sm font-garamond italic leading-relaxed">
          {emotion.name} clouds judgment before it harms others. Awareness is the first step to freedom.
        </p>
      </div>
    </RevealItem>
  </AnimatedReveal>
);
