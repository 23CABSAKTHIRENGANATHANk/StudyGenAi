# StudyGen AI Deployment Plan

This document outlines a production-ready deployment approach for the StudyGen AI project using:
- Frontend: Vercel
- Backend: Render
- Database/Auth/Storage: Supabase
- CI: GitHub Actions

## 1. Deployment architecture

### Components
- Frontend app: React + Vite + Tailwind
- Backend API: FastAPI
- Database: Supabase PostgreSQL + pgvector
- Auth: Supabase Auth
- File storage: Supabase Storage bucket `documents`
- Monitoring: Sentry + structured logging

### Recommended hosting
- Deploy the frontend from the `frontend/` folder to Vercel
- Deploy the backend from the `backend/` folder to Render
- Keep Supabase as the shared data, auth, and storage layer

---

## 2. Prerequisites

Before deployment, prepare the following accounts and resources:

1. GitHub repository with the project code
2. Vercel account and project
3. Render account and web service
4. Supabase project with:
   - PostgreSQL enabled
   - Auth enabled
   - Storage enabled
   - pgvector extension enabled
5. Google Gemini API key
6. Optional: Sentry DSN for error monitoring

---

## 3. Environment configuration

### Frontend environment variables (Vercel)
Set these in the Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_API_URL` = your deployed backend URL

### Backend environment variables (Render)
Set these in the Render service environment tab:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` or `SUPABASE_SECRET_KEY`
- `SUPABASE_ANON_KEY` or `SUPABASE_PUBLISHABLE_KEY`
- `DATABASE_URL`
- `GOOGLE_GEMINI_API_KEY`
- `APP_ORIGIN` = your frontend production URL
- `MAKE_STORAGE_PUBLIC` = `false`
- `SIGNED_URL_EXPIRY` = `3600`
- Optional: `SENTRY_DSN`

> Do not commit `.env` files. Use platform secrets instead.

---

## 4. Infrastructure setup

### Supabase setup
1. Create or select a Supabase project.
2. Enable Authentication, Storage, and PostgreSQL.
3. Enable the `vector` extension.
4. Apply the database schema from `database/schema.sql`.
5. Apply RLS policies from `database/rls.sql`.
6. Create a private storage bucket named `documents`.
7. Configure auth redirect URLs for the production frontend domain.

### Render backend setup
1. Create a new Render web service.
2. Connect the repository.
3. Set the root directory to `backend/`.
4. Use the existing `render.yaml` as the deployment reference.
5. Build command:
   ```bash
   pip install -r requirements.txt
   ```
6. Start command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Vercel frontend setup
1. Create a Vercel project for the repo.
2. Set the root directory to `frontend/`.
3. Use the existing `vercel.json` rewrite rules as the base configuration.
4. Set the build command to:
   ```bash
   npm run build
   ```
5. Set the output directory to `dist/`.

---

## 5. CI/CD workflow

The repository already includes GitHub Actions for validation.

### Current CI expectations
- On push or pull request to `main` or `master`, the workflow should:
  - install frontend dependencies
  - run frontend type-checking
  - run backend tests
  - build the frontend
  - run Playwright smoke tests

### GitHub secrets required
Add these repository secrets in GitHub:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `GOOGLE_GEMINI_API_KEY`
- Optional: `SENTRY_DSN`

---

## 6. Deployment sequence

Deploy in this order:

1. Deploy Supabase schema and storage bucket
2. Deploy the backend to Render
3. Confirm backend health and API routes
4. Deploy the frontend to Vercel
5. Verify login, document upload, and AI flows end-to-end

### Recommended validation checklist
- Backend health route responds successfully
- Frontend loads without console errors
- Auth login/signup works
- Document upload completes
- AI endpoints respond successfully
- Storage bucket is reachable for signed URLs

---

## 7. Production hardening

Before going live:
- Enable HTTPS-only redirect in the frontend host
- Restrict Supabase service role usage to backend-only code paths
- Review RLS policies for user isolation
- Add domain allowlists for `APP_ORIGIN`
- Rotate any secrets that may have been exposed previously
- Set up error alerts through Sentry or similar monitoring

---

## 8. Rollback plan

If deployment fails:
1. Revert the latest merge or commit
2. Redeploy the previous working backend build
3. Restore the prior frontend build in Vercel
4. Re-run smoke checks before re-enabling traffic

---

## 9. Recommended next actions

1. Replace the placeholder URLs in the deployment config with the real production URLs
2. Add the required GitHub and platform secrets
3. Push the latest changes and trigger CI
4. Deploy backend first, then frontend
5. Run end-to-end validation and monitor logs for the first 24 hours
