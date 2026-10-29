<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/40ba6d4a-85f2-4fbf-a25f-cc723db58495

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Chant backend configuration

Published Chant browsing requires only the existing browser settings `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Categories, mantras, translations and media are read directly from Supabase under published-only RLS policies. Opening the library or signing in does not call `/api/chant/me`. That endpoint serves private history, recovery, favourites and statistics; it is loaded only when requested. Select **Load saved practice & progress**, History or Favourites to use it. Public catalogue errors and private account errors have independent retry controls.

The private configuration below is needed only for saved sessions, favourites and private statistics. It is not a prerequisite for displaying published content. Run `node scripts/check-chant-public.mjs` for a read-only check with the browser credentials. HTTP 200 with zero visible rows does not prove that admin-published content exists or that deployed policies match the migration; check publication, category publication, the admin project's URL and deployed policies if the library is empty.

`503 CHANT_NOT_CONFIGURED` means the backend cannot create its private Supabase client. It is separate from invalid pagination: `/api/chant/me?page=0` is valid. If `.env.local` already contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, also set `SUPABASE_SERVICE_ROLE_KEY` to the same project's private service-role key (or server secret key). The public anon/publishable key cannot access Chant identities, sessions, or favourites. Never prefix the private key with `VITE_`, commit it, or paste it into chat.

Restart `npm run dev` after updating `.env.local`; changing environment files does not reliably restart the server watcher. On Render, set the same private variable in the backend environment; the Blueprint now prompts for it. Firebase verification also requires `FIREBASE_PROJECT_ID` or the existing `VITE_FIREBASE_PROJECT_ID`.

After configuring private features, sign in, open Chant and select **Load saved practice & progress**. Check the authenticated `/api/chant/me?page=0` response in browser Network tools. Expect 200 with `sessions`, `resumable`, `favourites`, `stats`, `totals`, and `adminRole`; a new customer has empty history. Browse a published chant, count manually, pause/resume, and reload to verify persistence. A subsequent `CHANT_SCHEMA_UNAVAILABLE` requires checking the server's logged operation against the two migrations in `supabase/migrations`; do not blindly apply them over existing tables. No live migration is applied by starting the app.

## Scripture translation audio

The verse reader's speaker control sends only the selected language's `languages[code].translation` to the Express API. The API verifies the user's Firebase ID token, loads published verse content through Supabase and its stored R2 JSON URL, and calls Sarvam without exposing its API key to the browser.

Add `SARVAM_API_KEY` and `FIREBASE_PROJECT_ID` to the server's local `.env.local` and production environment. `FIREBASE_PROJECT_ID` must match `VITE_FIREBASE_PROJECT_ID`. The audio cache is held in bounded server memory unless all four private Cloudflare R2 variables in [.env.example](.env.example) are configured; with R2, versioned WAV objects remain private and are streamed through the authenticated API.

Run the focused tests with `npm test`.

## Deploy the Express API and Netlify frontend

Netlify hosts the static frontend; it does not run `server.ts`. There is no existing backend deployment URL in this repository. `render.yaml` prepares the existing Express app for Render deployment without moving the TTS route or changing its Firebase authentication.

1. Push the repository to GitHub and create a Render Blueprint from it. Render reads [render.yaml](./render.yaml), builds with `npm ci && npm run build`, starts with `npm start`, and provides its assigned `PORT`.
2. Set the prompted Render secrets/configuration: `FIREBASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SARVAM_API_KEY`. `HARVED_ALLOWED_ORIGINS` is set to `https://harved.netlify.app` by the Blueprint. To persist audio across restarts, also configure all four `CLOUDFLARE_R2_*` variables from [.env.example](./.env.example); otherwise the existing bounded in-memory cache is used.
3. After Render deploys, copy its assigned public service origin (scheme and hostname only, without a path or trailing slash). In Netlify site settings, add `VITE_API_BASE_URL` with that origin, then trigger a new frontend deploy. The Netlify build uses `npm run build:frontend` and publishes only `dist`; it does not publish or run the Express server bundle.
4. For a different Netlify production domain, update `HARVED_ALLOWED_ORIGINS` on Render to the exact comma-separated origins that should be allowed, then redeploy. Local Express development defaults to localhost and 127.0.0.1 origins on ports 3000 and 5173.

The API remains `POST /api/tts/translation-audio`; the frontend appends that path to `VITE_API_BASE_URL`. When the variable is unset locally, the request remains same-origin at the Express/Vite dev server. Send a Firebase ID token as `Authorization: Bearer <ID_TOKEN>` and a JSON body such as `{"slokaId":"<published-sloka-id>","language":"te"}`. A missing/invalid token returns 401; unsupported language returns 400; an unpublished or unknown sloka returns 404; a missing translation returns 422; Sarvam/backend generation failures return 502. Browser CORS errors indicate an origin mismatch or preflight rejection, while an upstream Sarvam failure occurs only after the authenticated API route has been reached.

Never configure `SARVAM_API_KEY` in Netlify or under a `VITE_` name. Configure it only as a Render backend secret. The Netlify `VITE_API_BASE_URL` value is the backend's public origin, not a secret.
