# StudyGen AI - Troubleshooting & Complete Fix Guide

## **Quick Start (Try This First)**

### Windows
```batch
cd backend
python run-backend-complete.bat
```

Then in a NEW terminal:
```batch
npm run dev
```

### macOS/Linux
```bash
cd backend
chmod +x diagnose.py
python3 diagnose.py
```

If diagnostics pass:
```bash
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## **Common Issues & Fixes**

### ❌ Issue: "Python is not installed or not in PATH"

**Solution:**
1. Download Python 3.10+ from https://www.python.org/downloads/
2. **IMPORTANT:** During installation, check the box: ✓ "Add python.exe to PATH"
3. Restart your terminal
4. Run: `python --version`

---

### ❌ Issue: "Failed to create virtual environment"

**Solution:**
```batch
REM Delete old venv
rmdir /s venv

REM Create new one
python -m venv venv

REM Activate
venv\Scripts\activate.bat
```

---

### ❌ Issue: "Failed to install dependencies"

**Solution:**
1. Activate the virtual environment:
   ```batch
   venv\Scripts\activate.bat
   ```

2. Upgrade pip:
   ```batch
   python -m pip install --upgrade pip setuptools wheel
   ```

3. Install dependencies with output:
   ```batch
   pip install -r requirements.txt
   ```

4. If still fails, check what's missing:
   ```batch
   pip list
   ```

---

### ❌ Issue: "Failed to import modules"

**Common causes:**
- Missing `.env` file
- Missing environment variables
- Corrupted venv

**Solution:**
1. **Check .env file exists:**
   ```bash
   ls -la .env     # macOS/Linux
   dir .env        # Windows
   ```

2. **If missing, create it:**
   ```bash
   cp .env.example .env    # macOS/Linux
   copy .env.example .env  # Windows
   ```

3. **Edit .env with required values:**
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
   SUPABASE_URL=http://localhost:54321
   SUPABASE_SERVICE_KEY=<your-key>
   SUPABASE_ANON_KEY=<your-key>
   ```

4. **Recreate venv:**
   ```bash
   rm -rf venv                    # macOS/Linux
   rmdir /s venv                  # Windows
   python -m venv venv
   source venv/bin/activate       # macOS/Linux
   venv\Scripts\activate.bat      # Windows
   pip install -r requirements.txt
   ```

---

### ❌ Issue: "Database connection failed"

**Solution:**

#### Option 1: Using Supabase Local Stack (Recommended)
```bash
# Install Supabase CLI if not already
npm install -g supabase

# Start local stack in a separate terminal
supabase start

# You should see:
# Started supabase local development setup.
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
```

Then update `backend/.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

#### Option 2: Using Local PostgreSQL
1. Install PostgreSQL from https://www.postgresql.org/download/

2. Create database:
   ```sql
   CREATE DATABASE studygen_ai;
   ```

3. Update `backend/.env`:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/studygen_ai
   ```

4. Test connection:
   ```bash
   psql postgresql://username:password@localhost:5432/studygen_ai -c "SELECT 1;"
   ```

---

### ❌ Issue: "Uvicorn running but backend not responding"

**Solution:**
1. **Check if port 8000 is in use:**
   ```batch
   REM Windows
   netstat -ano | findstr :8000
   ```
   
   ```bash
   # macOS/Linux
   lsof -i :8000
   ```

2. **Kill the process:**
   ```batch
   REM Windows - replace PID with actual process ID
   taskkill /PID <PID> /F
   ```
   
   ```bash
   # macOS/Linux
   kill -9 <PID>
   ```

3. **Try again:**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

---

### ❌ Issue: "Frontend won't connect to backend"

**Checklist:**
1. ✓ Is backend running on port 8000?
   ```bash
   curl http://localhost:8000/
   # Should return JSON with status "ok"
   ```

2. ✓ Is frontend running on port 5173?
   ```bash
   # Browser should open automatically
   # Or visit: http://localhost:5173
   ```

3. ✓ Check browser console (F12 → Console)
   - Look for error messages
   - Check for CORS errors

4. ✓ Verify vite.config.ts proxy:
   ```javascript
   // Should have:
   proxy: {
     '/api': {
       target: 'http://localhost:8000',
       changeOrigin: true,
     },
   },
   ```

---

### ❌ Issue: "npm install fails"

**Solution:**
1. **Check Node.js is installed:**
   ```bash
   node --version
   npm --version
   ```
   
   If not, download from https://nodejs.org/ (use LTS version)

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

3. **Delete node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json  # macOS/Linux
   rmdir /s node_modules & del package-lock.json  # Windows
   
   npm install
   ```

---

### ❌ Issue: "Port 5173 already in use"

**Solution:**
```bash
# macOS/Linux
lsof -i :5173
kill -9 <PID>

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

Or use a different port:
```bash
npm run dev -- --port 5174
```

---

## **Step-by-Step Complete Setup**

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate.bat
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Check installation
python diagnose.py

# Start backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Database Setup (in another terminal)
```bash
# Option 1: Supabase Local Stack
npm install -g supabase
supabase start

# Option 2: Local PostgreSQL
# Just start your PostgreSQL server
```

### 3. Frontend Setup (in third terminal)
```bash
npm install
npm run dev
```

### 4. Open Browser
```
http://localhost:5173
```

---

## **Debugging**

### Check Backend Logs
Watch the backend terminal - you should see:
```
INFO:     Application startup complete
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Check Frontend Logs
Open browser console (F12):
- Console tab: Should see `[API] GET /api/dashboard/overview` with status 200
- Network tab: Click on `/api/*` requests to see details

### Check Database
```bash
# If using Supabase local stack
supabase status

# If using local PostgreSQL
psql <CONNECTION_STRING>
```

---

## **Emergency Reset**

If everything is broken, do this complete reset:

### Backend
```bash
cd backend

# Remove everything
rm -rf venv __pycache__ .pytest_cache  # macOS/Linux
rmdir /s venv __pycache__ .pytest_cache  # Windows

# Start fresh
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate.bat
pip install -r requirements.txt
python diagnose.py
```

### Frontend
```bash
# In project root
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Database
```bash
# If using Supabase
supabase stop
supabase start

# If using PostgreSQL, just restart the service
```

---

## **Getting Help**

1. **Check error messages carefully** - they usually tell you exactly what's wrong
2. **Look at logs:**
   - Backend terminal: Full error details
   - Browser console (F12): Frontend errors
   - Network tab (F12 → Network): API response details

3. **Try the complete fix script:**
   ```batch
   backend\run-backend-complete.bat
   ```

4. **Re-read this troubleshooting guide** - most issues are covered above

---

## **Verify Everything Works**

### 1. Backend Test
```bash
curl http://localhost:8000/
# Expected: {"status":"ok","service":"StudyGen AI Backend",...}
```

### 2. Frontend Test
- Open http://localhost:5173
- Should see dashboard or login page

### 3. API Connection Test
- Open browser F12
- Console tab
- Should show: `[API] GET /api/dashboard/overview` with `Response: 200`

### 4. Full Flow Test
- Log in
- Upload a document
- See it appear in "Recent Documents"
- Generate a summary

---

**Still stuck?** Check the STATUS.md and README_FIXES.md files for more details!
