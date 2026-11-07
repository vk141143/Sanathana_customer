# Meditation unification inspection (before implementation)

## Existing flows

- Admin lives in sibling `../devotiona_admin-main/devotiona_admin-main`. `src/views/cms/SadhanaPracticesView.tsx` creates/edits all five categories through `sadhanaPracticeService` and the `sadhana-practices` Edge Function. Existing fields include metadata, behavior/targets, benefits, tags, activation/archive, three media slots and category-specific configuration.
- Meditation JSON already contains `is_guided`, `breathing_guidance`, `begin_instructions`, `end_instructions`, and `localized_content`. The shared translation editor supports en/te/hi/kn/ta/ml meaning and instructions. Empty languages are omitted, but empty individual fields become null. There is no meditation style selector. Client and Edge Function share `sadhanaPracticeValidation.ts`; it validates breathing guidance and guided mode, but not beginning/ending text. PATCH merges behavior with the current record, though category-specific parsing without a category has a validation gap.
- Customer `practiceCatalog.ts` selects active, unarchived `sadhana_practices`, normalizes JSON, resolves localized meaning/instructions and implements completion rules. `SadhanaPracticesView` routes Meditation to `MeditationView`; Japa/Mantra retain recitation, mala and audio controls; Gratitude supports journal/reflections; Scripture resolves catalogue references and opens the reader. Generic visit state is explicitly not persisted.
- `MeditationView` uses the existing authenticated `/api/meditation` router. Its library also queries meditation categories, translations, audio, phases, recommendations and stages. Consequently existing Sadhana JSON instructions and direct ambient URLs are bypassed. Session start/pause/resume/heartbeat/complete/abandon and history/reflections/preferences already use persisted meditation session tables. Opening a practice does not start a session. The current timer automatically requests completion at the selected duration regardless of `completion_rule`; resume does not set the local playing flag.
- Router verifies Firebase tokens and linked users, scopes sessions/history to the verified UID, and invokes `meditation_session_action` for atomic versioned actions. Service credentials are server-only. No definition of this RPC exists in either inspected repository. Admin migration 021 defines a different session shape (`elapsed_duration_seconds`, without the runtime's `version`/`active_duration_seconds`). Live persistence cannot be established from these migrations alone.
- Sadhana weighting, XP, logical-day streaks and milestones live in `SadhanaProgressEngine.ts`, `progressConfig.ts` and existing database logic; these must remain untouched.
- Admin migrations 017–019 define/extend `sadhana_practices` and JSONB. RLS grants public reads only for active/unarchived practices and reserves writes for service role. Admin Edge Functions call `requireAdmin`; uploads use `sadhana-media` signed R2 PUTs with unique keys and `IfNoneMatch: '*'`, then inspect the uploaded object. R2 credentials remain in Edge Function environment variables. Migration 021 adds the separate meditation content/persistence structures; no new content tables are needed.

## Implementation boundaries

Use Sadhana JSON and direct media URLs for Meditation content, preserve the existing session API and progress calculations, and leave all stored records and R2 objects untouched. Add `category_config.meditation_style` only; reuse existing localized content for reviewed text. No database migration is planned. Admin changes must be staged locally before requesting filesystem access to the sibling project.

## Delivery report

### Files changed

Customer repository:

- `src/services/sadhana/meditationConfig.ts`: resolves seven styles, guided/silent behavior, target duration/units, existing direct/legacy media URLs and existing localized presentation.
- `src/services/sadhana/practiceCatalog.ts`: falls back to reviewed English localized text before legacy base text.
- `server/meditationRouter.ts`: the existing library endpoint reads only active, unarchived Meditation rows in `sadhana_practices`; session creation resolves duration and mode from those definitions. Retains the existing response shape, token checks, ownership and versioned persistence RPC. Separate content collections are returned empty; their tables and records are untouched.
- `src/components/MeditationView.tsx`: uses Sadhana guidance, translations, benefits, difficulty, duration and media; silent mode suppresses guided audio; ambient audio is optional and loops. Pause stops audio, resume restores timer state. Only timer-elapsed rules auto-request completion; manual/audio completion requires an explicit action, with audio completion gated on the guided recording ending. A loaded catalogue cannot fall back to a stale initial practice.
- `tests/meditationConfig.test.ts`, `tests/meditationView.test.tsx`, `tests/meditationRouter.test.ts`: configuration, mounted UI and existing API contract regression coverage.
- `package.json`: includes the new tests in the standard suite.
- `docs/meditation-unification.md`: inspection and delivery record.

Sibling admin repository (`../devotiona_admin-main/devotiona_admin-main`), applied with filesystem approval:

- `src/types/sadhanaPractice.ts`: optional style union in `MeditationConfig`.
- `src/views/cms/SadhanaPracticesView.tsx`: style selector in the existing Meditation editor; retains guided mode, guidance, translation editor and upload slots. Blank translated fields are omitted.
- `src/services/sadhanaPracticeValidation.ts`: validates styles and beginning/ending instructions, revalidates category config against the merged record on PATCH, and trims/omits empty translations.
- `tests/sadhanaPractices.test.ts`: create/edit coverage for all styles, media preservation, empty text removal and invalid-style rejection on partial updates.

Existing unrelated admin working-tree changes were retained; the list above identifies only files touched for this task.

### Reuse and storage

Reused `SadhanaPracticesView`, `MeditationView`, `getPracticePresentation`, `getPracticeTarget`, the shared translation editor, `sadhanaPracticeService`, shared server validation, `sadhana-practices`, `sadhanaMediaService` and `sadhana-media`. Kept the existing meditation history/session/reflection/preferences API and persistence RPC. Japa mala/repetition controls, Mantra chanting, Gratitude and Scripture UI were not changed.

Only new JSON key: `category_config.meditation_style`, with `guided`, `silent`, `breathing`, `mantra`, `visualization`, `mindfulness`, `relaxation`. Existing `is_guided` controls audio for styles other than guided/silent. Existing `localized_content.{en,te,hi,kn,ta,ml}.{meaning,instructions}` supplies manually reviewed text; no generated translations were stored.

No migrations, new tables, new API endpoints, data updates, R2 uploads/deletions, permission changes or progress-calculation changes. Existing URLs remain stored as before. Separate legacy meditation content tables are no longer consulted by this customer library; existing content must be authored through Sadhana Practices.

### Verification

- Customer full suite: 130 tests passed, including Japa/Mantra, category definitions, visibility, progress/streak regressions, configuration and library access tests. Subsequently added session-API and mounted UI tests were run separately (see below).
- New mounted Meditation UI test: passed guided/silent rendering, optional looping ambient audio, English/Telugu switching, no completion on opening/audio ending alone, pause/resume and explicit completion. Uses mocked authentication/session services; it does not prove live database writes.
- Session API regression: verifies Sadhana-configured duration and silent mode, rejects other durations, and forwards heartbeat/pause/resume/complete/abandon to the existing RPC using verified ownership and version. Uses a mocked repository, not live PostgreSQL persistence.
- Admin existing full suite: 85 passed. Updated Sadhana suite: 23 passed, including the additional all-style create/edit test (86 distinct admin tests across these runs).
- Admin TypeScript: passed, including after the new test.
- Customer TypeScript: fails on five existing errors in unchanged files: unsupported `focusRingColor` in `ContactView.tsx:167`; missing progress/result fields in `SadhanaProgressEngine.ts:131,226,316,414`. No errors remained in the changed implementation or UI test after fixing its React test-helper import.
- Customer and admin frontend production builds: passed. Existing large-chunk and customer mixed static/dynamic import warnings remain.
- `git diff --check`: passed in the customer repository. Sandbox Node user-info/esbuild access failures required approved test/build runs outside the sandbox.

### Remaining verification limits

The existing `meditation_session_action` RPC is absent from the supplied SQL, and migration 021's session columns differ from those used by the existing runtime. A deployed schema/RPC inspection and authenticated end-to-end session test are still required before claiming live completion, reload persistence or XP/streak updates work. This change deliberately preserves that API instead of inventing replacement progress tables or reward logic. In particular, server-side enforcement of each completion rule cannot be verified without that RPC definition.

No live admin-account, R2 upload or native browser audio playback test was performed. Existing secure upload/authorization tests pass; no credentials or production records were used. The existing session API accepts 1–120 minutes, while admin duration validation permits longer practices; this pre-existing limit is unchanged.
