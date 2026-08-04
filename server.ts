import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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
  const PORT = 3000;

  app.use(express.json());

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SANATANA server running on http://localhost:${PORT}`);
  });
}

startServer();
