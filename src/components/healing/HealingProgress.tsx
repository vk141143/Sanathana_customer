import React from 'react';
import { motion } from 'motion/react';
import { HEALING_STEPS } from './types';

interface Props {
  currentStep: number;
  emotionName: string;
  emotionTagline: string;
  bannerImageUrl?: string;
  onBackToList: () => void;
}

export const HealingProgress: React.FC<Props> = ({
  currentStep,
  emotionName,
  emotionTagline,
  bannerImageUrl,
  onBackToList,
}) => {
  const progressPct = ((currentStep - 1) / (HEALING_STEPS.length - 1)) * 100;

  return (
    <>
      {/* Banner */}
      <div className="relative w-full h-72 overflow-hidden">
        {bannerImageUrl && (
          <img
            src={bannerImageUrl}
            alt={emotionName}
            className="absolute inset-0 w-full h-full object-cover object-top opacity-85"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-[#120B08]" />

        {/* Back arrow — top left */}
        <button
          onClick={onBackToList}
          aria-label="Back to Emotions"
          className="absolute top-5 left-5 z-20 flex items-center justify-center rounded-full transition-opacity active:scale-90"
          style={{
            width: 38,
            height: 38,
            background: 'rgba(18,11,8,0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(233,180,76,0.35)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M12 3L6 9l6 6" stroke="#E9B44C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* ॐ symbol — top right, same line as back arrow */}
        <div
          className="absolute top-5 right-5 z-20 flex items-center justify-center rounded-full"
          style={{
            width: 38,
            height: 38,
            background: 'rgba(18,11,8,0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(233,180,76,0.35)',
          }}
        >
          <span
            className="font-cinzel text-lg leading-none"
            style={{ color: '#E9B44C', textShadow: '0 0 10px rgba(233,180,76,0.6)' }}
          >
            ॐ
          </span>
        </div>

        {/* Title near bottom */}
        <div className="absolute bottom-6 left-0 w-full px-5 z-10">
          <h1 className="font-cinzel text-5xl font-bold text-[#FFD978] drop-shadow-lg leading-tight">
            {emotionName}
          </h1>
          <p className="text-[#C9B9A2] text-sm font-label-sm uppercase tracking-widest mt-1">
            {emotionTagline}
          </p>
        </div>
      </div>

      {/* Sticky Progress Bar — smaller nodes, centred */}
      <div
        className="sticky top-0 z-30 py-3"
        style={{
          background: 'rgba(18,11,8,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(233,180,76,0.12)',
        }}
      >
        {/* Constrained width, centred */}
        <div className="mx-auto px-8" style={{ maxWidth: 260 }}>
          <div className="relative flex items-center justify-between" style={{ height: 28 }}>
            {/* Base line */}
            <div
              className="absolute left-0 right-0 h-[2px] rounded-full"
              style={{ top: '50%', transform: 'translateY(-50%)', background: 'rgba(233,180,76,0.15)' }}
            />
            {/* Animated golden progress line */}
            <motion.div
              className="absolute left-0 h-[2px] rounded-full origin-left"
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'linear-gradient(90deg, #E9B44C, #FFD978)',
                boxShadow: '0 0 6px rgba(255,217,120,0.6)',
              }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
            />
            {/* Nodes */}
            {HEALING_STEPS.map((step) => {
              const isCompleted = step.id < currentStep;
              const isActive = step.id === currentStep;
              return (
                <motion.div
                  key={step.id}
                  animate={
                    isActive
                      ? { scale: 1.2, boxShadow: '0 0 8px rgba(245,185,66,0.9), 0 0 18px rgba(245,185,66,0.4)' }
                      : isCompleted
                      ? { scale: 1, boxShadow: '0 0 5px rgba(233,180,76,0.4)' }
                      : { scale: 1, boxShadow: 'none' }
                  }
                  transition={{ duration: 0.4 }}
                  className="relative z-10 flex items-center justify-center rounded-full"
                  style={{
                    width: 20,
                    height: 20,
                    background: isActive
                      ? 'linear-gradient(135deg, #FFD978, #E9B44C)'
                      : isCompleted
                      ? '#E9B44C'
                      : 'rgba(33,19,13,0.9)',
                    border: isActive || isCompleted
                      ? '1.5px solid #FFD978'
                      : '1.5px solid rgba(233,180,76,0.3)',
                  }}
                >
                  {isCompleted ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#120B08" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isActive ? (
                    <motion.div
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      className="rounded-full bg-[#120B08]"
                      style={{ width: 6, height: 6 }}
                    />
                  ) : (
                    <span className="text-[8px] font-bold" style={{ color: 'rgba(233,180,76,0.5)' }}>{step.id}</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
