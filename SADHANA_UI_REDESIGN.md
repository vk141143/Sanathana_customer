# Sadhana UI redesign delivery

## Scope and navigation

The existing bottom-navigation Sadhana button still opens `App.tsx` → `SadhanaTracker` (`sadhana` tab, now also addressable as `#sadhana`). The existing global bottom navigation remains the only bottom bar. Its centre Explore button was incorrectly labelled Sadhana; its label now matches its existing destination.

The tracker now presents the database catalogue directly, with the existing Meditation and Scripture Reader flows. Practice selection and My Progress participate in browser history. Firebase authentication, Supabase queries, RLS, database schemas, session API actions, favourites, scripture bookmarks and reading preferences were not changed by this redesign.

## Visual implementation

- Mobile temple hero, antique-gold typography, dark translucent panels, atmospheric light reveal and restrained parallax.
- Accessible animated daily completion ring, XP/level card, five practice-streak slots and stacked database-driven practice cards.
- Japa mala with progressive bead illumination, breathing Om motif and the existing count handlers. Catalogue mantra selection uses published practice records; configured targets and completion rules remain intact. The saved Chant flow retains its target controls, pause/resume, undo, history and persistence.
- My Progress with weekly/monthly/yearly selectors, accessible chart and daily-record table, and paginated existing Meditation/Japa history.
- All ten existing spiritual levels, from Temple Entrance to Eternal Seeker, and existing streak-achievement definitions.
- Gratitude parchment editor, 2,000-character validation, sticky save action, error recovery, confirmation and existing saved-entry history. Escape, keyboard focus containment and focus restoration are supported.
- Safe-area padding, pinch zoom, 44px action targets and reduced-motion handling.

Animations use the installed Motion package and scoped CSS. Number animations stop on cleanup; data, focus, visibility and navigation listeners unsubscribe; existing timers remain cleaned up. Decorative mala rendering never increments or persists a counter. Returning from a catalogue practice suppresses the hero entrance replay.

## Preserved storage and known limitations

The user explicitly chose **“Preserve storage; complete UI”** after the inspection found missing backend integrations. No migrations or new persistence layer were added.

- Main-ring completion uses the existing engine's weighted calculation against the saved progress snapshot. The 35/35/20/10 weights, 60% threshold, XP multipliers and ten-level requirements are unchanged. Old daily flags are cleared for presentation when the engine's logical day changes; this does not write to the database.
- The existing Firebase-authenticated Meditation history API exposes the Sadhana snapshot. The older standalone engine SQL instead uses Supabase-auth UUIDs. This underlying identity mismatch is not migrated here.
- Catalogue Japa/Mantra sessions were already visit-only. Their visit summaries are labelled accordingly. The separate legacy Chant session API retains its server persistence, and is reachable through “Open Japa library & saved sessions”. Catalogue IDs are never sent as legacy Chant IDs.
- Gratitude continues using `App.tsx`'s existing device-backed journal, as approved. It is explicitly labelled as device storage. Its save flow does not claim server sync or XP awards.
- The existing APIs do not provide linked Mantra, Reading or Gratitude history, an XP ledger, or an achievement-reward ledger. Unavailable statistics appear as dashes, rather than sample values. No reward amounts are invented.
- The progress chart shows the weighted contribution of saved Meditation and Japa sessions only. Completed-day counts therefore represent days confirmed by that available history, not an invented complete history. Yearly bars aggregate daily values into twelve equal date intervals. Period XP and comparisons remain unavailable.
- Exact streaks are only displayed when supported by the available records; truncated histories are not presented as exact streaks.
- No reference image accompanied the attachment. The written visual brief and existing Sanatana assets guided the redesign.

## Assets

Created `public/assets/sadhana/temple.webp` (73,520 bytes) from existing `public/sadhan.png` and `milestones.webp` (39,474 bytes) from existing `public/achieve.png`. These are resized, format-optimized derivatives; originals remain untouched. Practice artwork reuses `public/assets/inner-flame/*`; the lotus reuses `public/lotus.png`. No external stock imagery or new dependencies were added.

## Files created

- `src/components/sadhana/SadhanaVisuals.tsx`
- `src/components/sadhana/SadhanaPracticeCard.tsx`
- `src/components/sadhana/JapaMalaVisualization.tsx`
- `src/components/sadhana/useSadhanaOverview.ts`
- `src/components/sadhana/overview.ts`
- `src/components/sadhana/sadhana.css`
- `public/assets/sadhana/temple.webp`
- `public/assets/sadhana/milestones.webp`
- `tests/sadhanaRedesign.test.tsx`
- `SADHANA_UI_REDESIGN.md`

## Files modified by this work

- `src/App.tsx`: browser navigation and existing journal history props.
- `src/components/BottomNav.tsx`: selected-state accessibility and Explore label.
- `src/components/SadhanaTracker.tsx`: redesigned existing tracker.
- `src/components/SadhanaPracticesView.tsx`: integrated catalogue cards and practice presentation, preserving pre-existing Meditation changes.
- `src/components/JourneyView.tsx`: removes sample statistics and shows existing records.
- `src/components/AchievementsView.tsx`: replaces Coming Soon with configured levels/milestones.
- `src/components/GratitudeModal.tsx`: parchment journal and existing entry history.
- `src/components/chant/ChantCounter.tsx`, `ChantExperienceContent.tsx`, `chant.css`: visual mala and theme; original action handlers retained.
- `index.html`: safe-area viewport and zoom accessibility.
- `package.json`: appends the new regression test to the existing test command.

Pre-existing changes in `server.ts`, `MeditationView.tsx`, `practiceCatalog.ts`, the Meditation router/service/test files, and the existing package test entry were preserved.

## Verification

- Existing baseline suite: **109 passed** after Windows sandbox escalation.
- Full suite including new tests: **113 passed**. New tests cover stale daily snapshots, duplicate/gapped streak dates, bounded decorative mala illumination, blank journal validation and retaining text after a failed save.
- Production frontend + server build: **passed**. Vite reports existing mixed dynamic/static imports and a large main bundle; these are warnings.
- TypeScript (`npm run lint`): five pre-existing errors remain, with no redesign errors. One invalid `focusRingColor` style in `ContactView.tsx`; four missing required result/default fields in `SadhanaProgressEngine.ts`. They were recorded before editing. Progress-engine behavior was not changed to silence them.
- Production browser smoke check: Sadhana selected state, Progress → browser Back → Sadhana, ten achievement levels, reduced-motion media preference and no runtime exceptions.
- No horizontal overflow at **320, 390 and 768px**; visual inspection at **390 × 844px**. This used an isolated local preview profile, not a live authenticated account.
- Local private API verification is blocked by the existing missing `SUPABASE_SERVICE_ROLE_KEY`. Catalogue/session completion, cross-device persistence and real-account XP changes still require authenticated verification. Existing API/RLS/counter regression tests pass.

## Manual checks before release

Configure the existing backend's server-only Supabase service-role key and Firebase Admin credentials, then sign in with a test account. Confirm published catalogue entries, finish and return from Meditation, exercise persisted Chant taps/undo/pause/resume/history, and verify the saved progress snapshot. Check Gratitude save/history on the same device, Scripture Reading and bookmarks, and the journal save action with an actual iOS/Android keyboard open. The storage gaps above require a separately authorized backend task; no schema changes are required to use this UI.
