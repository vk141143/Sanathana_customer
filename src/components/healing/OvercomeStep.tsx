import React from 'react';
import { motion } from 'motion/react';
import { AnimatedReveal, RevealItem } from './AnimatedTextReveal';
import { SupabaseEmotion } from '../EmotionDetailView';

interface Props { emotion: SupabaseEmotion; }

const CARD_ICONS = ['🌬️', '🧘', '🪔', '🙏'];

export const OvercomeStep: React.FC<Props> = ({ emotion }) => {
  const actions = emotion.how_to_overcome ?? [];

  return (
    <AnimatedReveal className="space-y-5 pb-10">
      <RevealItem>
        <div>
          <h2 className="font-cinzel text-xl font-bold text-[#FFD978]">How to Overcome</h2>
          <p className="text-[#C9B9A2] text-xs font-label-sm uppercase tracking-widest mt-0.5">
            Practical spiritual practices
          </p>
        </div>
      </RevealItem>

      <div className="space-y-3">
        {actions.map((action, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20, filter: 'blur(6px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, delay: 0.15 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-4 rounded-2xl p-4"
            style={{ background: 'rgba(33,19,13,0.8)', border: '1px solid rgba(233,180,76,0.2)' }}
          >
            <div
              className="flex items-center justify-center rounded-full shrink-0 text-lg"
              style={{
                width: 44,
                height: 44,
                background: 'rgba(43,26,16,0.9)',
                border: '1px solid rgba(233,180,76,0.35)',
              }}
            >
              {CARD_ICONS[idx] ?? '✦'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-bold rounded-full px-2 py-0.5 font-label-sm"
                  style={{ background: 'rgba(233,180,76,0.15)', color: '#E9B44C' }}
                >
                  {idx + 1}
                </span>
                <h3 className="font-cinzel text-sm font-bold text-[#FFD978]">
                  {action.title}
                </h3>
              </div>
              <p className="text-[#C9B9A2] text-xs leading-relaxed">{action.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatedReveal>
  );
};
