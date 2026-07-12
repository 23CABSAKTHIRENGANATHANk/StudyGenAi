@echo off
REM ============================================================================
REM StudyGen AI - Complete Setup & Troubleshooting
REM ============================================================================
REM
REM This script will:
REM   1. Install/update all dependencies
REM   2. Run diagnostic checks
REM   3. Start the backend server
REM
REM If you see any errors, scroll up to see the detailed error messages
REM ============================================================================

setlocal enabledelayedexpansion
title StudyGen AI Backend - Complete Setup

color 0A
cls

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  StudyGen AI - Backend Complete Setup & Auto-Fix              ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM ────────────────────────────────────────────────────────────────────────────
REM STEP 1: Check Python
REM ────────────────────────────────────────────────────────────────────────────
echo [STEP 1] Checking Python Installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please download and install Python 3.10+ from:
    echo   https://www.python.org/downloads/
    echo.
    echo IMPORTANT: During installation, check:
    echo   ☑ "Add python.exe to PATH"
    echo.
    pause
    exit /b 1
)

python --version
for /f "tokens=2" %%i in ('python --version') do set PYTHON_VER=%%i
echo ✓ Python is installed
echo.

REM ────────────────────────────────────────────────────────────────────────────
REM STEP 2: Navigate to backend
REM ────────────────────────────────────────────────────────────────────────────
echo [STEP 2] Navigating to backend directory...
cd /d "%~dp0backend" || (
    echo ERROR: Could not find backend directory
    echo Make sure you run this from the project root
    pause
    exit /b 1
)
echo ✓ Backend directory found
echo.

REM ────────────────────────────────────────────────────────────────────────────
REM STEP 3: Create/Check Virtual Environment
REM ────────────────────────────────────────────────────────────────────────────
echo [STEP 3] Setting up Python Virtual Environment...
if not exist "venv" (
    echo Creating new virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✓ Virtual environment created
) else (
    echo ✓ Virtual environment found
)
echo.

REM ────────────────────────────────────────────────────────────────────────────
REM STEP 4: Activate Virtual Environment
REM ────────────────────────────────────────────────────────────────────────────
echo [STEP 4] Activating Virtual Environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)
echo ✓ Virtual environment activated
echo.

REM ────────────────────────────────────────────────────────────────────────────
REM STEP 5: Upgrade pip
REM ────────────────────────────────────────────────────────────────────────────
echo [STEP 5] Upgrading pip...
python -m pip install --quiet --upgrade pip setuptools wheel
if errorlevel 1 (
    echo WARNING: Could not upgrade pip, but continuing...
)
echo ✓ pip is up to date
echo.

REM ────────────────────────────────────────────────────────────────────────────
REM STEP 6: Install Dependencies
REM ────────────────────────────────────────────────────────────────────────────
echo [STEP 6] Installing Python dependencies...
echo This may take a minute...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo.
    echo WARNING: Some dependencies failed to install with -q flag
    echo Retrying with detailed output...
    echo.
    pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        echo.
        echo Try running manually:
        echo   cd backend
        echo   python -m venv venv
        echo   venv\Scripts\activate.bat
        echo   pip install -r requirements.txt
        echo.
        pause
        exit /b 1
    )
)
echo ✓ All dependencies installed
echo.

REM ────────────────────────────────────────────────────────────────────────────
REM STEP 7: Run Diagnostics
REM ────────────────────────────────────────────────────────────────────────────
echo [STEP 7] Running diagnostic checks...
echo.
python diagnose.py
if errorlevel 1 (
    echo.
    echo ERROR: Diagnostics failed
    echo Please fix the issues shown above
    echo.
    pause
    exit /b 1
)
echo.

REM ────────────────────────────────────────────────────────────────────────────
REM STEP 8: Start Backend
REM ────────────────────────────────────────────────────────────────────────────
echo ════════════════════════════════════════════════════════════════
echo   StudyGen AI Backend - Starting
echo ════════════════════════════════════════════════════════════════
echo.
echo Backend URL:      http://localhost:8000
echo Health Check:     http://localhost:8000/
echo API Docs:         http://localhost:8000/docs
echo Redoc Docs:       http://localhost:8000/redoc
echo.
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level info

echo.
echo Backend stopped
pause