import React from 'react';
import { AnimatedReveal, RevealItem } from './AnimatedTextReveal';
import { DevotionalImage } from './DevotionalImage';
import { SupabaseEmotion } from '../EmotionDetailView';

interface Props { emotion: SupabaseEmotion; }

export const DivineExampleStep: React.FC<Props> = ({ emotion }) => (
  <AnimatedReveal className="space-y-5 pb-10">
    <RevealItem>
      <div>
        <h2 className="font-cinzel text-xl font-bold text-[#FFD978]">Divine Example</h2>
        <p className="text-[#C9B9A2] text-xs font-label-sm uppercase tracking-widest mt-0.5">
          Wisdom from the sacred stories
        </p>
      </div>
    </RevealItem>

    {emotion.example_image_url && (
      <RevealItem>
        <DevotionalImage src={emotion.example_image_url} alt="Divine Example" className="w-full h-52" />
      </RevealItem>
    )}

    {emotion.example_text && (
      <RevealItem>
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: 'rgba(33,19,13,0.8)', border: '1px solid rgba(233,180,76,0.2)' }}
        >
          <p className="text-[#F8EBD2] text-sm leading-relaxed font-garamond text-base">
            {emotion.example_text}
          </p>
        </div>
      </RevealItem>
    )}

    <RevealItem>
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(43,26,16,0.7)', border: '1px solid rgba(233,180,76,0.25)' }}
      >
        <p className="text-[#C9B9A2] text-xs font-label-sm uppercase tracking-widest mb-2">Reflection</p>
        <p className="text-[#FFD978] text-sm font-garamond italic leading-relaxed">
          Am I reacting because my ego is hurt, or am I acting to protect what is right?
        </p>
      </div>
    </RevealItem>
  </AnimatedReveal>
);
