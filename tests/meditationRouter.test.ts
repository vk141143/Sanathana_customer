import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { createMeditationRouter } from '../server/meditationRouter';

test('session creation uses Sadhana duration and mode and actions retain the owned versioned RPC', async () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const key = '22222222-2222-4222-8222-222222222222';
  let saved: any;
  const rpcCalls: any[] = [];
  const db = {
    from(table: string) {
      const query: any = {
        select() { return query; }, eq() { return query; }, is() { return query; },
        upsert(input: any) { saved = { id: key, ...input, version: 0, status: 'in_progress' }; return Promise.resolve({ error: null }); },
        maybeSingle() { return Promise.resolve({ error: null, data: table === 'users' ? { firebase_uid: 'owner' } : {
          id, name: 'Silent', slug: 'silent', category: 'meditation', is_active: true,
          target_type: 'duration', target_count: 5, target_unit: 'minutes', category_config: { is_guided: false },
        } }); },
        single() { return Promise.resolve({ error: null, data: saved }); },
      };
      return query;
    },
    async rpc(name: string, input: any) { rpcCalls.push({ name, input }); return { error: null, data: { session: saved, xp_awarded: 0 } }; },
  };
  const app = express(); app.use(express.json());
  app.use('/api/meditation', createMeditationRouter({ db: () => db as any, verify: async () => 'owner' }));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const post = (path: string, body: unknown) => fetch(`http://127.0.0.1:${address.port}/api/meditation${path}`, {
    method: 'POST', headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  try {
    const created = await post('/sessions', { practice_id: id, client_session_key: key, planned_duration_seconds: 300 });
    assert.equal(created.status, 201);
    assert.equal(saved.session_type, 'silent');
    assert.equal(saved.firebase_uid, 'owner');
    assert.equal(rpcCalls.length, 0);
    assert.equal((await post('/sessions', { practice_id: id, client_session_key: key, planned_duration_seconds: 60 })).status, 400);
    for (const action of ['heartbeat', 'pause', 'resume', 'complete', 'abandon']) {
      assert.equal((await post(`/sessions/${key}/action`, { action, version: 0, position_seconds: 15, firebase_uid: 'attacker' })).status, 200);
      assert.deepEqual(rpcCalls.at(-1), { name: 'meditation_session_action', input: {
        p_firebase_uid: 'owner', p_session_id: key, p_action: action, p_version: 0, p_position_seconds: 15,
      } });
    }
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('library reads only published Sadhana content without a parallel meditation CMS', async () => {
  const tables: string[] = [];
  const filters: unknown[][] = [];
  const db = { from(table: string) {
    tables.push(table);
    const query: any = {
      select() { return query; }, eq(...args: unknown[]) { filters.push(args); return query; },
      is(...args: unknown[]) { filters.push(args); return query; }, order() { return query; },
      maybeSingle() { return Promise.resolve({ data: { firebase_uid: 'user' }, error: null }); },
      then(resolve: (result: unknown) => void) { resolve({ data: [{ id: 'practice', name: 'Quiet', slug: 'quiet', category: 'meditation', is_active: true,
        category_config: { meditation_style: 'silent' }, ambient_audio_url: 'https://media.example/ambient.mp3' }], error: null }); },
    };
    return query;
  } };
  const app = express();
  app.use('/api/meditation', createMeditationRouter({ db: () => db as any, verify: async () => 'user' }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/meditation/library`, { headers: { Authorization: 'Bearer test' } });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.practices[0].category_config.meditation_style, 'silent');
    assert.equal(body.practices[0].ambient_audio_url, 'https://media.example/ambient.mp3');
    assert.deepEqual(tables, ['users', 'sadhana_practices']);
    assert.ok(filters.some(args => args[0] === 'is_active' && args[1] === true));
    assert.ok(filters.some(args => args[0] === 'archived_at' && args[1] === null));
    assert.ok(filters.some(args => args[0] === 'category' && args[1] === 'meditation'));
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('meditation endpoints reject requests without a Firebase bearer token before database access', async () => {
  let databaseCalls = 0;
  const app = express();
  app.use('/api/meditation', createMeditationRouter({
    db: () => {
      databaseCalls += 1;
      throw new Error('Database must not be used for unauthenticated requests.');
    },
    verify: async () => 'verified-firebase-uid',
  }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/meditation/library`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: 'Sign in to use Meditation.',
      code: 'AUTH_REQUIRED',
    });
    assert.equal(databaseCalls, 0);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});
