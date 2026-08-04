import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedReveal, RevealItem } from './AnimatedTextReveal';
import { DevotionalImage } from './DevotionalImage';
import { SupabaseEmotion } from '../EmotionDetailView';

interface Props {
  emotion: SupabaseEmotion;
  onComplete: () => void;
}

export const MantraStep: React.FC<Props> = ({ emotion, onComplete }) => {
  const [completed, setCompleted] = useState(false);

  const handleComplete = () => {
    setCompleted(true);
    setTimeout(onComplete, 2800);
  };

  return (
    <AnimatedReveal className="space-y-5 pb-10">
      <RevealItem>
        <div>
          <h2 className="font-cinzel text-xl font-bold text-[#FFD978]">Mantra for Inner Peace</h2>
          <p className="text-[#C9B9A2] text-xs font-label-sm uppercase tracking-widest mt-0.5">
            Chant with devotion
          </p>
        </div>
      </RevealItem>

      {emotion.mantra_image_url && (
        <RevealItem>
          <DevotionalImage src={emotion.mantra_image_url} alt="Mantra" className="w-full h-48" />
        </RevealItem>
      )}

      <RevealItem>
        <div
          className="rounded-2xl p-6 text-center space-y-3"
          style={{ background: 'rgba(33,19,13,0.8)', border: '1px solid rgba(233,180,76,0.25)' }}
        >
          <p
            className="font-cinzel text-2xl text-[#FFD978] leading-relaxed"
            style={{ textShadow: '0 0 20px rgba(242,195,119,0.5)' }}
          >
            {emotion.mantra_sanskrit}
          </p>
          {emotion.mantra_transliteration && (
            <p className="text-[#E9B44C] text-sm italic font-garamond">{emotion.mantra_transliteration}</p>
          )}
          {emotion.mantra_meaning && (
            <p className="text-[#C9B9A2] text-xs leading-relaxed">{emotion.mantra_meaning}</p>
          )}
        </div>
      </RevealItem>

      <RevealItem>
        <div
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{ background: 'rgba(43,26,16,0.7)', border: '1px solid rgba(233,180,76,0.2)' }}
        >
          <div>
            <p className="text-[#C9B9A2] text-xs font-label-sm uppercase tracking-widest">Chant Count</p>
            <p className="text-[#FFD978] font-cinzel text-2xl font-bold mt-0.5">108</p>
          </div>
          <div className="text-4xl">🪷</div>
        </div>
      </RevealItem>

      <RevealItem>
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleComplete}
          disabled={completed}
          className="w-full py-4 rounded-full font-cinzel font-bold text-[#120B08] uppercase tracking-widest text-sm disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #FFD978, #E9B44C)',
            boxShadow: '0 0 24px rgba(233,180,76,0.4)',
          }}
        >
          Complete Healing
        </motion.button>
      </RevealItem>

      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: 'rgba(18,11,8,0.95)' }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: 1 }}
              className="text-8xl mb-6"
            >
              🪷
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="font-cinzel text-[#FFD978] text-xl font-bold text-center px-8"
              style={{ textShadow: '0 0 20px rgba(242,195,119,0.5)' }}
            >
              You chose wisdom over {emotion.name.toLowerCase()} today.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-[#C9B9A2] text-sm mt-3 font-garamond italic"
            >
              ॐ शान्तिः शान्तिः शान्तिः
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedReveal>
  );
};
