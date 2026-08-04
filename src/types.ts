export type NavTab = 'home' | 'library' | 'explore' | 'sadhana' | 'profile' | 'meditation' | 'achievements' | 'auth';

export interface Verse {
  id: string;
  chapterNumber: number;
  verseNumber: number;
  sanskrit: string;
  transliteration: string;
  translation: string;
  explanation: string;
  audioUrl?: string;
  bookmarked?: boolean;
}

export interface Chapter {
  number: number;
  title: string;
  subTitle?: string;
  totalVerses: number;
  verses: Verse[];
  image: string;
}

export interface SadhanaTask {
  id: string;
  title: string;
  subtitle: string;
  target: string;
  completed: boolean;
  type: 'meditation' | 'reading' | 'gratitude' | 'chanting' | 'custom';
  progressValue?: number;
  targetValue?: number;
  unit?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progressText?: string;
  lockedText?: string;
  progressPercent?: number;
}

export interface Temple {
  id: string;
  name: string;
  distance: string;
  location: string;
  rating: number;
  reviewsCount: string;
  image: string;
  altText: string;
  timing?: string;
  deity?: string;
  description?: string;
}

export interface SpiritualEvent {
  id: string;
  title: string;
  month: string;
  day: number;
  time: string;
  location: string;
  attendeesCount?: number;
  rsvp?: boolean;
}

export interface EmotionHealingCategory {
  id: string;
  title: string;
  image: string;
  shlokas: Verse[];
  comfortMessage: string;
}

export interface UserProfile {
  name: string;
  title: string;
  avatar: string;
  dayStreak: number;
  booksRead: number;
  eventsCount: number;
  isLoggedIn: boolean;
  email?: string;
  bookmarks: string[]; // Verse IDs
  notes: { [verseId: string]: string };
  gratitudeLogs: { date: string; blessing: string }[];
  chantCount: number;
}
