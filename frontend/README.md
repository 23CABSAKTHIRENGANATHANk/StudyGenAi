<<<<<<< HEAD
## StudyGen AI — Frontend

Run and validate the frontend locally, and configure the API URL for production deploys.

Prerequisites
- Node.js 18+ and npm (npx) installed

Install and run (development)

```bash
cd frontend
npm install
# type-check (recommended)
npm run check
# dev server
npm run dev
```

Environment variables
- Create a `.env` file in `frontend/` copied from `.env.example`.
- Important: set `VITE_API_URL` to your backend URL when building for production. Leave it empty during local dev to use the Vite proxy to `http://localhost:8000`.

Example `.env` for production (Vercel / Netlify):

```
VITE_API_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=https://your-supabase-url
VITE_SUPABASE_ANON_KEY=...
```

Build & deploy

```bash
cd frontend
npm run build
```

When deploying to Vercel or Netlify, add `VITE_API_URL` to the project's environment variables so the built frontend talks to your deployed backend.

Troubleshooting
- If the dashboard shows a "Network error" after deployment, verify `VITE_API_URL` is set in the hosting environment and that CORS is configured on the backend.
- For local development, leave `VITE_API_URL` empty to allow the Vite dev server proxy to route `/api/*` to `http://localhost:8000`.

Notes
- The frontend will use the `VITE_API_URL` at build-time to construct API calls. If unset, it falls back to the dev proxy (local). Make sure to set it for production builds.
- Never commit `.env` files or secret keys to version control.
