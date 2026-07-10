<<<<<<< HEAD
# StudyGen AI

StudyGen AI is a professional SaaS-style learning assistant that lets students upload files, generate AI-powered summaries, notes, quizzes, flashcards, and chat with their documents.

## Technology Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Python FastAPI
- Database: Supabase PostgreSQL + pgvector
- Auth / Storage: Supabase Auth + Supabase Storage
- AI Model: Google Gemini API (placeholder integration)
- Deployment: Vercel (frontend) and Render (backend)

## Folder Structure
- `frontend/` — React app, Tailwind styling, Supabase auth and UI pages
- `backend/` — FastAPI backend, REST routes, database models, AI service stubs
- `database/` — SQL schema and RLS policy scripts
- `docs/` — architecture and deployment documentation

## Setup
### 1. Create Supabase project
1. Create a Supabase project
2. Enable Auth, Storage, PostgreSQL, and pgvector extension
3. Create a service key for backend usage
4. Configure buckets for user documents and thumbnails

### 2. Environment variables
Create `.env` in both `frontend/` and `backend/` from `.env.example` values.

Frontend `.env` variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`

Backend `.env` variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` or `SUPABASE_SECRET_KEY`
- `SUPABASE_ANON_KEY` or `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_JWKS_URL`
- `DATABASE_URL`
- `GOOGLE_GEMINI_API_KEY`

### 3. Install dependencies
```bash
cd "StudyGen AI/frontend"
npm install

cd "StudyGen AI/backend"
pip install -r requirements.txt
```

### 4. Run the apps
```bash
cd "StudyGen AI/frontend"
npm run dev

cd "StudyGen AI/backend"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Type-check frontend before running (recommended):

```bash
cd "StudyGen AI/frontend"
npm install
npm run check
```

## Database
Apply schema from `database/schema.sql` and policy rules from `database/rls.sql`.

### Supabase migration steps
1. In your Supabase SQL editor or psql, run:

```sql
-- enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;
-- apply schema
\i database/schema.sql
-- apply policies
\i database/rls.sql
```

2. Add pgvector index tuning if necessary:

```sql
-- example (768-dim for text-embedding-004)
CREATE INDEX IF NOT EXISTS ivfflat_embeddings_vector ON embeddings USING ivfflat (vector) WITH (lists = 128);
```

3. In Supabase dashboard > Auth > Settings, configure email provider and redirect URLs to `http://localhost:5173`.

4. Create a Storage bucket named `documents` and set appropriate policies (private by default).

5. Save your `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `SUPABASE_ANON_KEY` into `.env` files in frontend and backend.

### Security
- Never commit `.env` files or secret keys to version control. Add them to your local environment or CI secrets instead.
- If a key or token is exposed, rotate it immediately in the Supabase dashboard.

### Quick CLI link (non-interactive)
Use this to link the workspace to your Supabase project when running non-interactively (CI or remote shells). Replace the token with your valid access token.

```bash
# set the access token (UNIX)
export SUPABASE_ACCESS_TOKEN=<your-supabase-access-token>
npx supabase link --project-ref klazmuphduevyjequmql --yes

# Windows (PowerShell)
setx SUPABASE_ACCESS_TOKEN "<your-supabase-access-token>"
npx supabase link --project-ref klazmuphduevyjequmql --yes
```

## Recommended next steps

- Push database schema and RLS policies to the remote project:

```bash
npx supabase db push --project-ref klazmuphduevyjequmql
```

- Create the `documents` storage bucket used by the app:

```bash
npx supabase storage create-bucket documents --project-ref klazmuphduevyjequmql --public=false
```

- Rotate any tokens that may have been exposed via `.env` files in the repo and update your local environment with new tokens.

## Deployment
- Frontend: deploy `frontend` to Vercel
- Backend: deploy `backend` to Render or another Python host

## Notes
This scaffold includes production-ready structure, authentication flows, AI feature placeholders, file upload flow, and dashboard UI patterns. Customize the Gemini integration and Supabase policies to match your project requirements.
=======
# StudyGen AI — Frontend

Run and validate the frontend locally.

Prerequisites
- Node.js 18+ and npm (npx) installed

Install and run

```bash
cd frontend
npm install
# type-check
npm run check
# dev server
npm run dev
```

Troubleshooting
- If TypeScript reports `Cannot find module '../ui/SignupForm'`, run `npm run check` to get exact diagnostics. The project uses a `src/ui/index.ts` barrel to centralize UI exports.
- If the editor still shows errors, restart the TypeScript server (VS Code: Command Palette → "TypeScript: Restart TS Server").

Build

```bash
npm run build
```

Notes
- The project expects the backend to be running at `http://localhost:8000` for API calls.
- If uploads fail with "Bucket not found", the backend will attempt to create the bucket automatically when using the service key.
