# Emotions & Healing: album restoration and five-stage reader

## Inspected

- Git history (`d936f8b`) and original/current `src/components/ExploreView.tsx`.
- `BottomNav.tsx`, the Explore routing in `App.tsx`, and `Header.tsx`.
- `EmotionDetailView.tsx` and its `SupabaseEmotion` interface; current `healing/EmotionHealingPage.tsx`, step definitions and existing reader CSS.
- `supabase_emotions.sql`, `src/types.ts`, and the existing Supabase query in ExploreView.
- Existing design tokens and typography in `src/index.css`.
- Sloka reader/animation implementation and regression tests inspected during the preceding task; they were not changed in this revision.

## Restored and modified

- `src/components/ExploreView.tsx`: restored the original two-column album grid from commit `d936f8b`, including 144px card height, 24px rounding, spacing, image source fallback, overlays, gold borders, typography and interactions. Cards are keyboard-accessible buttons. Existing loading/error/retry handling remains.
- `src/components/healing/EmotionHealingPage.tsx`: replaced the animated manuscript with a simple header, top left/right arrows and vertically scrolling text. Removed rollout, images, progress bar, numbered stage display and completion overlay from the active reader. The five bottom-navigation positions remain visible and usable.
- `src/components/healing/readingStages.ts`: new frontend adapter with stable topic/stage identity and distinct emotion/healing heading variants.
- `tests/healingReader.test.tsx`: updated coverage for field preservation, section boundaries, forward/back navigation, topic reset, empty states, healing headings, album styling and Lotus position/destination.
- Removed the unused `src/components/healing/healingReader.css` introduced by the preceding redesign.
- Updated this report.

No changes in this revision to ScriptureReader, SacredScroll, its animation CSS, Audio Albums/player, Sadhana, bottom navigation, admin or database migrations. Other workspace edits remain intact.

## Content mapping and limitations

| Stage | Published source fields |
| --- | --- |
| Understanding the topic | `tagline` |
| Bhagavad Gita / Spiritual Wisdom | Sanskrit, reference, transliteration, translation |
| Meaning and Deeper Understanding | `what_it_means`, `example_text` |
| Why We Experience It / Applying It in Everyday Life | Empty state: no corresponding field exists |
| Management / Growth practices | `how_to_overcome` and all mantra text fields |

The original `emotions` query, `is_active` filter, `sort_order`, IDs and source text are preserved. There is no separate Healing library/category discriminator or language selector in this checkout. The reader supports explicit `topicKind="healing"` for a caller with that classification; current database records retain their existing emotion classification. No topic classification is guessed from names.

Stage 1 is limited to the existing published introduction/tagline. Stage 4 is empty for current records because the schema has no causes/application content. These gaps require authored content and an agreed publishing model; this UI change does not invent material, repurpose unrelated fields, or modify the schema. Existing translations display as stored. Live database data was not queried during validation.

## Validation

- `npm test`: 116 tests passed, including the updated reader tests and existing Sloka/audio regressions.
- `npm run build`: passed; existing Vite mixed-import and large-bundle warnings remain.
- Chromium at 320, 375, 390 and 430px: passed album grid/card-height checks; Lotus-to-list navigation; opening topics; all five sections; arrow boundaries; topic reset; back; long-text scrolling and no horizontal overflow; no reader images or animations; empty states; bottom navigation; healing heading variant. Tests used isolated source fixtures and the real components with a mocked Supabase response. Screenshot inspected at 390px.
- TypeScript: five unrelated errors remain in `ContactView.tsx:167` and `SadhanaProgressEngine.ts:131,226,316,414`; no errors in this change.
