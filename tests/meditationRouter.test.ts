import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { createMeditationRouter } from '../server/meditationRouter';

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
