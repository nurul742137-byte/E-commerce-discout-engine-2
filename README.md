<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1f2027d2-4f06-4871-8975-dd0cb209c9c1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Render deployment

Keep the project folder structure exactly as included in this archive. In particular,
`App.tsx` must remain at `src/App.tsx`, and the component, data, types, and utils
folders must remain inside `src/`. Do not move these files to the repository root.

Render settings:
- Root Directory: leave blank when `package.json` is in the repository root
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`

The build script runs TypeScript checking before creating the Vite production build.
