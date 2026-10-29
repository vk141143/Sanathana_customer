# Direct public Chant catalogue — 2026-10-19

## Cause and corrected behavior

`/api/chant/me?page=0` is a private account endpoint, not a catalogue endpoint. It returns owned session history, resumable sessions, favourites, daily statistics, totals and the administrative role. `ChantExperience` previously called it on mount, while `ChantHomeSection` and `App` also called it on Firebase sign-in. `chantTransport` normalizes `/me` to `/me?page=0` and coalesces concurrent identical GETs, but cannot prevent separate callers from requesting again after completion.

The exact 503 path is Firebase verification → `/me` → `identity(res)` → `db()` → `chantConfigurationIssue()` → `ChantApiError(503, ..., 'CHANT_NOT_CONFIGURED')`. The local backend lacks `SUPABASE_SERVICE_ROLE_KEY`. Page zero is valid; this failure occurs before database identity resolution or session queries.

Opening Chant, viewing its home section and signing in no longer initiate private account requests. History, Favourites and **Load saved practice & progress** explicitly request them. Existing successful practice/favourite operations still refresh application totals through the existing progress event. Initial personal statistics remain unknown (`--`) until loaded. Administrative navigation remains available after explicitly loading the account.

Public catalogue state and retries are separate from account state and retries. Search is debounced, Strict Mode effect replay cancels the first scheduled catalogue request, and stale/unmounted catalogue results are ignored. Account requests retain transport coalescing and account/generation checks. A private service error explains that published mantras, translations and audio remain available. Favourite toggling first resolves the saved state when it has not been loaded, preventing an unknown favourite state from being treated as unsaved.

## Public data and security

The existing `createChantCatalogue(supabase)` service already uses the configured browser Supabase client and public key. Its queries were retained:

- `chant_categories`: published status and sort order, real names and artwork.
- `chants`: published status, published-parent validation, featured/sort-order ordering, category/search filtering, original text, covers, configured targets and source information.
- `chant_translations`: published status and the selected `chant_id`; existing language preference and original-text fallback are preserved.
- `chant_media`: published status and the selected `chant_id`, default/display ordering; the existing player filters language and usable URLs and separates audio, pronunciation and ambience.

Session creation, manual counter actions, recovery, reflections, favourites, statistics and administrative actions still use the trusted API. Firebase UID is verified there and mapped to `chant_identities.id`. There is no authorized Firebase-to-Supabase browser identity bridge in the current implementation. No private table access was moved into the browser, no key was exposed and no local/mock sessions were substituted for saved sessions. The existing counter is retained but saved practice still requires the secure account service.

The repository migration grants anonymous/authenticated SELECT on the four public content tables, with published-only policies and parent publication checks. Private identity/session/favourite grants remain revoked. The PostgreSQL tests verify these protections. No SQL migration or RLS change is required by this frontend separation, and none was applied. Deployed policy definitions were not inspected with privileged credentials.

## Live check and remaining content blocker

Executed `node scripts/check-chant-public.mjs` against the configured project using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, after the sandbox network restriction required an approved run outside the sandbox. This is read-only and outputs only counts/status, not keys, record content or customer identifiers.

All four public tables returned HTTP 200 with **zero visible rows** for each of published, draft and archived status. Anonymous reads of `chant_identities`, `chant_sessions` and `user_chant_favourites` returned HTTP 401. Thus public queries reach Supabase and private reads are denied. This does **not** verify that an admin-created published record is visible: none was returned. Zero rows cannot distinguish absent/unpublished content from restrictive deployed RLS or a different project used by the admin panel.

The remaining blocker to displaying actual admin content is establishing why that project exposes no published rows. Check that admin and customer use the same project, that chants and their parent categories are published, and that deployed policies match the supplied migration. No records were published or modified as part of this work. No privileged credential is needed merely to browse content that public RLS exposes.

## Changed files in this pass

| File | Change |
| --- | --- |
| `src/App.tsx` | Remove sign-in-triggered private Chant fetch; retain progress-event synchronization. |
| `src/components/chant/ChantExperience.tsx` | Explicit private loading, independent catalogue/history retries, favourite-state lookup and signed-out feedback, unmount protection for detail errors. |
| `src/components/chant/ChantHomeSection.tsx` | Public catalogue hook; clear personal state on auth changes without private fetching; show unknown statistics honestly. |
| `src/components/chant/useChantHistory.ts` | Support disabled automatic loading while preserving explicit refresh and stale-response protection. |
| `src/components/chant/useChantLibrary.ts` | New public-only loading/error hook with debounce and lifecycle cleanup. |
| `src/lib/chantTransport.ts` | Explain private configuration errors while retaining status/code/request ID and no automatic retries. |
| `server.ts` | Clarify startup warning applies to private features, not public catalogue reads. |
| `tests/chantFlow.test.ts` | Published/draft/archived fixtures, cross-chant translation/media isolation and explicit catalogue errors. |
| `tests/chantReact.test.tsx` | Public browsing without private requests, private failure isolation, independent retries, Strict Mode and unmount tests. |
| `scripts/check-chant-public.mjs` | Repeatable read-only public visibility and private denial diagnostic. |
| `README.md` | Distinguish browser-only catalogue setup from optional private-service setup. |
| `CHANT_PUBLIC_CATALOGUE_REPORT.md` | This report. |

Other existing workspace changes were preserved; `JapaCounterModal`, catalogue schema, authentication configuration, XP/streak logic and migrations were not rewritten.

## Verification

- `npm test`: 56 passed, zero failed. Includes fixture-based catalogue/translation/media tests, mounted React hook/audio/counter tests and PostgreSQL RLS/ownership tests. These are not live admin-content tests.
- `npm run lint` / TypeScript: fails with the same six pre-existing errors: ContactView's `focusRingColor`, MeditationView's `geeta` navigation value, and four missing-property errors in SadhanaProgressEngine. No errors reported in the changed Chant files.
- `npm run build`: frontend/backend build passed; existing large-bundle and mixed import warnings remain.
- Live read-only Supabase check: completed with the zero-visible-content limitation described above. No live authenticated saved-session flow was verified.

## Local verification

1. Restart `npm run dev` and open Chant with browser Network tools visible. Initial catalogue browsing should request Supabase content tables, with no `/api/chant/me` call. With the current public visibility, the genuine empty state is expected.
2. Once published rows are publicly visible in the configured project, verify cards, category/search filters, original text, configured targets, translations and language-specific audio without configuring a private key.
3. Select History or Favourites. If the secure account service remains unconfigured, the private error should appear once and the Discover tab should remain usable. Explicit Retry history retries private loading only.
4. Saved counting and recovery require the existing trusted account service; no insecure direct-browser replacement was introduced.
