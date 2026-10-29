# Customer Chant / Sadhana investigation

## Status and evidence

The original authenticated HTTP 400 is **not reproduced or conclusively diagnosed**. The working tree already contained a zero-based page validator, a 503 for missing backend configuration, and separate 400/401/500 handling when this task began. `/me?page=0` is valid in that handler. Changing it to page 1 would skip the first 20 sessions.

The running localhost endpoint returned 401 to an unsigned request. There was no browser token or original server log available. The local `.env.local` has the public Supabase configuration but no `SUPABASE_SERVICE_ROLE_KEY`. With a valid Firebase token, this source requires that server-only key and returns 503 if absent. This is a confirmed configuration gap, not proof of the cause of the earlier 400. Restart the backend after configuring it; do not put the key in a `VITE_` variable or send it in chat.

The route logger previously discarded the message on Supabase's plain-object errors as `Unknown error`. It now retains the server-side message and code while continuing to return a generic safe 500 to customers. Capture the original response body and matching server log to finish diagnosis.

Read-only REST inspection of active, non-archived `sadhana_practices` succeeded. All columns selected by the catalogue were present in the returned record. OpenAPI schema inspection returned 401, and further private-table inspection was rejected at the approval step. Deployed private tables, grants and policies have **not** been verified. No production writes, migrations or credential changes were performed.

The live Hare Krishna definition (`d372156c-e861-47cb-bc94-3a55849efeb2`) uses timer mode, duration target 15, duration_minutes 15, manual completion, and a separate enabled count preset of 108. Its target_unit is `repetitions` despite target_type being `duration`. This caused the old view to hide the enabled counter and label the timer target incorrectly. The original two-line mantra and reviewed six-language content were present in the record.

## Changes made in this task

Pre-existing uncommitted changes were retained. These are the files edited or added during this task, not an inventory of all working-tree changes:

- `server/chantRouter.ts`: preserve Supabase plain-object error diagnostics in server logs.
- `src/lib/chantTransport.ts`, `src/lib/chant.ts`: extract testable authenticated transport, preserve zero-based requests and API error bodies, share concurrent identical GETs, release failed requests for explicit retry, and isolate requests by token. No automatic history retry loop or response cache.
- `src/components/chant/ChantExperience.tsx`: separate history loading/errors from discovery; react to sign-in changes; reject stale history/detail responses; clear private state on account changes; guard asynchronous session updates; stop repeated heartbeat retries after failure; validate audio URLs. Strict Mode remains enabled.
- `src/services/sadhana/practiceCatalog.ts`: keep current Supabase client/RLS and existing active/non-archived query; defer browser initialization for tests; isolate concurrent injected queries; keep duration and repetition targets separate; honor enabled timer-mode Japa counters; reject invalid targets; require explicit confirmation after guided audio ends.
- `src/components/SadhanaPracticesView.tsx`: signed-out/loading/error/retry states; show the independent repetition preset; ambient audio never satisfies audio completion; preserve original mantra line breaks and reviewed localized content; fix the existing TypeScript predicate error. Personal reflections remain component-local and never modify definitions.
- `src/services/sadhana/practiceReading.ts`: resolve configured published scripture/chapter/verse references through the existing catalogue, reject invalid or ambiguous references and unavailable endpoints of a verse range, and never substitute another scripture.
- `src/components/ScriptureReader.tsx`, `src/components/SadhanaTracker.tsx`, `src/App.tsx`: open the resolved reading in the existing reader and pass through existing bookmark and reading-progress callbacks. Opening the reader does not award practice XP.
- `tests/chant.test.ts`, `tests/sadhanaPractices.test.ts`: transport coalescing/error/auth tests, timer-plus-counter regression based on real configuration, explicit audio confirmation, invalid targets, and exact scripture-reference/range tests. Existing route, SQL ownership, RLS, replay and idempotent completion tests remain.

## Persistence / migration gap

No migration is required for these UI, transport and diagnostic changes. Do not apply the existing Chant SQL files blindly: verify the deployed schema and migration history first. The existing backend depends on the objects defined in `supabase/migrations/202610180001_chant.sql` and `202610180002_chant_analytics.sql`.

Admin-created practice sessions remain **visit-only**, with an explicit UI notice. They do not write the legacy log or award XP. This limitation existed before this task; it is not a completed persistent integration.

The declared `sadhana_practice_log` supports meditation/japa/mantra/gratitude but has no definition UUID, session retry key, in-progress state or private reflection. The app signs in with Firebase, while legacy progress RLS uses Supabase `auth.uid()`. The code has no verified identity mapping. The existing progress engine performs separate read/upsert/log operations with a daily done check; that is not a cross-request atomic idempotency mechanism. It must not be called speculatively from the new catalogue.

A backward-compatible extension needs operator review after inspecting the actual private schema:

1. Establish a verified Firebase-to-Supabase user identity mapping, or an approved Supabase-authenticated session flow. Never equate unrelated UUIDs or trust a client-supplied user ID.
2. Add an owner-scoped practice-session model referencing the real definition UUID, with a unique `(owner, client_session_key)`, version, state, target snapshot, elapsed time, repetitions and private reflection. This is a **proposal**, not an assertion that such a table exists.
3. Provide authenticated server updates with ownership checks and active/non-archived definition validation. Completion must lock the session and progress row and insert an idempotency receipt in the same transaction as any allowed legacy log/progress updates.
4. Reuse the current XP constants, level thresholds, logical-day/grace handling, daily threshold, streak and once-per-day practice rules. Validate equivalence to `SadhanaProgressEngine` before deployment. Do not introduce a scripture XP type into legacy constraints; continue its existing reading-progress path until an explicit scoring policy exists.
5. Restrict private session reads/updates to owners and definitions to customer reads through RLS; test cross-user access, archived-ID access, concurrent completions and transaction rollback. Grant no customer write access to shared definitions.

Existing Chant SQL completion is idempotent and does not award XP; the PGlite tests verify its duplicate-request behavior. That does not establish duplicate-XP safety for the legacy engine or supply persistence for definition-based practices.

## Verification

- `npm test`: 41 passed, zero failed (includes PostgreSQL migrations/RLS/state-machine execution in PGlite).
- `npm run lint` is the repository's TypeScript check (`tsc --noEmit`), not a separate ESLint run. Six pre-existing errors remain: ContactView's `focusRingColor`; MeditationView's `geeta` route; four incomplete result/default objects in SadhanaProgressEngine. The practice-view predicate error was fixed. No scoring code or stored progress was changed to silence these errors.
- `npm run build`: frontend and server bundles build; Vite reports the large main chunk and mixed static/dynamic import warnings.
- Tests/build require execution outside this Windows sandbox: tsx's user lookup and esbuild's configuration access failed inside it.
- No authenticated browser end-to-end or mounted React effect test was available. Transport concurrency is tested; actual Strict Mode UI replay, sign-out during a request, media interaction, reader callbacks and error rendering still need browser verification. No claim is made that unit/PGlite tests prove deployed RLS or legacy XP integration.

## Local verification

1. Configure the server-only Supabase service key and matching Firebase project configuration in the existing backend environment. Restart `npm run dev` so it runs current source. Do not change pagination to one-based.
2. Sign in, open Chant, and inspect `/api/chant/me?page=0` in Network. A new user should receive empty arrays and zero totals; an unsigned call should receive 401; malformed pagination should receive 400. A database failure should show a safe error and leave discovery usable. If history still fails, retain its response body and matching server log without credentials.
3. Open Sadhana → Sacred Practice → Hare Krishna Maha Mantra Japa. Check the database name/text, original two lines, language preference, 15-minute target, enabled counter and separate 108 repetition preset. Opening, starting the timer and playing audio must leave repetitions at zero. Each explicit recitation click adds one. Manual completion remains required for this record.
4. Test guided and ambient audio with valid staging media. Neither increments repetitions. For an audio-completion rule, only eligible guided/general audio unlocks the explicit completion button; ambient audio does not.
5. Test empty catalogue, failed request/retry, signed-out access, switching accounts, rapid close/reopen and Strict Mode. Configure a scripture practice in staging and verify exact published references, invalid-reference errors, bookmarks and existing reading progress. Do not change production definitions just to test.
6. Completing visit-only practices must not claim to save XP. Refreshing clears their unsaved session/reflection, as disclosed in the view. Persistent session/XP acceptance testing must wait for the reviewed identity and transaction extension above.
