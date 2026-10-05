export type NavTab = 'home' | 'library' | 'explore' | 'sadhana' | 'profile' | 'meditation' | 'achievements' | 'auth' | 'notifications' | 'festivals';

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

export interface ReadingProgress {
  scripture_id: string;
  chapter_id: string;
  verse_number: number;
  language: string;
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
  preferred_reading_language?: string;
  reading_progress?: ReadingProgress | null;
  bookmarks: string[]; // Verse IDs
  notes: { [verseId: string]: string };
  gratitudeLogs: { date: string; blessing: string }[];
  chantCount: number;
}

export interface Festival {
  id: string;
  name: string;
  alternate_name?: string;
  festival_type: 'Major Festival' | 'Ekadashi' | 'Purnima' | 'Amavasya' | 'Jayanti' | 'Vrata' | 'Utsava' | 'Other';
  short_description?: string;
  description?: string;
  festival_date?: string;
  start_date?: string;
  end_date?: string;
  status: 'Draft' | 'Published' | 'Archived';
  banner_url?: string;
  story_url?: string;
  puja_url?: string;
  // Panchanga
  tithi?: string;
  paksha?: string;
  tithi_start?: string;
  tithi_end?: string;
  nakshatra?: string;
  yoga?: string;
  karana?: string;
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonset?: string;
  location?: string;
  timezone?: string;
}

export interface FestivalDetail extends Festival {}

export interface FestivalMedia {
  id: string;
  festival_id: string;
  media_type: 'banner' | 'thumbnail' | 'illustration' | 'deity' | 'story' | 'puja' | 'gallery' | 'audio' | 'video' | 'notification';
  storage_key: string;
  public_url: string;
  file_name?: string;
  display_order: number;
}

export interface FestivalDeity {
  id: string;
  festival_id: string;
  deity_name: string;
  deity_image_url?: string;
  deity_description?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface FestivalSettings {
  id: string;
  festival_id: string;
  show_on_home: boolean;
  is_featured: boolean;
  priority: number;
}

export interface FestivalTiming {
  id: string;
  festival_id: string;
  shubha_muhurta_start?: string;
  shubha_muhurta_end?: string;
  puja_start?: string;
  puja_end?: string;
  manchi_samayam_start?: string;
  manchi_samayam_end?: string;
  rahu_kalam_start?: string;
  rahu_kalam_end?: string;
  yamagandam_start?: string;
  yamagandam_end?: string;
  gulika_start?: string;
  gulika_end?: string;
  parana_time?: string;
  brahma_muhurta_start?: string;
  brahma_muhurta_end?: string;
  abhijit_start?: string;
  abhijit_end?: string;
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonset?: string;
}

export interface StorySection {
  title: string;
  content: string;
}

export interface StoryJson {
  title: string;
  sections: StorySection[];
}

export interface PujaSection {
  title: string;
  content: string;
}

export interface PujaJson {
  title: string;
  sections: PujaSection[];
}
