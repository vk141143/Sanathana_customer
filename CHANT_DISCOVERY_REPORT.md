# Chant discovery, detail and Japa verification — 2026-10-19

## Missing-record investigation

The customer `.env.local` identifies project **`yzsfbxvygvxcbyipjzjo`**, host `yzsfbxvygvxcbyipjzjo.supabase.co`. No secrets are reproduced here.

An admin management page exists in this repository at `src/components/chant/ChantAdmin.tsx`. New chant forms default to `status: 'draft'`. Save sends `POST /api/chant/admin/chants`, and only a successful response replaces the form with the saved database row. Selecting Status **published** and saving uses that same route. `server/chantRouter.ts` writes to `public.chants` with an insert or an ID-filtered update, and sets `published_at` for publication.

For this repository's local setup, the browser client and admin route both read `VITE_SUPABASE_URL`; `server.ts` loads `.env.local`/`.env`, and `.env.local` has no `VITE_API_BASE_URL` override. Thus the bundled local admin and customer code point to the same configured project. **This is not proof that the admin panel used to create your draft is this bundled implementation.** No separate admin project path was supplied, and none was guessed. A differently deployed backend can also have different environment settings.

The live browser-key check returned HTTP 200 with **zero publicly visible published rows** in `chant_categories`, `chants`, `chant_translations`, and `chant_media`. The new category relationship and title/text search also returned HTTP 200, confirming those query shapes are accepted by the deployed schema. Private identity, session and favourite reads returned HTTP 401. Draft/archived queries returned zero visible rows; that is expected under public RLS and cannot determine whether a draft exists.

Consequently, the immediate reason no cards appear is the lack of publicly visible published rows, not a missing grid or a private-history dependency. **The specific admin-created record's persistence and status remain unverified.** You described it as a draft; drafts are intentionally excluded. Zero public rows alone cannot distinguish a draft, an unpublished parent category, missing content, a different admin project, or restrictive deployed policies.

## Publication contract

- Catalogue: `public.chants.status = 'published'`.
- Assigned category: `public.chant_categories.status = 'published'`; category-less chants are allowed.
- The repository's publication constraint requires nonempty `original_text`, `source_title` and `copyright_status`, in addition to normal title/slug/target constraints.
- Translations and media each have their own `status` and `chant_id`; they must be published independently. Neither is required for a mantra to appear.
- The public RLS policies in the existing migration enforce publication and parent visibility. No policy or migration was changed.

The bundled admin save route also requires its existing secure backend configuration. Finding an editable draft form in its component state does not prove that Save succeeded. No admin credentials or browser token were available to inspect the hidden record, and no credentials were requested or exposed.

## Implemented behavior

The existing hero and navigation remain. Discovery now includes responsive cards with database titles, categories, descriptions, original-text previews, exact-language published meaning previews, featured labels, cover artwork/fallbacks and configured targets. Broken/unsafe artwork falls back to the existing devotional symbol.

Search matches title, original text, transliteration and description using quoted PostgREST values with filter syntax removed. Category and Mantra/Nama Japa/Stotram filters work independently. Category navigation includes only published categories with visible published chants. The primary chant query has no translation/media join; optional child content cannot remove or duplicate mantra cards. Preview translations are fetched in one batch for the current page and exact selected language. Preview failures are reported without hiding the mantras.

Selecting a card loads that ID's current published record, published translations and media. It shows the category, original text, transliteration/guidance, optional meaning/explanation/life context and source, available targets and language-specific audio. Missing languages are unavailable rather than silently substituted. Back preserves search, category and type state.

Begin chanting sends the selected database ID, selected language and configured target to the existing authenticated session API. The existing count/undo/pause/resume/completion implementation is retained. The practice screen now also shows the selected translation. Ownership still resolves a verified Firebase UID to `chant_identities.id`; no private table reads or writes were moved to the browser.

Public catalogue loading remains independent of `/api/chant/me`. Empty, failed and successful catalogue states are distinct. The genuine empty state explains publication and offers Refresh; filtered empty results offer Clear filters. Safe diagnostics report operation/error codes and publication/project/RLS checks without credentials, customer IDs or raw query contents.

## Changed files in this pass

| File | Purpose |
| --- | --- |
| `src/lib/chant.ts` | Nullable content types, mantra type, translation association; re-export supported languages. |
| `src/lib/chantLanguages.ts` | Shared language labels without initializing Firebase for presentation components. |
| `src/lib/chantCatalog.ts` | Text/type/category filtering, populated-category query, exact-language preview batch and safe diagnostics. |
| `src/components/chant/useChantLibrary.ts` | Include type/language in debounced catalogue loading. |
| `src/components/chant/ChantExperience.tsx` | Stable production adapters for the same Supabase/authenticated API services. |
| `src/components/chant/ChantExperienceContent.tsx` | Existing experience extracted into a directly testable view; list/filter/detail/Japa enhancements. |
| `src/components/chant/ChantCard.tsx` | Selectable database-backed discovery card. |
| `src/components/chant/ChantArtwork.tsx` | Safe image loading and broken-image fallback. |
| `src/components/chant/ChantTranslationContent.tsx` | Published selected-language content shared by details and practice. |
| `src/components/chant/chant.css` | Responsive filters, card previews, badges and empty/preview notices. |
| `scripts/check-chant-public.mjs` | Report public project host; verify deployed category relation and text-search query. |
| `tests/chantFlow.test.ts` | Query/filter/language/optional-content coverage with stateful fixtures. |
| `tests/chantReact.test.tsx` | Mounted production-view selection, language/audio switching, filter preservation, target/session binding, missing artwork and failure states. |
| `CHANT_DISCOVERY_REPORT.md` | This report. |

Environment files, database rows, RLS policies and migrations were not changed. Existing unrelated workspace edits were preserved.

## Checks and limits

- `npm test`: **59 passed, zero failed**. Includes mounted React view tests, stateful query fixtures and PGlite ownership/RLS tests. These are not live saved-session or live admin-record tests.
- TypeScript (`npm run lint`): the six existing errors remain in ContactView (`focusRingColor`), MeditationView (`geeta`) and SadhanaProgressEngine (four incomplete return/default shapes).
- `npm run build`: passed for frontend and backend, with the existing large-bundle and mixed static/dynamic-import warnings.
- Live read-only Supabase checks: public queries and the new relationship/search queries succeed, but no published content is visible; private reads are denied. An admin-created record was not observed, so full live acceptance cannot yet be claimed.

## Exact next verification step

In the admin panel where the draft was created, reopen the saved record and check its database ID and Status. Confirm that panel targets project **`yzsfbxvygvxcbyipjzjo`**. If it is a separate admin app, provide its repository path or public project reference so the configuration can be compared; do not share keys or tokens.

A trusted operator can run this **read-only** SQL in that project's SQL editor to verify persistence and parent status:

```sql
select ch.id, ch.title, ch.status, ch.category_id,
       c.name as category_name, c.status as category_status,
       ch.original_text is not null and length(trim(ch.original_text)) > 0 as has_original_text,
       ch.source_title is not null and length(trim(ch.source_title)) > 0 as has_source,
       ch.copyright_status is not null and length(trim(ch.copyright_status)) > 0 as has_copyright_status
from public.chants ch
left join public.chant_categories c on c.id = ch.category_id
order by ch.created_at desc
limit 20;
```

If it is saved as a draft and ready for customers, publish its category and then the chant through the existing admin Status/Save workflow. This work did not publish it automatically. Publish optional translations/media separately. If both are already published in the same project, inspect the deployed SELECT policies next; do not loosen draft/private access.

After the record is publicly visible, refresh Chant: the actual card should appear, open its details and select a configured target. Saved Japa still needs the existing secure account service. No SQL deployment is required by these UI changes; deploy/rebuild the updated frontend in the normal way.
