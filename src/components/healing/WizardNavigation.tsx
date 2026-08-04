import React from 'react';
import { motion } from 'motion/react';
import { NEXT_BUTTON_LABELS } from './types';

interface Props {
  currentStep: number;
  totalSteps: number;
  isTransitioning: boolean;
  onNext: () => void;
  onBack: () => void;
}

export const WizardNavigation: React.FC<Props> = ({
  currentStep,
  totalSteps,
  isTransitioning,
  onNext,
  onBack,
}) => {
  const disabled = isTransitioning;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-5 py-4"
      style={{
        background: 'rgba(18,11,8,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(233,180,76,0.12)',
      }}
    >
      {/* Back */}
      {currentStep > 1 ? (
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          onClick={onBack}
          disabled={disabled}
          aria-label="Go to previous step"
          className="flex items-center gap-2 px-5 py-3 rounded-full border border-[rgba(233,180,76,0.4)] text-[#E9B44C] text-sm font-label-sm uppercase tracking-widest transition-opacity disabled:opacity-40"
          style={{ minHeight: 48 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </motion.button>
      ) : (
        <div />
      )}

      {/* Next */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        onClick={onNext}
        disabled={disabled}
        aria-label={NEXT_BUTTON_LABELS[currentStep]}
        className="flex items-center gap-2 px-6 py-3 rounded-full text-[#120B08] font-label-sm uppercase tracking-widest text-sm font-bold transition-opacity disabled:opacity-40"
        style={{
          minHeight: 48,
          background: 'linear-gradient(135deg, #FFD978, #E9B44C)',
          boxShadow: disabled ? 'none' : '0 0 16px rgba(233,180,76,0.4)',
        }}
      >
        {NEXT_BUTTON_LABELS[currentStep]}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>
    </div>
  );
};
