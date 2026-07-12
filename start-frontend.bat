@echo off
REM Start Frontend - StudyGen AI
REM This script starts the Vite development server on http://localhost:5173

echo ==========================================
echo Starting StudyGen AI Frontend
echo ==========================================
echo.
echo Frontend will run on: http://localhost:5173
echo Press Ctrl+C to stop
echo.

REM Install dependencies if needed
npm install

REM Start the development server
npm run dev

pause
