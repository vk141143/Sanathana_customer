import express from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { randomUUID } from 'node:crypto';

type Dependencies = {
  db?: () => SupabaseClient;
  verify?: (token: string) => Promise<string>;
};

const LANGUAGES = new Set(['te', 'hi', 'en', 'kn', 'ta', 'ml']);
const SESSION_TYPES = new Set(['guided', 'silent', 'breath_awareness', 'concentration', 'devotional']);
const ACTIONS = new Set(['heartbeat', 'pause', 'resume', 'complete', 'abandon']);
const MOODS = new Set(['peaceful', 'relaxed', 'focused', 'restless', 'neutral']);

export class MeditationApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly code = 'INVALID_REQUEST') {
    super(message);
  }
}

class MeditationDatabaseError extends Error {
  constructor(public readonly operation: string, public readonly code: string | undefined, message: string) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function parsePage(value: unknown): number {
  if (value === undefined) return 0;
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)$/.test(value)) {
    throw new MeditationApiError(400, 'Page must be a non-negative integer.');
  }
  const page = Number(value);
  if (!Number.isSafeInteger(page) || page > 10000) throw new MeditationApiError(400, 'Page is out of range.');
  return page;
}

function isSupportedDuration(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 60 && Number(value) <= 7200;
}

function kolkataDate(value = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  const year = part('year');
  const month = part('month');
  const day = part('day');
  if (!year || !month || !day) throw new Error('Unable to resolve the current local meditation date.');
  return `${year}-${month}-${day}`;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function meditationConfigurationIssue(env: NodeJS.ProcessEnv = process.env): string | null {
  const missing = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter(key => !env[key]?.trim());
  if (missing.length) return `Missing ${missing.join(', ')} in the server environment.`;
  try {
    const url = new URL(env.VITE_SUPABASE_URL!);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return 'VITE_SUPABASE_URL must be a valid Supabase URL.';
  } catch {
    return 'VITE_SUPABASE_URL must be a valid Supabase URL.';
  }
  const key = env.SUPABASE_SERVICE_ROLE_KEY!;
  if (key === 'your_supabase_service_role_key' || key.startsWith('sb_publishable_')) {
    return 'SUPABASE_SERVICE_ROLE_KEY must be configured with a server-only key.';
  }
  try {
    const role = JSON.parse(Buffer.from(key.split('.')[1] ?? '', 'base64url').toString()).role;
    if (role === 'anon' || role === 'authenticated') return 'SUPABASE_SERVICE_ROLE_KEY must be configured with a server-only key.';
  } catch {
    // Opaque secret API keys do not contain JWT claims.
  }
  return null;
}

export function createMeditationRouter(dependencies: Dependencies = {}) {
  const router = express.Router();
  const db = dependencies.db ?? (() => {
    const issue = meditationConfigurationIssue();
    if (issue) throw new MeditationApiError(503, 'Meditation service is not configured.', 'MEDITATION_NOT_CONFIGURED');
    return createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });
  const verify = dependencies.verify ?? (async (token: string) => {
    const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID;
    if (!projectId) throw new MeditationApiError(503, 'Sign-in verification is not configured.', 'AUTH_NOT_CONFIGURED');
    const app = getApps().find(item => item.name === 'meditation') ?? initializeApp({ projectId }, 'meditation');
    try {
      const decoded = await getAuth(app).verifyIdToken(token);
      if (!decoded.uid) throw new MeditationApiError(401, 'Please sign in again.', 'AUTH_INVALID');
      return decoded.uid;
    } catch (error) {
      if (error instanceof MeditationApiError) throw error;
      const code = (error as { code?: string }).code;
      if (['auth/argument-error', 'auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token', 'auth/user-disabled'].includes(code ?? '')) {
        throw new MeditationApiError(401, 'Your sign-in has expired. Please sign in again.', 'AUTH_INVALID');
      }
      throw new MeditationApiError(503, 'Sign-in verification is temporarily unavailable.', 'AUTH_UNAVAILABLE');
    }
  });

  const checked = async <T>(query: PromiseLike<{ data: T; error: { code?: string; message: string } | null }>, operation: string): Promise<T> => {
    const { data, error } = await query;
    if (error) throw new MeditationDatabaseError(operation, error.code, error.message);
    return data;
  };
  const route = (handler: (request: express.Request, response: express.Response) => Promise<void>): express.RequestHandler =>
    async (request, response) => {
      try {
        response.setHeader('Cache-Control', 'no-store');
        await handler(request, response);
      } catch (error) {
        const missingSchema = error instanceof MeditationDatabaseError &&
          ['42P01', '42703', 'PGRST202', 'PGRST204', 'PGRST205'].includes(error.code ?? '');
        const status = error instanceof MeditationApiError ? error.status : missingSchema ? 503 : 500;
        console.error('Meditation request failed:', {
          requestId: response.locals.requestId,
          method: request.method,
          path: request.path,
          status,
          code: error instanceof MeditationDatabaseError ? error.code : error instanceof MeditationApiError ? error.code : undefined,
          operation: error instanceof MeditationDatabaseError ? error.operation : undefined,
          message: errorText(error),
        });
        response.status(status).json({
          error: error instanceof MeditationApiError
            ? error.message
            : missingSchema
              ? 'Meditation database setup is incomplete. Please contact support.'
              : 'Meditation service is temporarily unavailable. Please retry.',
          code: error instanceof MeditationApiError ? error.code : missingSchema ? 'MEDITATION_SCHEMA_UNAVAILABLE' : 'MEDITATION_DATABASE_ERROR',
        });
      }
    };

  router.use((request, response, next) => {
    response.locals.requestId = randomUUID();
    response.setHeader('X-Request-ID', response.locals.requestId);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    if (request.method === 'OPTIONS') {
      response.status(204).end();
      return;
    }
    next();
  });

  router.use(async (request, response, next) => {
    const match = request.headers.authorization?.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      response.status(401).json({ error: 'Sign in to use Meditation.', code: 'AUTH_REQUIRED' });
      return;
    }
    try {
      response.locals.firebaseUid = await verify(match[1]);
      next();
    } catch (error) {
      response.status(error instanceof MeditationApiError ? error.status : 401).json({
        error: error instanceof MeditationApiError ? error.message : 'Your sign-in has expired. Please sign in again.',
        code: error instanceof MeditationApiError ? error.code : 'AUTH_INVALID',
      });
    }
  });

  async function verifiedUid(response: express.Response): Promise<string> {
    const uid = response.locals.firebaseUid;
    if (typeof uid !== 'string' || !uid) throw new MeditationApiError(401, 'Sign in again to continue.', 'AUTH_INVALID');
    const user = await checked(
      db().from('users').select('firebase_uid').eq('firebase_uid', uid).maybeSingle(),
      'resolve verified Firebase user',
    );
    if (!user?.firebase_uid) throw new MeditationApiError(403, 'Your account profile is not ready for Meditation yet.', 'PROFILE_NOT_LINKED');
    return uid;
  }

  async function publishedPractice(id: string) {
    const practice = await checked(
      db().from('sadhana_practices').select('*').eq('id', id).eq('category', 'meditation')
        .eq('is_active', true).is('archived_at', null).maybeSingle(),
      'load published meditation practice',
    );
    if (!practice) throw new MeditationApiError(404, 'This meditation is not available.');
    if (practice.meditation_category_id) {
      const category = await checked(
        db().from('meditation_categories').select('id').eq('id', practice.meditation_category_id)
          .eq('status', 'published').maybeSingle(),
        'verify meditation category visibility',
      );
      if (!category) throw new MeditationApiError(404, 'This meditation category is not available.');
    }
    return practice;
  }

  router.get('/library', route(async (request, response) => {
    await verifiedUid(response);
    const language = typeof request.query.language === 'string' && LANGUAGES.has(request.query.language)
      ? request.query.language
      : 'en';
    const client = db();
    const practices = await checked(
      client.from('sadhana_practices').select('*').eq('category', 'meditation')
        .eq('is_active', true).is('archived_at', null).order('display_order').order('name'),
      'load meditation catalogue',
    );
    const ids = practices.map((practice: { id: string }) => practice.id);
    if (ids.length === 0) {
      response.json({ practices: [], categories: [], translations: [], audio: [], phases: [], recommendations: [], stages: [], stage_practices: [] });
      return;
    }
    const today = kolkataDate();
    const [categories, translations, audio, phases, recommendations, stages, stagePractices] = await Promise.all([
      checked(client.from('meditation_categories').select('*').eq('status', 'published').order('display_order'), 'load published meditation categories'),
      checked(client.from('meditation_practice_translations').select('*').in('practice_id', ids)
        .eq('language_code', language).eq('status', 'published'), 'load published meditation translations'),
      checked(client.from('meditation_audio_assets').select('*').in('practice_id', ids)
        .eq('status', 'published').order('display_order'), 'load published meditation audio'),
      checked(client.from('meditation_session_phases').select('*').in('practice_id', ids)
        .order('display_order'), 'load meditation session phases'),
      checked(client.from('meditation_daily_recommendations').select('*').in('practice_id', ids)
        .eq('recommendation_date', today).eq('language_code', language).order('display_order'), 'load daily meditation recommendations'),
      checked(client.from('meditation_stages').select('*').eq('status', 'published').order('stage_number'), 'load published meditation stages'),
      checked(client.from('meditation_stage_practices').select('*').in('practice_id', ids).order('display_order'), 'load meditation journey assignments'),
    ]);
    const visibleCategories = new Set(categories.map((category: { id: string }) => category.id));
    const visiblePractices = practices.filter((practice: { meditation_category_id?: string | null }) =>
      !practice.meditation_category_id || visibleCategories.has(practice.meditation_category_id));
    const visibleIds = new Set(visiblePractices.map((practice: { id: string }) => practice.id));
    response.json({
      practices: visiblePractices,
      categories,
      translations,
      audio: audio.filter((item: { practice_id: string }) => visibleIds.has(item.practice_id)),
      phases: phases.filter((item: { practice_id: string }) => visibleIds.has(item.practice_id)),
      recommendations: recommendations.filter((item: { practice_id: string }) => visibleIds.has(item.practice_id)),
      stages,
      stage_practices: stagePractices.filter((item: { practice_id: string; stage_id: string }) =>
        visibleIds.has(item.practice_id) && stages.some((stage: { id: string }) => stage.id === item.stage_id)),
    });
  }));

  router.get('/history', route(async (request, response) => {
    const uid = await verifiedUid(response);
    const page = parsePage(request.query.page);
    const client = db();
    const [sessions, preferences, progress] = await Promise.all([
      checked(client.from('user_meditation_sessions').select('*').eq('firebase_uid', uid)
        .order('started_at', { ascending: false }).range(page * 20, page * 20 + 19), 'load meditation history'),
      checked(client.from('user_meditation_preferences').select('*').eq('firebase_uid', uid).maybeSingle(), 'load meditation preferences'),
      checked(client.from('sadhana_progress').select('*').eq('firebase_uid', uid).maybeSingle(), 'load meditation progress'),
    ]);
    const ids = sessions.map((session: { id: string }) => session.id);
    const reflections = ids.length
      ? await checked(client.from('user_meditation_reflections').select('*').eq('firebase_uid', uid).in('meditation_session_id', ids), 'load meditation reflections')
      : [];
    response.json({ sessions, preferences, progress, reflections });
  }));

  router.post('/preferences', route(async (request, response) => {
    const uid = await verifiedUid(response);
    const body = isRecord(request.body) ? request.body : {};
    const input: Record<string, unknown> = {};
    if ('preferred_language' in body) {
      if (typeof body.preferred_language !== 'string' || !LANGUAGES.has(body.preferred_language)) throw new MeditationApiError(400, 'Choose a supported language.');
      input.preferred_language = body.preferred_language;
    }
    if ('preferred_duration_seconds' in body) {
      if (!isSupportedDuration(body.preferred_duration_seconds)) throw new MeditationApiError(400, 'Choose a duration between 1 and 120 minutes.');
      input.preferred_duration_seconds = body.preferred_duration_seconds;
    }
    if ('preferred_session_type' in body) {
      if (body.preferred_session_type !== null && (typeof body.preferred_session_type !== 'string' || !SESSION_TYPES.has(body.preferred_session_type))) throw new MeditationApiError(400, 'Choose a supported meditation type.');
      input.preferred_session_type = body.preferred_session_type;
    }
    for (const field of ['ambient_enabled', 'bell_enabled', 'timer_visible', 'breathing_animation_enabled']) {
      if (field in body) {
        if (typeof body[field] !== 'boolean') throw new MeditationApiError(400, `${field} must be true or false.`);
        input[field] = body[field];
      }
    }
    if (!Object.keys(input).length) throw new MeditationApiError(400, 'Provide at least one preference.');
    const saved = await checked(
      db().from('user_meditation_preferences').upsert({ firebase_uid: uid, ...input }, { onConflict: 'firebase_uid' }).select('*').single(),
      'save meditation preferences',
    );
    response.json(saved);
  }));

  router.post('/sessions', route(async (request, response) => {
    const uid = await verifiedUid(response);
    const body = isRecord(request.body) ? request.body : {};
    if (!isUuid(body.practice_id) || !isUuid(body.client_session_key) || !isSupportedDuration(body.planned_duration_seconds)) {
      throw new MeditationApiError(400, 'Invalid meditation session settings.');
    }
    if (body.language_code !== undefined && body.language_code !== null &&
        (typeof body.language_code !== 'string' || !LANGUAGES.has(body.language_code))) {
      throw new MeditationApiError(400, 'Choose a supported meditation language.');
    }
    const practice = await publishedPractice(body.practice_id);
    if (!practice.available_durations_seconds?.includes(body.planned_duration_seconds)) {
      throw new MeditationApiError(400, 'Choose one of this meditation’s configured durations.');
    }
    const sessionType = practice.meditation_type || 'guided';
    if (!SESSION_TYPES.has(sessionType)) throw new MeditationApiError(503, 'This meditation has an unsupported session type.');
    const client = db();
    await checked(client.from('user_meditation_sessions').upsert({
      firebase_uid: uid,
      practice_id: practice.id,
      session_type: sessionType,
      planned_duration_seconds: body.planned_duration_seconds,
      client_session_key: body.client_session_key,
    }, { onConflict: 'firebase_uid,client_session_key', ignoreDuplicates: true }), 'create meditation session');
    const session = await checked(
      client.from('user_meditation_sessions').select('*').eq('firebase_uid', uid)
        .eq('client_session_key', body.client_session_key).single(),
      'load created meditation session',
    );
    if (session.practice_id !== practice.id || session.planned_duration_seconds !== body.planned_duration_seconds) {
      throw new MeditationApiError(409, 'This retry key belongs to a different meditation session.', 'MEDITATION_SESSION_CONFLICT');
    }
    response.status(201).json(session);
  }));

  router.get('/sessions/:id', route(async (request, response) => {
    const uid = await verifiedUid(response);
    if (!isUuid(request.params.id)) throw new MeditationApiError(400, 'Invalid meditation session ID.');
    const session = await checked(
      db().from('user_meditation_sessions').select('*').eq('id', request.params.id)
        .eq('firebase_uid', uid).maybeSingle(),
      'load owned meditation session',
    );
    if (!session) throw new MeditationApiError(404, 'Meditation session not found.');
    response.json(session);
  }));

  router.post('/sessions/:id/action', route(async (request, response) => {
    const uid = await verifiedUid(response);
    const body = isRecord(request.body) ? request.body : {};
    if (!isUuid(request.params.id) || typeof body.action !== 'string' || !ACTIONS.has(body.action) ||
        !Number.isInteger(body.version) || Number(body.version) < 0 || Number(body.version) > 2147483647 ||
        !Number.isInteger(body.position_seconds ?? 0) || Number(body.position_seconds ?? 0) < 0 || Number(body.position_seconds ?? 0) > 7200) {
      throw new MeditationApiError(400, 'Invalid meditation session action.');
    }
    const result = await db().rpc('meditation_session_action', {
      p_firebase_uid: uid,
      p_session_id: request.params.id,
      p_action: body.action,
      p_version: body.version,
      p_position_seconds: body.position_seconds ?? 0,
    });
    if (result.error) {
      if (result.error.code === 'P0002') {
        response.status(404).json({ error: 'Meditation session not found.', code: 'MEDITATION_SESSION_NOT_FOUND' });
        return;
      }
      if (result.error.code === 'P0001') {
        response.status(409).json({ error: 'The session changed or this action is unavailable. Reload the meditation and retry.', code: 'MEDITATION_SESSION_CONFLICT' });
        return;
      }
      if (result.error.code === '22023') {
        response.status(422).json({ error: result.error.message, code: 'MEDITATION_ACTION_INVALID' });
        return;
      }
      throw new MeditationDatabaseError('meditation session action', result.error.code, result.error.message);
    }
    response.json(result.data);
  }));

  router.put('/sessions/:id/reflection', route(async (request, response) => {
    const uid = await verifiedUid(response);
    const body = isRecord(request.body) ? request.body : {};
    if (!isUuid(request.params.id) ||
        (body.mood != null && (typeof body.mood !== 'string' || !MOODS.has(body.mood))) ||
        (body.reflection_text != null && (typeof body.reflection_text !== 'string' || body.reflection_text.length > 2000)) ||
        (body.intention_text != null && (typeof body.intention_text !== 'string' || body.intention_text.length > 1000))) {
      throw new MeditationApiError(400, 'Reflection contains invalid values.');
    }
    const session = await checked(
      db().from('user_meditation_sessions').select('id,status').eq('id', request.params.id)
        .eq('firebase_uid', uid).maybeSingle(),
      'verify meditation reflection ownership',
    );
    if (!session || session.status !== 'completed') throw new MeditationApiError(404, 'Completed meditation session not found.');
    const saved = await checked(
      db().from('user_meditation_reflections').upsert({
        firebase_uid: uid,
        meditation_session_id: request.params.id,
        mood: body.mood ?? null,
        reflection_text: body.reflection_text ?? null,
        intention_text: body.intention_text ?? null,
      }, { onConflict: 'meditation_session_id' }).select('*').single(),
      'save meditation reflection',
    );
    response.json(saved);
  }));

  return router;
}
