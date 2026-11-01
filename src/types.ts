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
  alternate_name: string | null;
  slug: string;
  festival_type: string;
  short_description: string | null;
  primary_deity: string | null;
  associated_deities: unknown;
  tradition: string | null;
  status: 'Draft' | 'Published' | 'Archived';
  is_active: boolean;
  cover_media_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FestivalOccurrence {
  id: string;
  festival_id: string;
  year: number;
  festival_date: string;
  tithi_name: string | null;
  paksha: string | null;
  nakshatra_name: string | null;
  yoga_name: string | null;
  shubha_muhurta_start: string | null;
  shubha_muhurta_end: string | null;
  puja_time_start: string | null;
  puja_time_end: string | null;
  rahu_kalam_start: string | null;
  rahu_kalam_end: string | null;
  yamagandam_start: string | null;
  yamagandam_end: string | null;
  gulika_kalam_start: string | null;
  gulika_kalam_end: string | null;
  fasting_enabled: boolean;
  fasting_type: string | null;
  parana_required: boolean;
  parana_time: string | null;
  fasting_rules: string | null;
  custom_timings: unknown;
  status: 'draft' | 'review' | 'published' | 'archived';
}

export interface FestivalContent {
  id: string;
  festival_id: string;
  occurrence_id: string | null;
  festival_description: string | null;
  spiritual_significance: string | null;
  festival_story: unknown;
  scriptural_references: unknown;
  puja_name: string | null;
  puja_duration_minutes: number | null;
  puja_description: string | null;
  puja_samagri: unknown;
  puja_vidhi: unknown;
  story_r2_key: string | null;
  story_r2_url: string | null;
  puja_r2_key: string | null;
  puja_r2_url: string | null;
  related_scriptures: unknown;
  related_slokas: unknown;
  related_mantras: unknown;
  related_stotrams: unknown;
  related_music: unknown;
  related_stories: unknown;
  created_at: string;
  updated_at: string;
}

export interface FestivalMedia {
  id: string;
  festival_id: string;
  occurrence_id: string | null;
  media_type: 'image' | 'audio' | 'video' | 'banner' | 'gallery' | 'story_json' | 'puja_json' | 'notification' | string;
  storage_key: string;
  public_url: string;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  display_order: number;
  title: string | null;
  description: string | null;
  r2_key: string | null;
  duration_seconds: number | null;
  language_code: string | null;
  alt_text: string | null;
  caption: string | null;
  sort_order: number;
  is_cover: boolean;
}

export interface FestivalSettings {
  id: string;
  festival_id: string;
  show_on_home: boolean;
  is_featured: boolean;
  priority: number;
  show_from: string | null;
  show_until: string | null;
  show_in_calendar: boolean;
}

export interface FestivalListItem extends Festival {
  occurrence: FestivalOccurrence | null;
  settings: FestivalSettings | null;
  coverMedia: FestivalMedia | null;
}

export interface FestivalDetail extends Festival {
  occurrence: FestivalOccurrence | null;
  content: FestivalContent | null;
  media: FestivalMedia[];
  settings: FestivalSettings | null;
  coverMedia: FestivalMedia | null;
}
