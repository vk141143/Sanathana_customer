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

The verse reader's speaker control sends the selected language and Sloka ID to the Netlify Function at `POST /api/tts/translation-audio`. The function verifies the Firebase ID token, selects the published Sloka from Supabase using its anon key and existing RLS policies, fetches the published JSON, and calls Sarvam. The private Sarvam key is read only by the function. The existing Express route uses the same request handler and dependency setup for local development.

Netlify rewrites `/api/tts/translation-audio` to `/.netlify/functions/translation-audio`; the frontend continues using the clean route. The function is built from `netlify/functions` using Netlify's Node 22 runtime and esbuild bundler. Successful responses contain WAV audio; failures return JSON with an `error` message.

In Netlify environment settings, make the following variables available to **Functions**:

- `SARVAM_API_KEY` — private Sarvam credential.
- `FIREBASE_PROJECT_ID` — must match the Firebase project used by the customer sign-in client.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — public Supabase client settings used to query published Slokas under RLS.

Keep the existing `VITE_SUPABASE_*` and `VITE_FIREBASE_*` client variables available to the Netlify build as well; the TTS function needs the Supabase URL and anon key in its Functions runtime.

Do not configure `SUPABASE_SERVICE_ROLE_KEY` for this function. Do not expose `SARVAM_API_KEY` or Cloudflare credentials with a `VITE_` prefix. `HARVED_ALLOWED_ORIGINS` is optional; the default allowlist includes `https://harved.netlify.app` and local development origins. Add any custom production or preview origin explicitly if it needs cross-origin access.

Audio caching works without R2 using bounded, per-function-instance memory. To persist cache objects across instances and deploys, optionally configure all four private `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, and `CLOUDFLARE_R2_BUCKET_NAME` variables for Functions. Partial R2 configuration is reported as a configuration error. Netlify responses are buffered, so the function caps WAV output at 4 MiB to stay below the platform response-size limit after base64 encoding. Warm instances coalesce concurrent requests and retain the existing 20-per-minute rate limit; cold starts and parallel instances do not share in-flight locks, caches, or rate-limit counts, so duplicate R2 writes and additional requests across instances remain possible.

Deploy the site from Netlify after setting Function environment variables. No separate Express service, Supabase Edge Function deployment, or database migration is needed. Local development continues to use the Express route via `npm run dev`. The separate Sanskrit Sloka Listen control remains direct playback from its public `audio_url` or `VITE_R2_PUBLIC_URL`; it does not call TTS.

Run `npm test` for the TTS and application test suites.

The function keeps the existing request contract: Firebase bearer token and JSON `{"slokaId":"<published-sloka-id>","language":"te"}`. Missing/invalid tokens return 401; invalid requests return 400; unknown/unpublished Slokas return 404; missing translations return 422; configuration failures return 503; Sarvam failures return 502.