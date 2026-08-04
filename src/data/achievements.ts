export interface StreakAchievement {
  id: string;
  title: string;
  description: string;
  requiredStreak: number;
  iconKey: string;
}

export const STREAK_ACHIEVEMENTS: StreakAchievement[] = [
  { id: 'daily-devotee',     title: 'Daily Devotee',     description: 'Maintain a 1 Day Streak',   requiredStreak: 1,   iconKey: 'lotus'   },
  { id: 'sacred-start',     title: 'Sacred Start',      description: 'Maintain a 3 Day Streak',   requiredStreak: 3,   iconKey: 'trishul' },
  { id: 'steady-flame',     title: 'Steady Flame',      description: 'Maintain a 7 Day Streak',   requiredStreak: 7,   iconKey: 'om'      },
  { id: 'discipline-keeper',title: 'Discipline Keeper', description: 'Maintain a 14 Day Streak',  requiredStreak: 14,  iconKey: 'flame'   },
  { id: 'sadhana-warrior',  title: 'Sadhana Warrior',   description: 'Maintain a 21 Day Streak',  requiredStreak: 21,  iconKey: 'bell'    },
  { id: 'temple-guardian',  title: 'Temple Guardian',   description: 'Maintain a 30 Day Streak',  requiredStreak: 30,  iconKey: 'shankha' },
  { id: 'unwavering-soul',  title: 'Unwavering Soul',   description: 'Maintain a 50 Day Streak',  requiredStreak: 50,  iconKey: 'gada'    },
  { id: 'divine-seeker',    title: 'Divine Seeker',     description: 'Maintain a 100 Day Streak', requiredStreak: 100, iconKey: 'chakra'  },
  { id: 'eternal-devotee',  title: 'Eternal Devotee',   description: 'Maintain a 180 Day Streak', requiredStreak: 180, iconKey: 'temple'  },
  { id: 'eternal-light',    title: 'Eternal Light',     description: 'Maintain a 365 Day Streak', requiredStreak: 365, iconKey: 'divine'  },
];

// Legacy compat for App.tsx import
export const ACHIEVEMENTS_DATA = STREAK_ACHIEVEMENTS.map(a => ({
  id: a.id,
  title: a.title,
  description: a.description,
  icon: a.iconKey,
  unlocked: false,
}));
