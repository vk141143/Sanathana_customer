# Chant implementation and deployment

The dashboard's Chant action and the existing Sadhana Japa/Mantras actions now open the same responsive Chant experience. The previous hardcoded counter is replaced. The customer library contains only published database records; no production mantra text or analytics were seeded.

## Repository audit

- Authentication: `src/lib/firebase.ts` and `AuthView.tsx` use Firebase. `public.users.id` is an application UUID, while `firebase_uid` is a Firebase string. Existing Sadhana SQL references `auth.users(id)`. These identities are not interchangeable.
- `supabase_users.sql` grants anonymous read/write access to the legacy users table. Consequently, Chant does **not** use that table to establish ownership or authorization. Its existing policies were not changed because that would alter registration and other application flows.
- No existing admin application, Chant tables, or migration directory was present. The supplied schema describes `admin_users`; the new CMS lives under Chant → Manage Chant in this application and requires an explicit operator-created identity binding.
- Existing scriptures, chapters, slokas, festival content, and Sadhana database tables are unchanged.
- Existing Express Firebase verification and server-side R2 SDK configuration were reused. The new upload handler performs authorization before buffering binary uploads. The CORS middleware now permits PUT and DELETE for favourites.
- The provided schema snapshots are reference material, not executable migrations. The remote database's actual policies, grants, constraints, and migrations have not been inspected through a live connection.

## Migrations

Apply, in this order, to a backed-up staging database first:

1. `supabase/migrations/202610180001_chant.sql`
2. `supabase/migrations/202610180002_chant_analytics.sql`

Each migration runs in a transaction. Use the Supabase migration runner or execute each complete file in the SQL editor exactly once. These are versioned migrations, not scripts to repeatedly paste. A pre-existing object with the same name fails the transaction rather than silently accepting a different schema. Requires PostgreSQL 15+ for security-invoker views and an existing `public.admin_users(id uuid)` table. There are no destructive changes to existing tables.

Before deployment, inspect `pg_policies`, grants, triggers, indexes, and existing functions on the live database. In particular, ensure customers cannot write `admin_users` or provision bindings. Do not execute the schema dumps supplied in the request.

| Object | Relationship / purpose |
| --- | --- |
| `chant_identities` | Independent UUID for each server-verified Firebase UID. No client access. Never inferred from email or legacy `users` data. |
| `chant_admin_bindings` | Explicit Firebase UID → existing admin UUID. Operators provision this; no frontend/API write endpoint exists. |
| `chant_categories` | Draft/published/archived categories with ordering and artwork. Ten suggested category names are seeded as drafts. |
| `chants` | Canonical text, source, rights, targets, category FK, cover, publication and attribution. |
| `chant_translations` | Unique chant/language pair, six supported languages, independent publication. Requires meaning before publication. |
| `chant_media` | R2 metadata, chant FK, language/type/status/order. One published default per chant/type/language. |
| `user_chant_favourites` | Unique identity/chant pair. Access exclusively through the verified backend. |
| `chant_sessions` | Identity and chant FKs; unique per-user UUID retry key; count, status, active time, reflection, version and generated malas. |
| `chant_daily_stats` | Derived security-invoker view over completed sessions, grouped by identity and Asia/Kolkata completion date. No duplicated aggregate writes. |

Indexes cover publication/category ordering, user history, completed-session analytics, media parent lookup, and default-asset uniqueness. Content/session update triggers maintain `updated_at`.

`chant_session_action` locks the owned session, checks its expected version, and applies one operation. Undo never goes below zero. Pause/resume reject invalid transitions. Completion requires at least one count, is idempotent, and cannot subsequently be modified. Exceeding a target is allowed. Completion does not award XP.

`chant_analytics` and `chant_customer_totals` aggregate real records. All three RPCs are executable only by `service_role`; the Express routes establish identity and authorization. Anonymous/Supabase-authenticated roles have SELECT on published content through RLS and no grants/policies for private records. Firebase tokens are not passed to Supabase as though they were Supabase Auth tokens.

## Backend and admin setup

Configure the Express deployment:

- Existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for public content.
- `SUPABASE_SERVICE_ROLE_KEY` **server only**, never a `VITE_` variable.
- `FIREBASE_PROJECT_ID`, matching the frontend Firebase project.
- Existing R2 account ID, access key ID, secret access key and bucket variables.
- `CLOUDFLARE_R2_PUBLIC_URL`, an HTTPS delivery origin for the configured bucket.
- Existing `VITE_API_BASE_URL` on separately hosted frontend deployments and the appropriate `HARVED_ALLOWED_ORIGINS` on the backend.

With a verified admin Firebase account and a trusted active `admin_users` record, provision a binding from an operator SQL session:

```sql
insert into public.chant_admin_bindings(firebase_uid, admin_id)
values ('VERIFIED_FIREBASE_UID', 'EXISTING_ADMIN_UUID');
```

Replace both placeholders. Do not match by an unverified email or a customer-submitted UUID. Reopening Chant exposes Manage Chant to a bound active administrator. `viewer` reads content/aggregate metrics; `editor` and `super_admin` manage content. Only `super_admin` can retrieve per-customer session history. Deactivation is checked on each request.

Publication workflow: publish a category, create/save a chant draft, supply original text/source/copyright status, publish the chant, and separately publish approved translations and uploaded media. Original-only practice does not require translations. Missing languages stay disabled; there is no automatic English or Sanskrit translation fallback. Featured records sort first on the home section.

Manage translations/media from a saved chant's buttons. Uploads create draft media. Preview, set title/language/default/status, then save. For chant covers, upload artwork and use the returned URL/key in the chant form. Categories have their own artwork upload control after saving. Replacement uploads get new random keys; archive the previous asset. Archived files are removed from discovery, not deleted from R2.

Allowed assets: PNG/JPEG/WebP (5 MB), MP3/WAV/Ogg audio (25 MB). MIME and file signatures are checked; SVG is rejected. Storage paths and URLs for media records are server-generated and cannot be overwritten by the CMS API. Browser uploads go through the authenticated Express server with progress indication. R2 credentials stay server-side. R2 object upload and database insert cannot be one transaction: a failed metadata insert can leave an unreferenced object for operator cleanup. Public delivery URLs are not access-controlled; knowing a draft/archived asset URL still permits retrieval. Use a private delivery design if asset confidentiality is required.

## Customer progress and Sadhana

Customers can browse/search/filter, read original text and approved translations, play audio, save favourites, choose configured/custom targets, count, undo, pause, resume, complete, abandon, and inspect paginated history. Up to ten most recently active/paused sessions are offered for recovery. Sessions remain accessible if content is later archived, but archived text/media are not re-exposed.

Each accepted tap is server-acknowledged before the next tap is enabled. There is no offline tap queue: failed actions show an error and reload the saved state rather than inventing progress. Heartbeats record visible active time every 15 seconds; per-request elapsed time is capped at 30 seconds, paused time is excluded, and millisecond accumulation avoids losing rapid-tap fractions. Abrupt browser shutdown can contribute up to the 30-second inactivity grace on recovery. Language usage records the explicitly selected translation, or `original`.

The existing application Sadhana checklist and profile Chant total are refreshed from verified backend totals on login/completion, including across page reloads. Sign-out now also signs out Firebase. **Existing `sadhana_progress` / `sadhana_practice_log` database writes and XP integration are intentionally not connected:** there is no verified Firebase → Supabase Auth mapping in this repository. Establish an operator-verified identity bridge and a shared server-side XP policy before enabling those writes. Creating a UUID equality assumption would corrupt ownership. Existing unrelated Sadhana data is preserved.

Daily activity uses Asia/Kolkata. An active practitioner has at least one completed session in the relevant period. Weekly active users use a rolling seven days. Completion rate is completed / (completed + abandoned); active/paused sessions are excluded. New practitioners had their first completion in the last seven days; returning practitioners completed in that window with an earlier first completion. The customer count is **registered Chant identities**, not all Firebase accounts or legacy profiles. Admin reporting includes daily repetition charts, totals, popular chants, language usage, and super-admin customer UUID filtering/history, without exposing unrelated profile fields.

## Validation and remaining checks

- `npm test`: 21 tests passed, zero failed. This runs existing audio tests and new Chant tests, including real PostgreSQL execution through PGlite. Tests cover migrations, FK/unique/check constraints, RLS/private grants, publication and parent archival, Firebase rejection, ownership, replay rejection, undo/pause/resume, completion idempotency, aggregates, role checks, and upload signature/field restrictions.
- `npm run build` builds frontend and Express backend. A large frontend chunk warning remains.
- `npm run lint` currently reports six pre-existing errors: ContactView's `focusRingColor`, MeditationView's `geeta` route, and incomplete return/default types in SadhanaProgressEngine. New Chant files have no reported TypeScript errors. `tsconfig.json` now excludes build output so generated assets are not typechecked during concurrent builds.
- Live Firebase login, hosted Supabase policies, actual R2 transfers, and browser/device responsive interaction still require staging verification. No production database changes or R2 uploads were performed here. PGlite testing is not a substitute for reviewing the live database grants and existing objects.
- No separate external admin repository was available. This implementation supplies a CMS inside the existing application rather than modifying an unseen admin panel.

Rollback: first deploy the previous application/backend and remove admin bindings or disable the Chant route. Preserve/export all Chant tables. The new objects are isolated; do not drop them while any deployed clients depend on them. If later removing objects, have an operator remove dependent views/functions/triggers before tables, in reverse dependency order, after backup. No rollback operation is automated or destructive.

## Files

Added: the two SQL migrations; `server/chantRouter.ts`; `src/lib/chant.ts`; `src/components/chant/{ChantExperience,ChantAdmin,ChantHomeSection}.tsx`; `src/components/chant/chant.css`; `tests/chant.test.ts`; this document.

Updated for Chant: `server.ts`, `server/cors.ts`, `src/App.tsx`, `src/components/HomeView.tsx`, `src/components/JapaCounterModal.tsx`, `.env.example`, `package.json`, `package-lock.json`, and `tsconfig.json`. Existing unrelated working-tree changes were preserved.
