import React, { useState } from 'react';
import { STREAK_ACHIEVEMENTS } from '../data/achievements';
import type { StreakAchievement } from '../data/achievements';

// ── Spiritual Icons ───────────────────────────────────────────
const SpiritualIcons = {
  lotus: (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M50 20 Q60 35 55 50 Q50 60 50 70 M50 20 Q40 35 45 50 Q50 60 50 70" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="50" cy="50" r="8" fill="currentColor" />
    </svg>
  ),
  trishul: (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 15 L45 40 L30 35 M50 15 L55 40 L70 35 M50 15 L50 75" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="50" cy="80" r="4" fill="currentColor" />
    </svg>
  ),
  om: (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="50" y="65" fontSize="60" fontFamily="serif" textAnchor="middle" fill="currentColor" opacity="0.8">ॐ</text>
    </svg>
  ),
  flame: (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 20 Q45 35 50 50 Q40 60 50 75 Q60 60 50 50 Q55 35 50 20" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="50" cy="35" r="3" fill="currentColor" />
    </svg>
  ),
  bell: (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M35 40 Q35 25 50 25 Q65 25 65 40 L65 55 Q50 65 35 55 Z" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="45" y1="65" x2="55" y2="65" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="72" r="3" fill="currentColor" />
    </svg>
  ),
  shankha: (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 25 Q65 30 65 50 Q65 70 50 75 Q35 70 35 50 Q35 30 50 25" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M45 40 Q50 45 55 40" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  gada: (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="42" y="20" width="16" height="25" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="50" y1="45" x2="50" y2="70" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="75" r="4" fill="currentColor" />
    </svg>
  ),
  chakra: (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="50" y1="15" x2="50" y2="85" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="15" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  ),
  temple: (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 20 L65 35 L65 70 L35 70 L35 35 Z" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="40" y1="35" x2="60" y2="35" stroke="currentColor" strokeWidth="1.5" />
      <line x1="40" y1="50" x2="60" y2="50" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  divine: (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="2" />
      <path d="M50 25 L55 40 L70 40 L58 50 L63 65 L50 55 L37 65 L42 50 L30 40 L45 40 Z" fill="currentColor" opacity="0.6" />
    </svg>
  ),
};

type IconKey = keyof typeof SpiritualIcons;
const getIconComponent = (iconKey: string) =>
  SpiritualIcons[iconKey as IconKey] || SpiritualIcons.lotus;

// ── Milestone Detail Sheet ────────────────────────────────────
interface MilestoneDetailSheetProps {
  achievement: StreakAchievement | null;
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
}

const MilestoneDetailSheet: React.FC<MilestoneDetailSheetProps> = ({
  achievement,
  isOpen,
  onClose,
  currentStreak,
}) => {
  if (!achievement) return null;

  const isUnlocked = currentStreak >= achievement.requiredStreak;
  const daysRemaining = achievement.requiredStreak - currentStreak;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto transition-transform duration-300 ${
          isOpen ? 'animate-slide-up' : 'translate-y-full'
        }`}
      >
        <div className="glass-panel rounded-t-3xl p-6 pt-8">
          {/* Close handle */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1 rounded-full bg-[#D4AF37]/30" />
          </div>

          {/* Large Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full milestone-node-unlocked flex items-center justify-center text-[#0B1220]">
              <div className="w-12 h-12">{getIconComponent(achievement.iconKey)}</div>
            </div>
          </div>

          {/* Achievement Name */}
          <h2 className="font-cinzel text-2xl text-[#D4AF37] text-center mb-2 tracking-wide">
            {achievement.title}
          </h2>

          {/* Description */}
          <p className="font-body-md text-[#d2c4b3]/80 text-center mb-6">
            {achievement.description}
          </p>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent mb-6" />

          {/* Details Grid */}
          <div className="space-y-4 mb-6">
            {/* Required Streak */}
            <div className="flex justify-between items-center">
              <span className="font-label-sm text-[11px] text-[#d2c4b3]/60 uppercase tracking-widest">
                Required Streak
              </span>
              <span className="font-garamond text-lg text-[#D4AF37]">
                {achievement.requiredStreak} Days
              </span>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center">
              <span className="font-label-sm text-[11px] text-[#d2c4b3]/60 uppercase tracking-widest">
                Status
              </span>
              {isUnlocked ? (
                <span className="font-label-sm text-[11px] text-[#4ade80] uppercase tracking-widest">
                  ✓ Unlocked
                </span>
              ) : (
                <span className="font-label-sm text-[11px] text-[#D4AF37]/70 uppercase tracking-widest">
                  {daysRemaining} Days Remaining
                </span>
              )}
            </div>

            {/* Rewards */}
            {isUnlocked && (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-[11px] text-[#d2c4b3]/60 uppercase tracking-widest">
                    XP Reward
                  </span>
                  <span className="font-garamond text-lg text-[#D4AF37]">
                    +{achievement.requiredStreak * 10} XP
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-[11px] text-[#d2c4b3]/60 uppercase tracking-widest">
                    Badge
                  </span>
                  <span className="font-label-sm text-[11px] text-[#D4AF37] uppercase tracking-widest">
                    {achievement.title}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-[11px] text-[#d2c4b3]/60 uppercase tracking-widest">
                    Temple Reward
                  </span>
                  <span className="font-label-sm text-[11px] text-[#D4AF37] uppercase tracking-widest">
                    Sacred Blessing
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37] font-label-sm uppercase tracking-widest hover:bg-[#D4AF37]/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

// ── Help Sheet ────────────────────────────────────────────────
interface HelpSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpSheet: React.FC<HelpSheetProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto transition-transform duration-300 ${
          isOpen ? 'animate-slide-up' : 'translate-y-full'
        }`}
      >
        <div className="glass-panel rounded-t-3xl p-6 pt-8 max-h-[80vh] overflow-y-auto">
          {/* Close handle */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1 rounded-full bg-[#D4AF37]/30" />
          </div>

          {/* Title */}
          <h2 className="font-cinzel text-2xl text-[#D4AF37] text-center mb-6 tracking-wide">
            Temple Journey Guide
          </h2>

          {/* Achievements List */}
          <div className="space-y-4">
            {STREAK_ACHIEVEMENTS.map((achievement) => (
              <div key={achievement.id} className="pb-4 border-b border-[#D4AF37]/10 last:border-b-0">
                {/* Achievement Header */}
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[#D4AF37] text-sm">
                    <div className="w-5 h-5">{getIconComponent(achievement.iconKey)}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-garamond text-base text-[#e5e2e1] font-bold">
                      {achievement.title}
                    </h3>
                    <p className="font-label-sm text-[10px] text-[#d2c4b3]/60 uppercase tracking-widest">
                      {achievement.description}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="ml-11 space-y-1">
                  <p className="font-body-md text-[13px] text-[#d2c4b3]/70">
                    <span className="text-[#D4AF37]">Requirement:</span> {achievement.requiredStreak} Day Streak
                  </p>
                  <p className="font-body-md text-[13px] text-[#d2c4b3]/70">
                    <span className="text-[#D4AF37]">Reward:</span> +{achievement.requiredStreak * 10} XP & Badge
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37] font-label-sm uppercase tracking-widest hover:bg-[#D4AF37]/10 transition-colors mt-6"
          >
            Close Guide
          </button>
        </div>
      </div>
    </>
  );
};

// ── Milestone Node ────────────────────────────────────────────
interface MilestoneNodeProps {
  achievement: StreakAchievement;
  index: number;
  isUnlocked: boolean;
  isCurrent: boolean;
  currentStreak: number;
  onTap: () => void;
}

const MilestoneNode: React.FC<MilestoneNodeProps> = ({
  achievement,
  index,
  isUnlocked,
  isCurrent,
  currentStreak,
  onTap,
}) => {
  const daysRemaining = achievement.requiredStreak - currentStreak;

  return (
    <div className="flex flex-col items-center gap-3 cursor-pointer" onClick={onTap}>
      {/* Milestone Circle */}
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
          isUnlocked
            ? 'milestone-node-unlocked text-[#0B1220]'
            : isCurrent
              ? 'milestone-node-current text-[#0B1220]'
              : 'milestone-node-locked text-[#7a6d5f]'
        }`}
      >
        <div className="w-8 h-8">{getIconComponent(achievement.iconKey)}</div>
      </div>

      {/* Milestone Info */}
      <div className="text-center">
        <h3 className="font-garamond text-sm text-[#e5e2e1] font-bold leading-tight">
          {achievement.title}
        </h3>
        <p className="font-label-sm text-[10px] text-[#d2c4b3]/60 uppercase tracking-widest mt-1">
          {achievement.requiredStreak} Days
        </p>
      </div>

      {/* Status Badge */}
      {isCurrent && !isUnlocked && (
        <div className="px-2 py-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10">
          <span className="font-label-sm text-[9px] text-[#D4AF37] uppercase tracking-widest">
            {daysRemaining} Days Left
          </span>
        </div>
      )}

      {isUnlocked && (
        <div className="px-2 py-1 rounded-full border border-[#4ade80]/40 bg-[#4ade80]/10">
          <span className="font-label-sm text-[9px] text-[#4ade80] uppercase tracking-widest">
            ✓ Unlocked
          </span>
        </div>
      )}
    </div>
  );
};

// ── Sacred Journey Path ───────────────────────────────────────
interface SacredJourneyPathProps {
  currentStreak: number;
}

export const SacredJourneyPath: React.FC<SacredJourneyPathProps> = ({ currentStreak }) => {
  const [selectedAchievement, setSelectedAchievement] = useState<StreakAchievement | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showHelpSheet, setShowHelpSheet] = useState(false);

  const achievementStates = STREAK_ACHIEVEMENTS.map((achievement) => {
    const isUnlocked = currentStreak >= achievement.requiredStreak;
    const isCurrent =
      !isUnlocked &&
      (STREAK_ACHIEVEMENTS.indexOf(achievement) === 0 ||
        STREAK_ACHIEVEMENTS[STREAK_ACHIEVEMENTS.indexOf(achievement) - 1].requiredStreak <=
          currentStreak);
    return { ...achievement, isUnlocked, isCurrent };
  });

  const handleMilestoneClick = (achievement: StreakAchievement) => {
    setSelectedAchievement(achievement);
    setShowDetailSheet(true);
  };

  return (
    <div className="relative">
      {/* Help Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowHelpSheet(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D4AF37]/30 bg-[#1a1410]/60 hover:bg-[#1a1410]/80 transition-colors"
        >
          <span className="material-symbols-outlined text-[#D4AF37] text-lg">help</span>
          <span className="font-label-sm text-[11px] text-[#D4AF37] uppercase tracking-widest">
            Guide
          </span>
        </button>
      </div>

      {/* Sacred Journey — scroll is owned by the parent page */}
      <div>
        <div className="relative py-8">

          {/* Center Journey Line */}
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2">
            <div className="w-[3px] h-full bg-gradient-to-b from-[#D4AF37]/10 via-[#D4AF37]/80 to-[#D4AF37]/10 rounded-full" />
          </div>

          <div className="space-y-20">
            {achievementStates.map((achievement, index) => {
              const left = index % 2 === 0;
              return (
                <div key={achievement.id} className="relative flex items-center justify-center">

                  {/* Left Card */}
                  {left && (
                    <div className="absolute left-0 w-[38%]">
                      <button
                        onClick={() => handleMilestoneClick(achievement)}
                        className="w-full rounded-2xl border border-[#D4AF37]/20 bg-[#1a1410]/70 backdrop-blur-md p-4 text-left hover:border-[#D4AF37]/50 transition-all"
                      >
                        <h3 className="font-garamond text-[#D4AF37] text-base font-bold">
                          {achievement.title}
                        </h3>
                        <p className="text-xs text-[#d2c4b3]/60 mt-1">
                          {achievement.requiredStreak} Day Streak
                        </p>
                      </button>
                    </div>
                  )}

                  {/* Center Milestone Node */}
                  <div className="relative z-20">
                    <button
                      onClick={() => handleMilestoneClick(achievement)}
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                        achievement.isUnlocked
                          ? 'milestone-node-unlocked text-[#0B1220]'
                          : achievement.isCurrent
                            ? 'milestone-node-current text-[#0B1220]'
                            : 'milestone-node-locked text-[#7a6d5f]'
                      }`}
                    >
                      <div className="w-8 h-8">{getIconComponent(achievement.iconKey)}</div>
                    </button>
                  </div>

                  {/* Right Card */}
                  {!left && (
                    <div className="absolute right-0 w-[38%]">
                      <button
                        onClick={() => handleMilestoneClick(achievement)}
                        className="w-full rounded-2xl border border-[#D4AF37]/20 bg-[#1a1410]/70 backdrop-blur-md p-4 text-left hover:border-[#D4AF37]/50 transition-all"
                      >
                        <h3 className="font-garamond text-[#D4AF37] text-base font-bold">
                          {achievement.title}
                        </h3>
                        <p className="text-xs text-[#d2c4b3]/60 mt-1">
                          {achievement.requiredStreak} Day Streak
                        </p>
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Detail Sheet */}
      <MilestoneDetailSheet
        achievement={selectedAchievement}
        isOpen={showDetailSheet}
        onClose={() => setShowDetailSheet(false)}
        currentStreak={currentStreak}
      />

      {/* Help Sheet */}
      <HelpSheet isOpen={showHelpSheet} onClose={() => setShowHelpSheet(false)} />
    </div>
  );
};
