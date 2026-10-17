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

## Scripture translation audio

The verse reader's speaker control sends only the selected language's `languages[code].translation` to the Express API. The API verifies the user's Firebase ID token, loads published verse content through Supabase and its stored R2 JSON URL, and calls Sarvam without exposing its API key to the browser.

Add `SARVAM_API_KEY` and `FIREBASE_PROJECT_ID` to the server's local `.env.local` and production environment. `FIREBASE_PROJECT_ID` must match `VITE_FIREBASE_PROJECT_ID`. The audio cache is held in bounded server memory unless all four private Cloudflare R2 variables in [.env.example](.env.example) are configured; with R2, versioned WAV objects remain private and are streamed through the authenticated API.

Run the focused tests with `npm test`.
