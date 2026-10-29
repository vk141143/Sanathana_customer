import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createClient } from '@supabase/supabase-js';
import { createAudioCache } from './server/audioCache';
import { chantConfigurationIssue, createChantRouter } from './server/chantRouter';
import { createHarvedCorsMiddleware } from './server/cors';
import { createSarvamTtsRouter, synthesizeSarvamAudio } from './server/sarvamTtsRouter';

dotenv.config({ path: ['.env.local', '.env'] });
const chantSetupIssue = chantConfigurationIssue();
if (chantSetupIssue) console.warn(`Private Chant features unavailable (public catalogue uses Supabase directly): ${chantSetupIssue}`);

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT ?? 3000);

  app.use(createHarvedCorsMiddleware());
  app.use(express.json());
  app.use('/api/chant', createChantRouter());

  app.use('/api/tts', createSarvamTtsRouter({
    verifyIdToken: async token => {
      const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID;
      if (!projectId) throw new Error('Firebase project ID is not configured.');
      const firebaseApp = getApps().find(item => item.name === 'sarvam-tts')
        ?? initializeApp({ projectId }, 'sarvam-tts');
      const decodedToken = await getAuth(firebaseApp).verifyIdToken(token);
      return decodedToken.uid;
    },
    getPublishedSloka: async slokaId => {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase is not configured.');
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
      let url: URL;
      try {
        url = new URL(jsonUrl);
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

      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`Published verse content fetch failed: ${response.status}.`);
      const contentLength = Number(response.headers.get('content-length') ?? 0);
      if (contentLength > 1024 * 1024) throw new Error('Published verse JSON is too large.');
      const jsonText = await response.text();
      if (jsonText.length > 1024 * 1024) throw new Error('Published verse JSON is too large.');
      return JSON.parse(jsonText) as unknown;
    },
    generateAudio: async (text, languageCode) => {
      const apiKey = process.env.SARVAM_API_KEY;
      if (!apiKey) throw new Error('Sarvam API key is not configured.');
      return synthesizeSarvamAudio(text, languageCode, apiKey);
    },
    audioCache: createAudioCache(),
  }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'SANATANA' });
  });

  // AI Divine Wisdom Guidance Endpoint
  app.post('/api/guidance', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const ai = getAiClient();
      const systemInstruction = `You are an enlightened Vedic scholar and spiritual guide in the SANATANA application. 
Provide soothing, wise, compassionate, and practical guidance rooted in the Bhagavad Gita, Upanishads, and ancient Sanatana Dharma. 
Include 1 relevant Sanskrit shloka (with translation) and 2 concise action points for peace of mind. Keep your response brief, warm, and deeply reassuring.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || 'Find peace within through dedication to duty and detachment from worry.';
      return res.json({ guidance: text });
    } catch (error: any) {
      console.error('AI Guidance error:', error);
      return res.status(500).json({
        guidance: `"Fix your mind on the Divine Lord, and rest your intellect in Him alone." — Bhagavad Gita 12.8\n\nWhen facing uncertainty or grief, practice deep breathing, focus on righteous duty, and surrender outcomes to the Universe.`,
      });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`SANATANA server running on port ${port}`);
  });
}

startServer();
