@echo off
REM ============================================================================
REM StudyGen AI - Complete Clean Reset & Restart
REM ============================================================================
REM
REM This script will:
REM   1. Stop all running processes
REM   2. Delete all cache, venv, node_modules
REM   3. Reinstall everything from scratch
REM   4. Start the backend fresh
REM
REM Use this if everything is broken
REM ============================================================================

setlocal enabledelayedexpansion
title StudyGen AI - Complete Reset

color 0C
cls

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  StudyGen AI - COMPLETE CLEAN RESET                           ║
echo ║                                                                ║
echo ║  This will DELETE and REINSTALL:                              ║
echo ║    • backend/venv                                             ║
echo ║    • backend/__pycache__                                      ║
echo ║    • node_modules                                             ║
echo ║    • All Python cache                                         ║
echo ║                                                                ║
echo ║  Press any key to continue, or Ctrl+C to abort                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

pause

cls

echo.
echo [1/6] Stopping any running backends...
taskkill /IM python.exe /F 2>nul
taskkill /IM node.exe /F 2>nul
echo ✓ Processes stopped
echo.

echo [2/6] Deleting backend cache and venv...
cd /d "%~dp0backend"
if exist "venv" (
    echo Deleting backend\venv...
    rmdir /s /q venv
)
if exist "__pycache__" (
    echo Deleting backend\__pycache__...
    rmdir /s /q __pycache__
)
echo ✓ Backend cache deleted
echo.

echo [3/6] Deleting frontend cache and dependencies...
cd /d "%~dp0"
if exist "node_modules" (
    echo Deleting node_modules...
    rmdir /s /q node_modules
)
if exist "package-lock.json" (
    echo Deleting package-lock.json...
    del package-lock.json
)
echo ✓ Frontend cache deleted
echo.

echo [4/6] Creating fresh virtual environment...
cd backend
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)
echo ✓ Virtual environment created
echo.

echo [5/6] Installing fresh dependencies...
call venv\Scripts\activate.bat
pip install --quiet --upgrade pip setuptools wheel
pip install --quiet -r requirements.txt
if errorlevel 1 (
    echo WARNING: Some dependencies failed, retrying...
    pip install -r requirements.txt
)
echo ✓ Dependencies installed
echo.

echo [6/6] Running diagnostics...
python diagnose.py
if errorlevel 1 (
    echo.
    echo ERROR: Diagnostics still failing
    echo Check the errors above
    pause
    exit /b 1
)
echo.

echo ════════════════════════════════════════════════════════════════
echo   ✓ Complete Reset Finished - Starting Backend
echo ════════════════════════════════════════════════════════════════
echo.
echo Backend URL:  http://localhost:8000
echo Press Ctrl+C to stop
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level info

pause