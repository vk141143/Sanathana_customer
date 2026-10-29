# Chant configuration investigation — 2026-10-19

## Confirmed blocker

The supplied current log is HTTP 503 with `CHANT_NOT_CONFIGURED`, not HTTP 400. Inspection of environment variable names (without printing secrets) found `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`, but no `SUPABASE_SERVICE_ROLE_KEY`.

In `server/chantRouter.ts`, `db()` calls `chantConfigurationIssue()` and throws `ChantApiError(503, ..., 'CHANT_NOT_CONFIGURED')` before constructing the Supabase client. `/me` reaches this via `identity(res)`. Therefore this failure precedes identity lookup, session queries, RLS checks, joins, or database constraints. Firebase-to-Chant mapping is not the cause of this observed error. The current `parseZeroBasedPage('0')` succeeds; the earlier 400 cannot be attributed conclusively without its original response and server diagnostics.

The new HTTP regression test verifies missing authentication returns 401 and a verified request to `/api/chant/me?page=0` with a missing private key returns the exact 503 response and a request ID. It uses a test verifier, not a live Firebase customer token.

## Changes in this pass

- `server/chantRouter.ts`: name the missing environment variables precisely; reject blank values, invalid project URLs and the example private-key placeholder. Keep private configuration out of customer responses.
- `tests/chant.test.ts`: configuration validation and missing-key HTTP regression coverage.
- `.env.example`: include the public Supabase settings together with the private server setting and restart instructions.
- `render.yaml`: prompt for the backend private key as an unsynchronized secret.
- `README.md`: document local/hosted setup and end-to-end verification.

Existing uncommitted implementation work was preserved. No customer component was rewritten in this pass.

## Existing data connections inspected and tested

`ChantHomeSection` and `ChantExperience` use the catalogue service; `JapaCounterModal` hosts `ChantExperience`. The catalogue queries `chant_categories` by published status and sort order, and `chants` by published status with category IDs, title, description, original text, guidance, configured targets, covers and featured ordering. Details query published `chant_translations` and `chant_media` by `chant_id`. Archived parents are checked. Language selection preserves original text; audio and manual counting remain separate.

The authenticated server resolves the verified Firebase UID through `chant_identities.firebase_uid` to its UUID `id`. Session and favourite ownership use that UUID in `chant_sessions.user_id` and `user_chant_favourites.user_id`. Session creation uses the selected `chants.id`, configured targets and a retry key. Actions use the existing versioned RPC. `/me` returns sessions, resumable sessions, favourites, stats, totals and adminRole. It additionally requires `chant_daily_stats`, `chant_admin_bindings`, `admin_users` and `chant_customer_totals`; session updates require `chant_session_action`.

`SadhanaPracticesView` uses `sadhana_practices` with `is_active = true`, `archived_at IS NULL`, and display-order/name sorting. Its normalizer handles nullable optional values; selecting extended columns still requires those columns to exist in the deployed schema. Scripture practices use the existing scripture/reading services. There is no verified Sadhana-definition-to-Chant foreign key in the inspected implementation; do not launch a Chant session using a practice UUID or name match. A future nullable `chant_id` relationship would require a separately reviewed migration. Existing XP, streak, level and reading-progress logic was not changed.

## Verification and limits

- `npm test`: 53 passed, 0 failed, including pagination, empty history, identity isolation, published content, session constraints/concurrency, favourites, media events and Strict Mode lifecycle coverage. PostgreSQL tests use PGlite; query/service tests also use fixtures.
- `npm run build`: passed for frontend and backend; large-chunk and mixed static/dynamic-import warnings remain.
- `npm run lint` (the repository TypeScript check): six existing errors in ContactView (`focusRingColor`), MeditationView (`geeta` navigation) and SadhanaProgressEngine (incomplete result/default types). These also occurred before this pass's edits.
- Tests/build required execution outside the Windows sandbox after user-information/directory-access failures.
- Live private schema, RLS and migration deployment remain unverified because the backend credential is absent. No live writes or migrations were performed. The two existing migrations are `202610180001_chant.sql` and `202610180002_chant_analytics.sql`; their presence does not prove deployment. Review existing objects before applying either.

## Local completion steps

1. In `.env.local`, set `SUPABASE_SERVICE_ROLE_KEY` to the private key for the same project as `VITE_SUPABASE_URL`. Do not use the public anon key, prefix the private key with `VITE_`, commit it, or send it in chat.
2. Stop and restart `npm run dev`. The missing-key startup warning should disappear.
3. Sign in and open Chant. Inspect `/api/chant/me?page=0` in browser Network tools: expect HTTP 200 with the existing response shape; a new customer has empty history.
4. Open published content, select a configured target, count manually, pause/resume, reload and verify persistence. Toggle a favourite and verify it after reload. Check another account cannot see these records.
5. If a schema error follows, use the server's operation/code and request ID to identify the missing object before approving any migration. The current configuration failure is not proof of a missing database object.

The live error is not resolved until the private key is configured and the authenticated flow is verified.
