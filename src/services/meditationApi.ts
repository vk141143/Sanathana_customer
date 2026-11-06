import { auth } from '../lib/firebase';
import type { SadhanaPractice } from './sadhana/practiceCatalog';

export interface MeditationSession {
  id: string;
  practice_id: string | null;
  session_type: string;
  status: 'in_progress' | 'paused' | 'completed' | 'abandoned';
  planned_duration_seconds: number;
  active_duration_seconds: number;
  last_position_seconds: number;
  started_at: string;
  version: number;
  completion_percentage: number;
}

export interface MeditationHistory {
  sessions: MeditationSession[];
  preferences: {
    preferred_language: string;
    preferred_duration_seconds: number;
    ambient_enabled: boolean;
    bell_enabled: boolean;
    timer_visible: boolean;
    breathing_animation_enabled: boolean;
  } | null;
  progress: {
    current_xp: number;
    level_number: number;
    level_name: string;
    current_streak: number;
    total_meditation_sessions: number;
    total_meditation_minutes: number;
  } | null;
  reflections: Array<{
    meditation_session_id: string;
    mood: string | null;
    reflection_text: string | null;
    intention_text: string | null;
  }>;
}

export interface MeditationLibrary {
  practices: SadhanaPractice[];
  categories: Array<{ id: string; name: string; slug: string; description: string; icon_url: string | null; cover_image_url: string | null; display_order: number }>;
  translations: Array<{ practice_id: string; language_code: string; title: string; subtitle: string; description: string; instructions: string; guided_script: string }>;
  audio: Array<{ practice_id: string; language_code: string; audio_type: string; title: string; public_url: string; is_default: boolean; display_order: number }>;
  phases: Array<{ practice_id: string; phase_type: string; title: string; instructions: string; duration_seconds: number; display_order: number }>;
  recommendations: Array<{ practice_id: string; display_order: number }>;
  stages: Array<{ id: string; name: string; description: string; stage_number: number; recommended_duration_minutes: number }>;
  stage_practices: Array<{ stage_id: string; practice_id: string; display_order: number; is_recommended: boolean }>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to use Meditation.');
  const token = await user.getIdToken();
  const response = await fetch(`/api/meditation${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Meditation service returned an unreadable response.');
  }
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload &&
      typeof payload.error === 'string' ? payload.error : 'Meditation service request failed.';
    throw new Error(message);
  }
  return payload as T;
}

export const meditationApi = {
  getLibrary(language: string): Promise<MeditationLibrary> {
    return request(`/library?language=${encodeURIComponent(language)}`);
  },
  getHistory(page = 0): Promise<MeditationHistory> {
    return request(`/history?page=${page}`);
  },
  savePreferences(input: Record<string, unknown>): Promise<unknown> {
    return request('/preferences', { method: 'POST', body: JSON.stringify(input) });
  },
  startSession(input: { practice_id: string; planned_duration_seconds: number; client_session_key: string }): Promise<MeditationSession> {
    return request('/sessions', { method: 'POST', body: JSON.stringify(input) });
  },
  getSession(id: string): Promise<MeditationSession> {
    return request(`/sessions/${encodeURIComponent(id)}`);
  },
  sessionAction(id: string, input: { action: string; version: number; position_seconds?: number }): Promise<{ session: MeditationSession; xp_awarded: number; progress?: MeditationHistory['progress'] }> {
    return request(`/sessions/${encodeURIComponent(id)}/action`, { method: 'POST', body: JSON.stringify(input) });
  },
  saveReflection(id: string, input: { mood: string | null; reflection_text: string; intention_text: string }): Promise<unknown> {
    return request(`/sessions/${encodeURIComponent(id)}/reflection`, { method: 'PUT', body: JSON.stringify(input) });
  },
};
