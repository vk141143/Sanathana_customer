# SANATANA Customer Application — Codebase Inspection

## Scope and evidence

This report inspects the checked-out customer-app source and its checked-in SQL/deployment files. A read-only Supabase lookup and a ranged public-R2 WAV request were also performed for the published `BG.1.1` row. **No live browser playback, Firebase, hosting dashboard, deployed environment values, or current deployment revision were verified.** Secrets and access credentials were not read or reproduced.

Evidence labels:

- **Verified in source** — directly visible in checked-in code or configuration.
- **Verified through test** — covered by the repository test run; this does not establish live deployment behavior.
- **Not verified** — requires an external system, deployed app, or database state unavailable here.
- **Potential issue** — source behavior that could cause the reported symptom, conditional on runtime data/configuration.

## 1. Project Overview

- **Verified in source:** The customer UI is a React SPA built by Vite. Root entry is `index.html` → `src/main.tsx` → `src/App.tsx`.
- **Verified in source:** `package.json` declares React/React DOM `19.0.1`, Vite `^6.2.3`, TypeScript `~5.8.2`, Express `^4.21.2`, Supabase JS `^2.110.8`, Firebase `^12.16.0`, Motion `^12.23.24`, GSAP `^3.15.0`, and Lucide React `^0.546.0`. The most recent local build reported Vite `6.4.3`; this is the resolved local install, not a deployment claim.
- **Verified in source:** The backend is an Express server implemented in `server.ts`. It hosts API routes and, in development, embeds Vite middleware; in production it serves `dist/`.
- **Verified in source:** Supabase is used for content and selected app data. Firebase Authentication is the customer sign-in provider. The Chant API verifies Firebase ID tokens server-side and uses Supabase service-role access.
- **Verified in source:** Integrations also include Sarvam translation TTS, Cloudflare R2, Gemini, and hosted Google Fonts.
- **Not verified:** Which hosting deployments currently serve customers or whether they match this checkout.

## 2. Application Architecture

```text
index.html
  └─ src/main.tsx (React StrictMode)
      └─ src/App.tsx (auth gate, app state, screen switch, modals, bottom nav)
          ├─ AuthView / SplashModal / TempleJourney
          ├─ HomeView
          ├─ ScriptureReader (Library)
          ├─ SadhanaTracker → SadhanaPracticesView → ScriptureReader
          ├─ ExploreView → EmotionDetailView / TempleMapView
          └─ other tab-level views

server.ts (Express)
  ├─ /api/chant/*
  ├─ /api/tts/translation-audio
  ├─ /api/health
  ├─ /api/guidance
  └─ Vite middleware in development or static dist/ in production
```

- **Verified in source:** Navigation is React state (`currentTab`, plus component-local screen state), not URL/router-based routing. There is no router dependency or route table.
- **Verified in source:** `App.tsx` owns the persisted customer profile and Sadhana-task state in `localStorage` (`sanatana_user`, `sanatana_sadhana`). Several individual views maintain their own transient state and query Supabase directly.
- **Verified in source:** `src/lib/supabase.ts` creates a browser Supabase client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Verified in source:** `src/lib/firebase.ts` initializes Firebase client auth; `AuthView.tsx` performs email/password and Google flows.
- **Verified in source:** `src/lib/api.ts` reads `VITE_API_BASE_URL`, strips trailing slashes, and defaults to same-origin (`''`) if unset.
- **Verified in source:** `server.ts` loads `.env.local` and `.env` via dotenv. Development uses Express + Vite middleware. `npm start` serves bundled `dist/server.cjs`; production static files are served from `dist/`.
- **Verified in source:** `netlify.toml` builds and publishes the frontend only. `render.yaml` describes the Express backend service.

## 3. Complete Directory Structure

The checked-in application source tree at inspection time:

```text
src/
  App.tsx
  index.css
  main.tsx
  types.ts
  vite-env.d.ts
  assets/
    golden_lotus.jpg
    images/golden_lotus_icon_1785000076815.jpg
  components/
    AchievementsView.tsx
    AddTaskModal.tsx
    AuthView.tsx
    BottomNav.tsx
    ContactView.tsx
    EmotionDetailView.tsx
    ExploreView.tsx
    FestivalDetailView.tsx
    FestivalsListView.tsx
    GratitudeModal.tsx
    Header.tsx
    HomeView.tsx
    InnerFlameGateway.css
    InnerFlameGateway.tsx
    JapaCounterModal.tsx
    JourneyView.tsx
    MeditationView.tsx
    NotesModal.tsx
    NotificationsView.tsx
    ProfileView.tsx
    SacredJourneyPath.tsx
    SacredMandala.tsx
    SadhanaPracticesView.tsx
    SadhanaTracker.tsx
    ScriptureReader.tsx
    SlokaAudioControl.tsx
    SplashModal.tsx
    TempleJourney.tsx
    TempleMapView.tsx
    TranslationAudioControl.tsx
    audio/
      AudioAlbumDetail.tsx
      AudioAlbumsScreen.tsx
      audioData.ts
      DevotionalAudioView.tsx
      MiniPlayer.tsx
      NowPlayingScreen.tsx
      useAudioPlayer.ts
      useSupabaseAudio.ts
    chant/
      chant.css
      ChantAdmin.tsx
      ChantArtwork.tsx
      ChantAudio.tsx
      ChantCard.tsx
      ChantExperience.tsx
      ChantExperienceContent.tsx
      ChantHomeSection.tsx
      ChantTranslationContent.tsx
      ChantCounter.tsx
      useChantHistory.ts
      useChantLibrary.ts
      usePracticeChants.ts
    healing/
      AnimatedTextReveal.tsx
      DevotionalImage.tsx
      DivineExampleStep.tsx
      EmotionHealingPage.tsx
      GitaStep.tsx
      HealingProgress.tsx
      MantraStep.tsx
      MeaningStep.tsx
      OvercomeStep.tsx
      types.ts
      WizardNavigation.tsx
  data/
    achievements.ts
    emotionsData.ts
    sadhana.ts
    scriptures.ts
    temples.ts
  lib/
    api.ts
    cache.ts
    chant.ts
    chantCatalog.ts
    chantLanguages.ts
    chantTransport.ts
    firebase.ts
    practiceChant.ts
    practiceChantCatalog.ts
    sarvamTts.ts
    scriptureLibrary.ts
    slokaAudio.ts
    supabase.ts
  services/sadhana/
    index.ts
    practiceCatalog.ts
    practiceReading.ts
    progressConfig.ts
    progressTypes.ts
    SadhanaProgressEngine.ts
  utils/audioSynth.ts
```

Other relevant repository paths:

```text
server.ts
server/                 Express routers, CORS and audio cache
supabase/migrations/    checked-in Chant migrations
tests/                  Node test suite, including slokaAudio.test.ts
public/ assets/ scripts/ dist/
*.sql                   additional setup/provisioning scripts at repository root
index.html package.json package-lock.json tsconfig.json vite.config.ts
netlify.toml render.yaml .env.example
```

**Verified in source:** `dist/` and `node_modules/` are generated/dependency directories, not alternate source entry points. Several root Markdown reports document earlier work but do not select runtime code.

## 4. Navigation and Routing

- **Verified in source:** `App.renderActiveTab()` is the main dispatcher. It first enforces the auth gate, then optionally renders the temple map, then switches on `currentTab`.
- **Verified in source:** `BottomNav` exposes Home, Library, Explore, Sadhana and Profile. Festivals suppresses the bottom navigation. Additional views are reached through in-screen actions.
- **Verified in source:** `HomeView` includes entry actions to meditation, chanting, gratitude, Library, devotional music and Sadhana.
- **Verified in source:** No browser URL identifies the current screen or Sloka. A refresh returns to the app's initial state, subject to local stored user state.
- **Verified in source:** `ScriptureReader` is the active Library reader and is also reused inside Sadhana scripture-reading practices. There is no second customer Sloka-reader implementation found.

## 5. Screen-by-Screen Inventory

| Screen / view | Component and parent | Child / navigation | Data, tables and state | Loading/error and reachability |
|---|---|---|---|---|
| Startup / welcome | `SplashModal`, `TempleJourney`; parent `App` | Enter proceeds to journey; journey completion leads to auth when logged out | `localStorage` decides whether splash is initially shown | **Verified in source:** active startup flow; component-local UI state |
| Authentication | `AuthView`; parent `App` auth gate | Email/password, email verification/reset, Google sign-in/profile completion | Firebase Auth; `public.users` upsert/read via Supabase | **Verified in source:** active whenever tab is auth or `user.isLoggedIn` is false; local form loading/error states |
| Home | `HomeView`; parent `App` | Library, Sadhana, meditation, devotional player, chant/gratitude modals | `quote_schedules`, `daily_quotes`, `notifications`, `banner_images`, `users`, `scriptures`, `chapters`; profile/progress from `App` | **Verified in source:** active; quote/loading state, but several Supabase errors are not surfaced |
| Library — Scripture list | `ScriptureReader`; parent `App` | Select scripture → chapter list | `fetchPublishedScriptures()` reads `scriptures` | **Verified in source:** active under `currentTab === 'library'`; loading/error/empty states |
| Library — Chapter list | `ScriptureReader` internal screen | Back to scriptures; select chapter → Sloka list | `fetchPublishedChapters()` reads `chapters` | **Verified in source:** active; loading/error/empty states |
| Library — Sloka list | `ScriptureReader` internal screen | Back to chapters; select row → reader | `fetchPublishedSlokas()` reads `slokas`; optional continue-reading selection | **Verified in source:** active; loading/error/empty states |
| Individual Sloka reader | `ScriptureReader` internal `reader` screen | Back to Slokas; previous/next; language selector; share; bookmark | Selected `slokas` metadata plus one JSON URL fetch; bookmark/progress in `App` state | **Verified in source:** active; JSON skeleton/error; audio control has independent conditional rendering |
| Sadhana tracker | `SadhanaTracker`; parent `App` | Practice list, journey, meditation, devotional audio | `SadhanaProgressEngine` uses `sadhana_progress`; task state in `App` | **Verified in source:** active Sadhana tab; each subview is local screen state |
| Sadhana practice catalogue/session | `SadhanaPracticesView`; parent `SadhanaTracker` | Select practice; scripture practice uses `ScriptureReader` with `initialSelection` | `sadhana_practices`; scripture resolution calls shared scripture catalogue; guided/ambient URLs can come from practice rows | **Verified in source:** active through Sadhana; auth-state listener, loading/error/retry |
| Meditation | `MeditationView`; parent `App` or Sadhana | Back or completion | Local timer and Web Audio bell synthesis | **Verified in source:** active via both paths; local session state |
| Explore / healing | `ExploreView`; parent `App` | `EmotionDetailView`; `TempleMapView` | `emotions`; some static temple/event data | **Verified in source:** active Explore tab; emotion loading/query state |
| Temple map | `TempleMapView`; parent `App` toggle from Explore | Close returns to previous tab | Mostly static temple data | **Verified in source:** reachable from Explore |
| Profile | `ProfileView`; parent `App` | Notes/bookmark modal, sign out | `App` profile state; Firebase sign-out | **Verified in source:** active profile tab |
| Achievements | `AchievementsView`; parent `App` | Back/tab navigation | `user`/achievement data | **Verified in source:** active tab |
| Notifications | `NotificationsView`; parent `App` | Back/tab navigation | `users`, `notifications`; seen IDs persisted client-side | **Verified in source:** active via tab/type/navigation |
| Festivals | `FestivalsListView` → `FestivalDetailView`; parent `App` | Select festival / back | `festivals`, `festival_media`, `festival_deities`, `festival_timings` | **Verified in source:** active tab; detail selected by App state |
| Devotional audio | `DevotionalAudioView`; reached from Home or Sadhana | `AudioAlbumsScreen`, `AudioAlbumDetail`, `NowPlayingScreen`, `MiniPlayer` | `albums`, `audio_tracks`; `useSupabaseAudio`, `useAudioPlayer` | **Verified in source:** active through both entry points; loading/error in album fetch |
| Modals | `GratitudeModal`, `JapaCounterModal`, `AddTaskModal`, `NotesModal`; parent `App` | Local open/close; ChantExperience is inside Japa flow | Most state in `App`; Chant data via Chant API/Supabase catalog | **Verified in source:** active when respective actions are used |

Components such as `JourneyView`, `InnerFlameGateway`, `Header`, and the audio subcomponents are children/reusable components, not independent routes. `src/components/InnerFlameGateway.tsx`, `src/components/JourneyView.tsx`, and `src/components/chant/ChantAdmin.tsx` are not alternate Library readers.

## 6. Library and Scripture Navigation Flow

1. **Verified in source:** Bottom navigation calls `onTabChange('library')`; `App.tsx` renders `ScriptureReader`.
2. **Verified in source:** The reader starts with `screen = 'scriptures'` unless a Sadhana `initialSelection` is supplied.
3. **Verified in source:** Scripture selection calls `fetchPublishedChapters(scripture.id)`.
4. **Verified in source:** Chapter selection calls `fetchPublishedSlokas(chapter.id)`.
5. **Verified in source:** Sloka selection sets the selected index, resets `verseJson`, and switches to `reader`.
6. **Verified in source:** The reader fetches only the selected Sloka's `json_url` using `fetchSlokaJson`; an in-memory cache is keyed by `verse_id` (or `id`).
7. **Verified in source:** Back actions return to the Sloka list, chapter list, or scripture list. Previous/Next changes the selected index. Sadhana scripture reading resolves the same `SlokaMetadata[]` type and renders the same reader.
8. **Potential issue:** The JSON request does not use an abort controller or selection-generation guard. A slow earlier JSON fetch can update shared `verseJson` after selection changes; this is a general stale-content race, not a second reader.

## 7. Sloka Reading Page Architecture

- **Verified in source:** Sanskrit is read from `verseJson.sanskrit.devanagari`; transliteration from `verseJson.sanskrit.transliteration`.
- **Verified in source:** The language selector uses `LANGS = ['en','te','hi','kn','ml','ta']` and chooses `verseJson.languages[selectedLanguage]`.
- **Verified in source:** Translation, meaning, explanation and example are rendered in `ContentBlock` instances in `ScriptureReader.tsx`.
- **Verified in source:** Bookmark action calls `onToggleBookmark(currentSloka.verse_id || currentSloka.id)`. Progress is sent after a 1.5-second debounce with scripture/chapter/verse/language.
- **Verified in source:** `App.tsx` stores this profile state in `localStorage`; no `reading_progress`, `bookmarks`, or `user_preferences` table is written by these reader handlers.
- **Verified in source:** The existing translation TTS button remains in the fixed header beside the language selector. Sanskrit audio controls are also present on eligible Sloka cards and immediately before the Sanskrit text in the reader.
- **Verified in source:** No reader-level animation framework is imported. The reader uses CSS transitions, skeletons and ordinary content layout; other app areas use Motion/GSAP.
- **Verified in source:** `ScriptureReader` is active from both the Library and Sadhana scripture practice paths. The current component is not an unused sample/demo page.

## 8. Supabase Database Inventory

### Schema defined in checked-in SQL

The files under `supabase/migrations/` and root `*.sql` are not a complete canonical database dump. They define only the following tables/views; they do not prove that the migration ran in production.

| Table / view | Columns known from checked-in DDL | Keys / relationships / indexes | RLS / screens |
|---|---|---|---|
| `banner_images` | `id,title,image_url,is_active,created_at,updated_at` | PK `id`; trigger permits only one active banner | RLS enabled; public SELECT and broad anon/authenticated write policies in `supabase_setup.sql`; Home |
| `daily_quotes` | `id,sanskrit,source,is_active,created_at,updated_at` | PK `id`; trigger permits one active quote | RLS enabled; public SELECT and broad anon/authenticated writes; Home fallback |
| `users` | `id,firebase_uid,full_name,email,mobile,avatar_url,day_streak,books_read,events_count,chant_count,bookmarks,created_at,updated_at` | PK `id`; unique `firebase_uid`, unique `email` | RLS enabled, but supplied script grants anon/authenticated SELECT/UPDATE broadly; Auth/Home/Notifications |
| `emotions` | `id,name,tagline,card_image_url,banner_image_url,outside_image_url,gita_sanskrit,gita_reference,gita_transliteration,gita_translation,gita_image_url,what_it_means,means_image_url,example_text,example_image_url,how_to_overcome,mantra_sanskrit,mantra_transliteration,mantra_meaning,mantra_image_url,is_active,sort_order,created_at` | PK `id` | RLS enabled; anon SELECT/INSERT/UPDATE/DELETE policies; Explore/healing |
| `sadhana_progress` | `id,user_id,current_xp,level_number,level_name,current_streak,longest_streak,last_completed_date,today_date,today_meditation_done,today_japa_done,today_mantra_done,today_gratitude_done,completion_percentage,total_meditation_sessions,total_meditation_minutes,total_japa_count,total_mantra_sessions,total_audio_minutes,total_gratitude_entries,milestones_achieved,created_at,updated_at` | PK `id`; unique `user_id` FK to `auth.users(id)`; indexes user/today date | RLS enabled; own-row policies use `auth.uid()`; Sadhana engine |
| `sadhana_practice_log` | `id,user_id,practice_type,xp_awarded,duration_minutes,japa_count,listen_ratio,level_at_time,logged_at` | PK `id`; FK user to `auth.users`; user/time/type indexes | RLS enabled; own-row select/insert |
| `sadhana_milestones` | `id,user_id,streak_days,achieved_at` | PK `id`; FK user to `auth.users`; unique `(user_id,streak_days)`; user index | RLS enabled; own-row select/insert |
| `chant_identities` | `id,firebase_uid,created_at` | PK `id`; unique Firebase UID | RLS; service-role-only data access in Chant migration |
| `chant_admin_bindings` | `firebase_uid,admin_id` | PK Firebase UID; FK to `admin_users(id)` (table definition not in this repo) | RLS; service role |
| `chant_categories` | `id,name,slug,description,icon_url,cover_image_url,sort_order,status,created_by,created_at,updated_at` | PK `id`; unique slug; optional FK `created_by → admin_users` | Published-category SELECT policy; Chant catalogue |
| `chants` | `id,slug,title,short_description,category_id,mantra_type,original_text,transliteration,pronunciation_guide,source_title,source_reference,copyright_status,rights_notes,default_repetition_target,available_targets,is_beginner_friendly,sort_order,featured,status,cover_image_url,cover_image_r2_key,created_by,updated_by,published_at,created_at,updated_at` | PK `id`; unique slug; category FK; optional admin FKs | Published-only SELECT policy; Chant catalogue |
| `chant_translations` | `id,chant_id,language_code,display_title,transliteration,pronunciation_guide,meaning,explanation,life_context,status,created_by,updated_by,created_at,updated_at` | PK `id`; FK to `chants` with cascade; unique `(chant_id,language_code)` | Published-only SELECT policy |
| `chant_media` | `id,chant_id,media_type,language_code,title,storage_provider,storage_key,public_url,duration_seconds,mime_type,file_size_bytes,is_default,status,display_order,created_by,created_at,updated_at` | PK `id`; FK to `chants` with cascade; partial unique default-media index; parent index | Published-only SELECT policy |
| `user_chant_favourites` | `id,user_id,chant_id,created_at` | PK `id`; FKs to `chant_identities` and `chants`; unique `(user_id,chant_id)` | RLS; service role |
| `chant_sessions` | `id,user_id,chant_id,status,counting_mode,language_code,target_count,current_count,completed_malas,started_at,last_activity_at,paused_at,completed_at,duration_seconds,active_milliseconds,reflection,client_session_key,version,created_at,updated_at` | PK `id`; FKs to identity/chant; unique `(user_id,client_session_key)`; history/completed indexes | RLS; service role |
| `chant_daily_stats` view | `user_id,practice_date,completed_sessions,total_repetitions,total_duration_seconds` | View over completed `chant_sessions` | Service-role SELECT only |
| `today_sadhana_summary` view | `user_id,current_xp,level_number,level_name,current_streak,longest_streak` and computed progress fields in the SELECT | View over `sadhana_progress` | Defined in root Sadhana SQL; runtime access not verified |

The Chant migration also defines `chant_session_action`, `chant_customer_totals`, and `chant_analytics` functions. Several Chant tables reference `admin_users`; its schema is not included here.

### Tables referenced by app code but not defined in available DDL

For these objects, the app proves that it references the name/selected fields—not their full schema, constraints, indexes, policies, or existence in production.

| Object(s) | Observed app use / tables queried | Schema status in this repo |
|---|---|---|
| Scripture content: `scriptures`, `chapters`, `slokas` | `scriptures` and `chapters` list/metadata reads; `slokas` reader and TTS reads | No DDL/migration found. `slokas` audio columns are not defined by the customer repo SQL. |
| Legacy/content alternatives: `content_categories`, `content_chapters`, `content_verses` | No query found in customer source | No DDL/query evidence found. |
| Preferences/progress/bookmarks: `user_preferences`, `reading_progress`, `bookmarks` | No table query found; reader state is maintained in `App` and localStorage | No DDL/query evidence found. |
| Devotional media: `albums`, `audio_tracks` | `select('*')`; client interfaces expose album/track fields such as `audio_url`, `album_id`, status and titles | No DDL/migration found. |
| Sadhana catalogue: `sadhana_practices` | Selects `PRACTICE_COLUMNS` or `CHANT_PRACTICE_COLUMNS`, filters active/non-archived rows | No table DDL found here. |
| Home: `quote_schedules`, `notifications` | Schedule/quote fields; notification IDs, targets, timestamps and realtime inserts | No table DDL found here. |
| Festivals: `festivals`, `festival_media`, `festival_deities`, `festival_timings` | List/detail reads and selected media/timing fields | No table DDL found here. |
| Support: `support_tickets` | Select/insert/update/delete by email/title/description/status fields | No table DDL found here. |

**Important requested-table check:** The customer source does not query `content_verses`, `content_categories`, `content_chapters`, `user_preferences`, `reading_progress`, or `bookmarks`; it does query `public.slokas`. Live existence/policies are **not verified**.

## 9. Scripture Data Retrieval

- `fetchPublishedScriptures()` in `src/lib/scriptureLibrary.ts` selects `*` from `scriptures`, filters `status = 'Published'`, orders by name.
- `fetchPublishedChapters()` selects `*` from `chapters`, filters by `scripture_id` and `status = 'Published'`, orders by chapter number.
- `fetchPublishedSlokas()` selects the existing reading fields plus `audio_url`, `audio_r2_key`, `audio_r2_path`, `audio_status`, `audio_duration_seconds`, `audio_file_size_bytes`, and `audio_updated_at` from the same `slokas` rows; filters only by chapter and Published status; orders by verse number.
- Mapping normalizes and preserves all audio fields. It filters rows only if `id` or `json_url` is missing. Audio fields remain optional in TypeScript for compatibility with existing fixtures/callers.
- `fetchSlokaJson()` requests the `json_url` and parses JSON. `ScriptureReader` caches parsed payloads in memory by `verse_id`/`id`.
- Language metadata discovery is in `fetchAvailableLanguagesForChapter()`; the individual reader itself uses the selected payload's `languages` object and does not change the audio path based on selected language.
- **Potential issue:** `loadChapterVersesForLanguage()` has another `slokas` query without audio columns, but repository search found no caller. The active Library and Sadhana readers use `fetchPublishedSlokas()`.
- **Potential issue:** `fetchPublishedSlokas()` catches Supabase errors, logs them and returns `[]`; `ScriptureReader.loadSlokas()` then treats that as a successful empty result. If the select fails (for example, because live schema lacks the selected audio columns or RLS denies rows), the error may not reach the reader's visible error state. This is a plausible cause of no Slokas/button, but is not confirmed against live Supabase.

## 10. JSON Content Architecture

- **Verified in source:** Scripture JSON is stored externally at each row's `json_url`; reader uses `fetch()` in `fetchSlokaJson()`.
- **Verified in source:** The JSON shape consumed includes `sanskrit.devanagari`, `sanskrit.transliteration`, and `languages[code].translation/meaning/explanation/example`.
- **Verified in source:** No JSON schema change is made by this feature. Reader response is cached in a module-level in-memory `Map`.
- **Potential issue:** `loadVerseJson()` has no abort/stale-selection guard. An old request can update `verseJson` after a rapid Sloka change.
- **Not verified:** The live JSON object contents and `json_url` accessibility/CORS.

## 11. Audio and TTS Architecture

### Pre-generated Sanskrit Sloka WAV

- **Verified in source:** `src/lib/slokaAudio.ts` provides the shared `SlokaAudioPlayer` singleton used by `src/components/SlokaAudioControl.tsx` in both the Sloka listing and reader. It uses one browser `Audio` element, prefers a valid `audio_url`, falls back to `audio_r2_path`/`audio_r2_key`, and never calls TTS.
- **Verified in source:** The player manages loading/playing/paused/completed/error states. Starting a different Sloka aborts outstanding config lookup and releases the previous Audio instance; component unmount stops matching playback and clears handlers/source.
- **Verified in source:** The Sloka card's Listen button calls `stopPropagation`, so the parent card continues opening the reader only when the rest of the card is clicked.
- **Verified in source:** It requires no separate auth token in the audio component. The surrounding app gates main screens on customer login.
- **Verified in source:** Audio metadata is selected from the current `slokas` row; there is no eager audio fetch or TTS call. Listing Sanskrit previews lazily fetch existing JSON only for visible cards.
- **Verified through live request:** `BG.1.1` resolves from its stored key to the public R2 domain and returns HTTP 206 with `audio/wav`, a `RIFF/WAVE` signature, and the expected 464204-byte total length.
- **Not verified:** Playback through the deployed customer UI, mobile playback or production CDN behavior.

### Translation TTS (separate feature)

- `TranslationAudioControl.tsx` is a distinct reader-header control, tied to the selected translation string and language.
- It calls `POST /api/tts/translation-audio`, obtains a Firebase ID token, and creates a browser object URL from returned audio.
- `server/sarvamTtsRouter.ts` verifies the Firebase token, rate-limits per user, reads the published Sloka's `json_url`, extracts translation text, calls Sarvam TTS and returns WAV.
- `server/audioCache.ts` uses a bounded in-memory cache if no R2 storage credentials are configured, or a private R2 object cache if all R2 storage credentials are configured.
- **Verified in source:** This is generated translation speech, not the pre-generated Sanskrit recording. It is intended to remain independent.

### Devotional music

- `useSupabaseAudio.ts` fetches `albums` and active `audio_tracks`.
- `useAudioPlayer.ts` owns a persistent `HTMLAudioElement`; supports play/pause, next/previous, shuffle/repeat, metadata/time events and cleanup on hook unmount.
- `DevotionalAudioView.tsx` composes album list/detail, now-playing overlay and mini-player; reached through Home and Sadhana.

### Chant and Sadhana audio

- `src/components/chant/ChantAudio.tsx` renders HTML `<audio controls preload="none">` for published Chant media URLs; Chant catalogue reads `chants`, `chant_categories`, `chant_translations`, and `chant_media`.
- Chant upload is a separate authenticated server capability in `server/chantRouter.ts`; media rows store R2 `storage_key` and `public_url`.
- Sadhana practice rows may supply `guided_audio_url`, `ambient_audio_url`, or `media_url`; `practiceCatalog.ts` validates playable URLs and exposes them to practice UI.
- Meditation's `playBellSound()` synthesizes a short bell with Web Audio oscillator/gain nodes; it is not the Sloka WAV.
- `src/utils/audioSynth.ts` defines AudioContext synthesis utilities, but repository search found no imports/callers; treat as currently unused/legacy pending a broader runtime trace.

## 12. Cloudflare R2 Architecture

- **Verified in source:** Server-side S3-compatible clients use Cloudflare R2 endpoint construction from environment settings in `server/chantRouter.ts` and `server/audioCache.ts`. Secrets are server-side.
- **Verified in source:** Sanskrit Sloka playback reads `VITE_R2_PUBLIC_URL` in the browser; it has no dependency on an Express route or `VITE_API_BASE_URL`.
- **Verified in source:** `resolveSlokaAudioUrl()` removes trailing base slashes and leading object-key slashes. It uses a valid public HTTPS `audio_url` directly; relative keys are appended to `VITE_R2_PUBLIC_URL`.
- **Verified in source:** Expected relative key `sloka-audio/BG/1/1.wav` resolves under the configured origin. No bucket creation or audio upload is performed by the reader.
- **Verified in source:** Private TTS cache objects are stored/fetched using a generated cache key; separate from public admin-uploaded Sloka WAVs.
- **Potential issue:** The browser downloads the recording directly from the public host. A missing object, non-public bucket/domain, wrong base path, or R2/CDN response error will prevent playback.
- **Verified through live request:** The real `sloka-audio/BG/1/1.wav` object is publicly accessible and responds as WAV. No R2 CORS configuration is present in this repo.

## 13. Previous Listen Button Implementation Audit

| Check | Finding |
|---|---|
| Component import/active route | **Verified in source:** `ScriptureReader.tsx` imports `SlokaAudioControl`; `App.tsx` renders this reader for the Library tab. Sadhana scripture practice reuses the same reader. No duplicate Library reader was found. |
| Render location/conditional | **Verified in source:** Listing control is placed below the Sanskrit preview inside each Sloka card; the reader control is placed immediately below the Sanskrit text. Reader control is absent while JSON is loading or unavailable. |
| Card click behavior | **Verified through test:** Clicking the nested Listen button stops click propagation; it does not activate the Sloka card's reader navigation. |
| Supabase row selection | **Verified in source:** Active query selects `audio_url`, `audio_r2_key`, `audio_r2_path`, `audio_status`, duration, size, and update timestamp alongside original fields. |
| Mapping/type preservation | **Verified in source:** Mapping preserves all requested audio fields; TypeScript properties are optional. |
| Row identity | **Verified in source:** Listing and reader pass the selected row's ID and URL/path/key source to the same control and singleton. |
| Visibility predicate | **Verified in source:** A source is required and successful statuses include `ready` (the confirmed admin status), with compatibility for `uploaded` and `published`. |
| Admin status compatibility | **Verified in sibling admin source and live row:** Successful upload writes `audio_status = 'ready'`; the live `BG.1.1` record also has `ready`. |
| Metadata null/missing | **Verified through live lookup:** `BG.1.1` stores a path and ready status; `audio_url`/`audio_r2_key` are null. |
| URL resolver | **Verified in source and test:** Valid HTTPS `audio_url` is used directly; otherwise path then key is appended to the configured public base with slash normalization. |
| Sanskrit audio config | **Verified in source:** No `/api/config/audio` call remains in the player. Relative object paths resolve directly from `VITE_R2_PUBLIC_URL`. |
| `VITE_API_BASE_URL` | Used only by unrelated existing server-backed application features; it is not read by `src/lib/slokaAudio.ts`. |
| Deployment | **Verified in source:** Netlify builds the frontend. The public R2 base must be present as a Vite build-time variable. Deployed variable values were not inspected. |
| CSS/layout | **Verified in source:** Compact Listen controls sit below Sanskrit text with no responsive-hide class. **Not verified:** Actual computed styles/viewport in the deployed browser. |
| Existing translation button | **Verified in source:** It is a different header control and does not control visibility of the Sanskrit icon. |
| Shared playback lifecycle | **Verified through test:** `tests/slokaAudio.test.ts` covers pause/resume, completion/replay, switching Slokas, stale configuration responses, friendly errors, listing button click propagation, and unmount cleanup using a mocked Audio element. The actual R2 object was checked over HTTP; deployed UI playback remains unverified. |
| Sarvam interaction | **Verified in source:** No Sarvam TTS component, route, or service was changed; the Sanskrit player does not reference the translation component. |
| Console/network | **Not verified:** No deployed browser session or remote DevTools trace was available. |
| Stale deploy | **Not verified:** A local source build cannot establish what Netlify currently serves. |

## 14. Deployment and Environment Configuration

### Environment variable names (names only)

**Frontend/build-time:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- `VITE_R2_PUBLIC_URL` (public R2 delivery base for Sanskrit Sloka audio)
- `VITE_API_BASE_URL` (used by unrelated existing server-backed application features)

**Server/runtime:**

- `PORT`, `NODE_ENV`
- `FIREBASE_PROJECT_ID` (or `VITE_FIREBASE_PROJECT_ID` fallback for Firebase Admin)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `SARVAM_API_KEY` (server-only)
- `GEMINI_API_KEY` (server-only)
- `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME` (server-only; required together for private R2 cache/upload functionality)
- `HARVED_ALLOWED_ORIGINS`
- `DISABLE_HMR` (development server behavior)

`APP_URL` is documented in `.env.example` but was not found referenced by the inspected runtime source.

- **Verified in source:** `.env.example` documents `VITE_R2_PUBLIC_URL` for Sanskrit audio. It is a public URL, not a credential.
- **Verified in source:** `netlify.toml` does not define redirects/proxy rules or declare `VITE_API_BASE_URL`.
- **Potential issue:** The repo's `render.yaml` CORS origin default is `https://harved.netlify.app`; a different frontend domain requires the deployed `HARVED_ALLOWED_ORIGINS` to include it.
- **Not verified:** Netlify build environment, Render environment, actual domains, successful API reachability, and current deployment freshness.

## 15. Authentication and RLS

- **Verified in source:** Customer sign-in is Firebase Auth. Supabase's browser client uses the public anon key. The server verifies Firebase ID tokens for private Chant/TTS endpoints.
- **Verified in source:** The translation TTS endpoint requires a Firebase bearer token, validates Sloka ID/language, rate-limits users, and returns generic errors.
- **Verified in source:** Chant migration enables RLS, revokes direct anon/authenticated table access on private tables, grants service role, and exposes published catalogue rows with published-only select policies.
- **Verified in source:** Checked-in legacy SQL policies for `users`, `banner_images`, `daily_quotes`, and `emotions` include broad anon/authenticated read or write access. They are source definitions only; do not infer current live policies.
- **Verified in source:** Sadhana SQL uses Supabase Auth `auth.uid()`-scoped policies; the customer app's primary auth is Firebase, so compatibility of those policies with actual runtime requests needs live verification.
- **Not verified:** RLS on `scriptures`, `chapters`, `slokas`, audio metadata, and the other app-only tables. Their DDL/policies are absent from this repository snapshot.
- **Security note:** Do not expose R2 access keys or the Supabase service-role key to Vite/client code; adding the public URL endpoint does not expose those secrets.

## 16. Bugs and Integration Gaps

1. **Fixed — status mismatch:** The prior predicate accepted only `uploaded`; the admin's actual success literal is `ready`. The visibility helper now accepts `ready`.
2. **Fixed — source fields:** The query and mapper now include all requested URL/key/path/status fields; the actual admin uploader writes a path and `ready`.
3. **Fixed — URL selection:** A valid direct HTTPS `audio_url` is used first; path/key use the configured public base. The tested actual row has no URL/key and uses its R2 path.
4. **Mitigated — chapter listing text:** Sanskrit preview JSON is fetched only when each card approaches the viewport; no Sloka WAV is preloaded.
5. **Unchanged potential issue — silent empty Sloka list:** `fetchPublishedSlokas()` logs a Supabase error and returns `[]`; a schema/RLS failure can still look like no content.
6. **Unchanged potential issue — stale JSON selection:** `ScriptureReader.loadVerseJson()` has no stale-request guard for rapid navigation; this predates the audio change.
7. **Deployment consideration:** Relative audio paths require the frontend build-time `VITE_R2_PUBLIC_URL`; Sanskrit playback does not require an API endpoint or Render configuration.
8. **Not verified — deployed UI:** No live customer-browser session or hosting dashboard was inspected.

## 17. Root Cause Analysis: Sanskrit audio not appearing/playing

**Confirmed root cause for the missing Listen control:** the old visibility check required the literal `audio_status = 'uploaded'`; the admin uploader actually saves `ready`. A live published row for `BG.1.1` contains `audio_r2_path = sloka-audio/BG/1/1.wav`, `audio_status = ready`, duration `9.67` seconds and size `464204` bytes. `audio_url` and `audio_r2_key` are null on that row.

The object key was resolved using the admin-configured public R2 base and requested with a byte range. It returned HTTP 206, `Content-Type: audio/wav`, and a `RIFF/WAVE` signature; the response reported total size 464204 bytes. This establishes that the real object is published and reachable, but does not establish playback through a deployed customer browser.

The customer query now selects the canonical fields and no longer loses the admin's source/status. A valid `audio_url` is preferred; otherwise `audio_r2_path` then `audio_r2_key` is combined with `VITE_R2_PUBLIC_URL`. The reader and listing use the same playback service. Sarvam translation TTS remains a separate unchanged system.

## 18. Implemented Fixes and Remaining Deployment Checks

1. The customer `slokas` query and metadata mapper include `audio_url`, `audio_r2_key`, `audio_r2_path`, and `audio_status` with existing fields preserved.
2. The status predicate recognizes the admin's verified `ready` state and requires a usable URL/path/key.
3. The listing and reader display a compact Listen control under the Sanskrit text, use the same singleton, and stop playback on navigation/unmount.
4. Valid HTTPS audio URLs are used directly; stored R2 keys resolve against the existing configured public base without duplicate slashes.
5. Configure the frontend build environment with `VITE_R2_PUBLIC_URL` matching the Admin Panel's public R2 base.
6. Verify playback in the deployed customer browser after deployment; this workspace did not verify the live UI session.

## 19. Validation Results

- **Verified through test:** `npm test` completed with 71 tests passed and 0 failed.
- **Verified through focused test:** `tests/slokaAudio.test.ts` completed with 12 tests passed and 0 failed, covering metadata mapping, `ready` visibility, direct URL/path/key selection, URL normalization, direct playback without API fetch, pause/resume/replay, Sloka switching, stale play resolution, friendly errors, click propagation and unmount cleanup.
- **Verified through build:** `npm run build:frontend` completed the Vite production frontend build. It reported existing chunk-size and mixed static/dynamic import warnings.
- **TypeScript:** `npx tsc --noEmit` reports existing errors in `ContactView.tsx`, `MeditationView.tsx`, and `SadhanaProgressEngine.ts`; no diagnostics pointed to the modified Sanskrit audio files.
- **Verified through live request:** Real `BG.1.1` object returned HTTP 206 and a valid WAV header/signature.
- **Not verified:** Playback through the deployed customer UI, mobile playback, or deployed CORS/configuration.

## 20. Files Changed for the Audio Fix

- `src/lib/scriptureLibrary.ts` — selects the requested audio columns from the canonical `slokas` row without audio-status filtering.
- `src/lib/slokaMetadata.ts` — shared metadata mapping, including audio fields.
- `src/lib/slokaAudio.ts` — source selection, status gating, public URL construction from `VITE_R2_PUBLIC_URL`, shared player state and cleanup; no API fetch.
- `src/components/SlokaAudioControl.tsx` — compact Listen/Pause/Resume/Replay control and friendly errors.
- `src/components/ScriptureReader.tsx` — controls below Sanskrit text in listing/reader; visible-card Sanskrit preview; immediate navigation/unmount stop.
- `tests/slokaAudio.test.ts` — mapping, source selection, status, URL and lifecycle tests.
- `.env.example` — documents the customer build-time public R2 URL variable.
- `package.json` — adds the Sanskrit audio test file to the existing test command.
- `SANATANA_CUSTOMER_CODEBASE_INSPECTION.md` — updated findings and live verification evidence.

Sarvam translation TTS files were not changed.
