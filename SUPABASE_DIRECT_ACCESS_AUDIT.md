# Meditation, Chant and Sadhana direct-access architecture audit

## Status

Implementation is blocked at the identity/schema verification required by sections 3 and 4 of the supplied brief. The new attachment contains the instructions only, not the promised authoritative schema, policies or authentication configuration. This audit describes repository evidence, not verified live database state.

No runtime files, environment settings, authentication, IDs, schemas, policies or UI were changed in this task. No backend errors were suppressed. No customer endpoints were removed. No new queries were implemented pending the contracts below.

## Existing authentication and ownership

- `src/lib/firebase.ts` initializes Firebase Authentication. `AuthView.tsx` signs in with Firebase email/password or Google.
- `src/lib/supabase.ts` initializes `createClient(url, anonKey)` without a Firebase access-token provider. No Supabase sign-in, session exchange, or verified Firebase third-party-auth integration was found in the repository.
- `AuthView.tsx` upserts/looks up `public.users` by `firebase_uid`. This is a profile lookup, not a Supabase authentication session.
- `supabase_users.sql` defines `users.id` as an independently generated UUID and `firebase_uid` as unique text.
- Chant uses a separate, established mapping: verified Firebase UID → `chant_identities.firebase_uid` → `chant_identities.id` UUID. Private Chant `user_id` columns reference that UUID, not `users.id` or `auth.users.id`.
- Meditation verifies the Firebase token with Firebase Admin, checks `users.firebase_uid`, and uses the Firebase UID directly in private-table filters.
- `sadhana_progress.sql` instead defines `sadhana_progress.user_id` as a UUID referencing `auth.users(id)`. The Meditation router queries the same table using `firebase_uid`, a column absent from the checked-in SQL. The mapping between these identities cannot be established from the provided files.

Passing a Firebase UID to `.eq(...)` is not authentication or an ownership policy. Direct access must wait for the actual verified JWT identity contract and owner policies.

## Customer endpoint and operation map

| Customer flow / caller | Current endpoint | Existing database operation |
| --- | --- | --- |
| `MeditationView` via `services/meditationApi.ts` | GET `/api/meditation/library` | Select active/non-archived meditation rows from `sadhana_practices`; read published categories, translations, audio, stages; read phases, daily recommendations and stage assignments |
| Meditation history; Sadhana overview; Journey | GET `/api/meditation/history?page=N` | Select `user_meditation_sessions` ordered by `started_at`, 20 per page; select preferences, progress and reflections filtered by verified `firebase_uid` |
| Meditation preferences | POST `/api/meditation/preferences` | Upsert `user_meditation_preferences`, conflict key `firebase_uid`; validate language, duration, type and boolean preferences |
| Meditation start | POST `/api/meditation/sessions` | Verify published practice and configured duration; upsert `user_meditation_sessions` with `firebase_uid`, `practice_id`, `session_type`, `planned_duration_seconds`, `client_session_key`; deduplicate on `(firebase_uid,client_session_key)` |
| Meditation recovery | GET `/api/meditation/sessions/:id` | Select by session `id` AND verified `firebase_uid` |
| Meditation heartbeat/pause/resume/complete/abandon | POST `/api/meditation/sessions/:id/action` | RPC `meditation_session_action(p_firebase_uid,p_session_id,p_action,p_version,p_position_seconds)`; returned session, awarded XP and progress consumed by UI |
| Meditation reflection | PUT `/api/meditation/sessions/:id/reflection` | Verify owned completed session; upsert `user_meditation_reflections` with `firebase_uid`, `meditation_session_id`, `mood`, `reflection_text`, `intention_text`; conflict key `meditation_session_id` |
| Chant private data; `App.tsx`; `ChantHomeSection`; Sadhana overview; Journey | GET `/api/chant/me?page=N` | Resolve/create Chant identity; select owned `chant_sessions` (20/page), favourites, `chant_daily_stats` (90 rows), resumable sessions (10); RPC `chant_customer_totals`; separately determine admin role |
| Chant favourite | PUT/DELETE `/api/chant/favourites/:id` | Upsert/delete `user_chant_favourites` by mapped `user_id` and `chant_id`; validate publication before insertion |
| Chant start | POST `/api/chant/sessions` | Validate published chant/translation and target; upsert `chant_sessions` with mapped `user_id`, `chant_id`, `target_count`, `client_session_key`, `language_code`; deduplicate on `(user_id,client_session_key)` and verify retry configuration |
| Chant tap/undo/heartbeat/pause/resume/complete/abandon | POST `/api/chant/sessions/:id/action` | RPC `chant_session_action(p_user,p_session,p_action,p_version,p_reflection)` handles locked/versioned updates, timestamps and active duration |
| Published Chant catalogue | Already direct Supabase | `chantCatalog.ts`: published `chant_categories`, `chants`, `chant_translations`, `chant_media` |
| Sadhana / practice-based Japa catalogue | Already direct Supabase | `practiceCatalog.ts` / `practiceChant.ts`: active/non-archived `sadhana_practices`; its table DDL/RLS is absent |
| Legacy Sadhana engine | Already direct Supabase | Select/upsert `sadhana_progress` by supplied `user_id`; no authenticated identity resolution is performed by the engine |

No Meditation favourites persistence endpoint/table definition was found in the inspected implementation. Its intended table and ownership must be supplied rather than invented. Catalogue Japa's visit-only counter and legacy persisted Chant sessions are distinct flows; practice IDs cannot be substituted for `chants.id`.

## RLS and grants audit

The table below describes checked-in SQL only. “Unknown” means the authoritative DDL, grants and policies are absent; router queries are not proof of database permissions. RLS predicates alone are insufficient without corresponding SQL grants.

| Table/view | Identity / ownership | SELECT | INSERT | UPDATE | DELETE | Safe browser migration now? |
| --- | --- | --- | --- | --- | --- | --- |
| `users` | `firebase_uid` text; independent `id` UUID | `USING(true)` for anon/authenticated | `WITH CHECK(true)` | `USING(true)` and `WITH CHECK(true)` | No policy in supplied SQL | No: policies do not enforce ownership |
| `chant_identities` | `firebase_uid` → `id` UUID | Revoked, no browser policy | Revoked | Revoked | Revoked | No |
| `chant_admin_bindings` | `firebase_uid` → admin UUID | Revoked | Revoked | Revoked | Revoked | No; preserve privileged admin boundary |
| `chant_categories` | Published content | `published_categories`: published only | Revoked | Revoked | Revoked | Public reads already direct |
| `chants` | Published content with visible category | `published_chants`: published and category published/null | Revoked | Revoked | Revoked | Public reads already direct |
| `chant_translations` | Parent `chant_id` | `published_translations`: published and visible parent | Revoked | Revoked | Revoked | Public reads already direct |
| `chant_media` | Parent `chant_id` | `published_media`: published and visible parent | Revoked | Revoked | Revoked | Public reads already direct |
| `user_chant_favourites` | `user_id` → `chant_identities.id` | Revoked, no owner policy | Revoked | Revoked | Revoked | No |
| `chant_sessions` | `user_id` → `chant_identities.id` | Revoked, no owner policy | Revoked | Revoked | Revoked | No |
| `chant_daily_stats` | Derived per `user_id`; security-invoker view | Revoked from anon/authenticated | Derived view | Derived view | Derived view | No; underlying sessions also denied |
| `sadhana_progress` | `user_id` → `auth.users.id` | `auth.uid() = user_id` | Same ownership WITH CHECK | Same ownership USING; PostgreSQL uses it as implicit WITH CHECK | No policy | Identity unresolved; SQL differs from current router/engine fields |
| `sadhana_practice_log` | `user_id` → `auth.users.id` | Owner predicate | Owner WITH CHECK | No policy | No policy | Identity unresolved |
| `sadhana_milestones` | `user_id` → `auth.users.id` | Owner predicate | Owner WITH CHECK | No policy | No policy | Identity unresolved |
| `today_sadhana_summary` | Derived progress view | View exists, invoker setting/grants not established for safe customer use | N/A | N/A | N/A | Do not substitute this view without verifying its security contract |
| `sadhana_practices` | Catalogue; DDL absent | Unknown | Unknown | Unknown | Unknown | Existing read flow retained; cannot audit policy |
| `user_meditation_sessions` | Router uses `firebase_uid` | Unknown | Unknown | Unknown | Unknown | No |
| `user_meditation_preferences` | Router uses `firebase_uid` | Unknown | Unknown | Unknown | Unknown | No |
| `user_meditation_reflections` | Router uses `firebase_uid`, session ownership | Unknown | Unknown | Unknown | Unknown | No |
| `meditation_categories` | Catalogue | Unknown | Unknown | Unknown | Unknown | No |
| `meditation_practice_translations` | `practice_id` | Unknown | Unknown | Unknown | Unknown | No |
| `meditation_audio_assets` | `practice_id` | Unknown | Unknown | Unknown | Unknown | No |
| `meditation_session_phases` | `practice_id` | Unknown | Unknown | Unknown | Unknown | No |
| `meditation_daily_recommendations` | `practice_id`, date/language | Unknown | Unknown | Unknown | Unknown | No |
| `meditation_stages` | Catalogue | Unknown | Unknown | Unknown | Unknown | No |
| `meditation_stage_practices` | `practice_id`, `stage_id` | Unknown | Unknown | Unknown | Unknown | No |

`admin_users` is also consulted by `/me` for `adminRole`, but its DDL/RLS is absent. Customer data loading must ultimately be separated from privileged admin authorization.

## Security exceptions needing the actual database contract

1. The existing profile SQL is permissive: comments saying “own record” do not make `USING(true)` enforce ownership. Do not copy these policies onto private practice records. Whether these policies are deployed is unknown.
2. `chant_session_action` is SECURITY DEFINER, trusts its `p_user` argument and is executable only by `service_role`. Granting browser execution unchanged would let a caller supply another identity. It cannot be exposed as-is.
3. `chant_customer_totals` similarly accepts arbitrary `p_user` and is service-role-only. `chant_analytics` is privileged/admin-only and must remain outside customer access.
4. The `meditation_session_action` definition, grants, triggers and transaction semantics are missing. Raw browser updates cannot be assumed equivalent to its duration, completion, XP and streak behavior.
5. RLS owner isolation alone does not preserve atomic session transitions, duplicate completion prevention or derived XP integrity. The authoritative constraints/triggers/functions must specify those invariants before replacing locked RPC operations with direct mutations.
6. `sadhana_progress.sql` lacks `firebase_uid` queried by Meditation and newer fields written/typed by the progress engine, including `today_xp`, `today_completion_percentage`, `total_xp` and `highest_level`. The current deployed definition is required.

## Required inputs to resume implementation

Provide schema-only SQL/migrations (no user rows, secrets or tokens), including:

- Actual definitions, foreign keys, constraints, indexes, defaults, triggers, grants and SELECT/INSERT/UPDATE/DELETE policies for every Meditation table above and any Meditation favourites table.
- Current `sadhana_practices`, `sadhana_progress`, practice logs, milestones/achievements and related views/functions.
- Current Chant identities, sessions, favourites, stats, customer totals and session-action functions, including any migrations newer than the two checked in.
- The existing Firebase-to-Supabase authentication configuration: whether Supabase trusts Firebase JWTs, the configured Firebase project identity, relevant claim names/roles, or the existing session-exchange implementation if one exists. Do not supply live JWTs or credentials.
- The authoritative ownership relationship among Firebase UID, `users.id`, `chant_identities.id` and `auth.users.id`. If no mapping exists, explicitly confirm that; do not assume these independently generated IDs are interchangeable.
- The permitted customer mutation contract for session transitions and progress awards. If current policies still deny all browser access, a secure database-policy/function migration requires an architectural decision before frontend replacement.

## Remaining server dependencies

- Private Meditation and Chant customer operations remain on Express until the blockers are resolved.
- Chant admin CRUD, customer/admin analytics and R2 uploads use privileged operations and must retain their backend/service-role configuration unless separately migrated.
- `/api/guidance` requires the Gemini secret. Translation TTS uses Firebase Admin verification, Sarvam and storage credentials; it uses the Supabase anon key rather than the service-role key. These unrelated server features must remain intact.
- `npm run dev` currently starts Express + Vite. `build:frontend` already exists. A frontend-only `dev:frontend` command can be added when implementing the verified migration; running Vite alone today does not make private sessions functional.

## Validation and changes in this task

- Repository-wide searches covered relevant endpoint calls, service-role references, Firebase Admin, browser Supabase initialization, identity exchanges, SQL and RLS definitions. No `SUPABASE_SERVICE_ROLE_KEY` reference was found under `src/`; no credential was copied into frontend code or documentation.
- Only this audit file was created. Existing redesign and uncommitted changes remain intact.
- No tests/builds rerun for this documentation-only audit. The prior redesign's results are recorded separately in `SADHANA_UI_REDESIGN.md`; they do not validate a direct-access migration.
- No database migration or live security test was run. Cross-user isolation cannot be claimed until the actual schema/authentication configuration is supplied and tested.
