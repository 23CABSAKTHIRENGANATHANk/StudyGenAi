@echo off
setlocal enabledelayedexpansion

REM Start Frontend - StudyGen AI
REM This script starts the Vite development server on http://localhost:5173

title StudyGen AI Frontend - Vite
color 0B

echo.
echo ==========================================
echo Starting StudyGen AI Frontend
echo ==========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/2] Installing Dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install npm dependencies
        echo Make sure Node.js is installed from https://nodejs.org/
        pause
        exit /b 1
    )
)

echo [2/2] Starting Development Server...
echo.
echo ==========================================
echo Frontend Starting...
echo ==========================================
echo.
echo URL: http://localhost:5173
echo Backend: http://localhost:8000
echo.
echo Press Ctrl+C to stop
echo.

REM Start the frontend
call npm run dev

pause
