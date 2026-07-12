# Local Development Setup - StudyGen AI

This guide will help you get the StudyGen AI project running locally for development.

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Docker (optional, for Supabase local stack)
- PostgreSQL (if not using Supabase local stack)

## Quick Start

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Start the development server (runs on http://localhost:5173)
npm run dev
```

The frontend is configured with a proxy that routes `/api/*` requests to the backend at `http://localhost:8000`.

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend (runs on http://localhost:8000)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Database Setup

#### Option A: Using Supabase Local Stack (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Start the local Supabase stack
supabase start

# This will:
# - Start PostgreSQL on localhost:54322
# - Start the API on localhost:54321
# - Create a local database
```

The `.env` file is already configured with these defaults.

#### Option B: Using Local PostgreSQL

If you have PostgreSQL running locally:

1. Create a database:
```sql
CREATE DATABASE studygen_ai;
```

2. Update `backend/.env`:
```
DATABASE_URL=postgresql://username:password@localhost:5432/studygen_ai
```

3. Push the schema:
```bash
cd backend
python -c "
from app.db import get_connection
with get_connection() as conn:
    with open('../database/schema.sql') as f:
        conn.execute(f.read())
    conn.commit()
"
```

## Configuration

### Frontend Environment Variables

File: `.env.development`

```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=
```

- `VITE_API_URL` is left empty to use the vite proxy (routes to `http://localhost:8000`)

### Backend Environment Variables

File: `backend/.env`

```
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Troubleshooting

### "Network error loading dashboard"

**Issue:** The dashboard shows a network error when loading.

**Checklist:**
1. ✓ Is the backend running on `http://localhost:8000`?
   ```bash
   curl http://localhost:8000/
   ```
   Should return: `{"status":"ok","service":"StudyGen AI Backend","version":"0.1.0"}`

2. ✓ Is the database configured and accessible?
   ```bash
   # Check the backend logs for database connection errors
   ```

3. ✓ Is authentication working?
   - Make sure you're logged in
   - Check browser console (F12) for auth errors
   - Verify the access token is in localStorage

4. ✓ CORS issues?
   - The backend has CORS configured for `http://localhost:5173`
   - If using a different port, update `backend/.env` APP_ORIGIN

### "Failed to load dashboard data"

**Solution:**
1. Check the browser console (F12) for specific error details
2. Check the backend logs for the actual error
3. Click "Retry" button in the error message
4. Try logging out and in again

### Backend won't start

**Solution:**
1. Check Python version: `python --version` (should be 3.10+)
2. Check if port 8000 is available: `netstat -an | find ":8000"`
3. Check for database connection errors in the startup logs
4. Ensure `backend/.env` exists with correct `DATABASE_URL`

### Supabase local stack won't start

**Solution:**
```bash
# Stop any existing instances
supabase stop

# Start fresh
supabase start

# Check status
supabase status
```

## Development Workflow

1. **Frontend changes:** Hot reload enabled, just save and refresh
2. **Backend changes:** Uvicorn watches for changes with `--reload`
3. **Database schema changes:** Push changes using migration files in `database/migrations/`

## Testing

```bash
# Frontend tests
npm run test

# Backend tests
cd backend
pytest

# E2E tests (requires both frontend and backend running)
npm run test:e2e
```

## Production Build

```bash
# Build frontend
npm run build

# Output in dist/
```

## Deployment

See `docs/DEPLOYMENT_PLAN.md` for production deployment instructions.

---

**Need help?** Check browser console (F12) and backend logs for detailed error messages.
