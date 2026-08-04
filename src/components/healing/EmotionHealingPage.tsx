import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SupabaseEmotion } from '../EmotionDetailView';
import { HealingProgress } from './HealingProgress';
import { GitaStep } from './GitaStep';
import { MeaningStep } from './MeaningStep';
import { DivineExampleStep } from './DivineExampleStep';
import { OvercomeStep } from './OvercomeStep';
import { MantraStep } from './MantraStep';

interface Props {
  emotion: SupabaseEmotion;
  onBack: () => void;
}

const pageVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 40 : -40,
    scale: 0.98,
    filter: 'blur(10px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -25 : 25,
    scale: 0.99,
    filter: 'blur(10px)',
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export const EmotionHealingPage: React.FC<Props> = ({ emotion, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const navigate = useCallback(
    (dir: 1 | -1) => {
      if (isTransitioning) return;
      const next = currentStep + dir;
      if (next < 1 || next > 5) return;
      setIsTransitioning(true);
      setDirection(dir);
      setTimeout(() => {
        setCurrentStep(next);
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setIsTransitioning(false), 700);
      }, 350);
    },
    [isTransitioning, currentStep]
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <GitaStep emotion={emotion} />;
      case 2: return <MeaningStep emotion={emotion} />;
      case 3: return <DivineExampleStep emotion={emotion} />;
      case 4: return <OvercomeStep emotion={emotion} />;
      case 5: return <MantraStep emotion={emotion} onComplete={onBack} />;
      default: return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col max-w-md mx-auto"
      style={{ background: '#120B08' }}
    >
      {/* Scrollable content area */}
      <div ref={contentRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Banner + sticky progress */}
        <HealingProgress
          currentStep={currentStep}
          emotionName={emotion.name}
          emotionTagline={emotion.tagline}
          bannerImageUrl={emotion.banner_image_url}
          onBackToList={onBack}
        />

        {/* Animated step content */}
        <div className="px-5 pt-5 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.section
              key={currentStep}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {renderStep()}
            </motion.section>
          </AnimatePresence>

          {/* Two arrows below content */}
          <div className="flex items-center justify-between pt-6 pb-10">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate(-1)}
              disabled={isTransitioning || currentStep === 1}
              aria-label="Previous step"
              className="flex items-center justify-center rounded-full transition-opacity"
              style={{
                width: 52,
                height: 52,
                opacity: currentStep === 1 ? 0.2 : 1,
                background: 'rgba(43,26,16,0.9)',
                border: '1.5px solid rgba(233,180,76,0.4)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M14 5L8 11l6 6" stroke="#E9B44C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>

            <span className="text-[#C9B9A2] text-xs font-label-sm uppercase tracking-widest">
              {currentStep} / 5
            </span>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate(1)}
              disabled={isTransitioning || currentStep === 5}
              aria-label="Next step"
              className="flex items-center justify-center rounded-full transition-opacity"
              style={{
                width: 52,
                height: 52,
                opacity: currentStep === 5 ? 0.2 : 1,
                background: 'linear-gradient(135deg, #FFD978, #E9B44C)',
                border: '1.5px solid rgba(233,180,76,0.5)',
                boxShadow: currentStep === 5 ? 'none' : '0 0 18px rgba(233,180,76,0.4)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M8 5l6 6-6 6" stroke="#120B08" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
