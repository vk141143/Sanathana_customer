import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createClient } from '@supabase/supabase-js';
import { createAudioCache } from './audioCache';
import { synthesizeSarvamAudio } from './sarvamTts';
import {
  SarvamTtsConfigurationError,
  type AudioCache,
  type SarvamTtsDependencies,
} from './translationAudioHandler';

function getPublicContentUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Published verse has an invalid content URL.');
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    !url.hostname ||
    url.hostname === 'localhost' ||
    url.hostname.endsWith('.localhost') ||
    url.hostname.endsWith('.local') ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(url.hostname) ||
    url.hostname.includes(':')
  ) {
    throw new Error('Published verse content URL is not allowed.');
  }
  return url;
}

export function createSarvamTtsDependencies(
  environment: NodeJS.ProcessEnv = process.env,
): SarvamTtsDependencies {
  const cacheVariables = [
    environment.CLOUDFLARE_R2_ACCOUNT_ID,
    environment.CLOUDFLARE_R2_ACCESS_KEY_ID,
    environment.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    environment.CLOUDFLARE_R2_BUCKET_NAME,
  ];
  const configuredCacheVariables = cacheVariables.filter(Boolean).length;
  if (configuredCacheVariables > 0 && configuredCacheVariables < cacheVariables.length) {
    throw new SarvamTtsConfigurationError('Cloudflare R2 audio cache configuration is incomplete.');
  }
  const audioCache: AudioCache = createAudioCache(environment);

  return {
    verifyIdToken: async token => {
      const projectId = environment.FIREBASE_PROJECT_ID ?? environment.VITE_FIREBASE_PROJECT_ID;
      if (!projectId) {
        throw new SarvamTtsConfigurationError('Firebase project ID is not configured on the server.');
      }
      const firebaseApp = getApps().find(item => item.name === 'sarvam-tts')
        ?? initializeApp({ projectId }, 'sarvam-tts');
      const decodedToken = await getAuth(firebaseApp).verifyIdToken(token);
      return decodedToken.uid;
    },
    getPublishedSloka: async slokaId => {
      const supabaseUrl = environment.VITE_SUPABASE_URL;
      const supabaseAnonKey = environment.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new SarvamTtsConfigurationError('Supabase public server configuration is incomplete.');
      }
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await supabase
        .from('slokas')
        .select('json_url')
        .eq('id', slokaId)
        .eq('status', 'Published')
        .maybeSingle();
      if (error) throw new Error('Published verse lookup failed.');
      if (!data || typeof data.json_url !== 'string') return null;
      return { jsonUrl: data.json_url };
    },
    fetchSlokaJson: async jsonUrl => {
      const url = getPublicContentUrl(jsonUrl);
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`Published verse content fetch failed: ${response.status}.`);
      const contentLength = Number(response.headers.get('content-length') ?? 0);
      if (contentLength > 1024 * 1024) throw new Error('Published verse JSON is too large.');
      const jsonText = await response.text();
      if (jsonText.length > 1024 * 1024) throw new Error('Published verse JSON is too large.');
      return JSON.parse(jsonText) as unknown;
    },
    generateAudio: async (text, languageCode) => {
      const apiKey = environment.SARVAM_API_KEY;
      if (!apiKey) {
        throw new SarvamTtsConfigurationError('SARVAM_API_KEY is not configured for the Netlify Function.');
      }
      return synthesizeSarvamAudio(text, languageCode, apiKey);
    },
    audioCache,
  };
}
