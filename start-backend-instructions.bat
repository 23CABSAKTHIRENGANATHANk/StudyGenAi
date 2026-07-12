@REM ============================================================================
@REM StudyGen AI - Backend Startup Instructions for Windows
@REM ============================================================================
@REM
@REM WHAT THIS DOES:
@REM   1. Creates a Python virtual environment (if needed)
@REM   2. Installs Python dependencies
@REM   3. Starts the FastAPI backend server on http://localhost:8000
@REM
@REM HOW TO USE:
@REM   1. Double-click this file OR run it from Command Prompt
@REM   2. Keep this terminal window open while developing
@REM   3. The backend will auto-reload when you edit code
@REM   4. Press Ctrl+C to stop
@REM
@REM WHAT YOU SHOULD SEE:
@REM   - Virtual environment activated
@REM   - Dependencies installed
@REM   - "INFO:     Uvicorn running on http://0.0.0.0:8000"
@REM   - "INFO:     Application startup complete"
@REM
@REM If you see CONNECTION ERRORS:
@REM   - Check that PORT 8000 is not already in use
@REM   - Check that DATABASE_URL is set in backend/.env
@REM
@REM If you see IMPORT ERRORS:
@REM   - Delete the "backend/venv" folder
@REM   - Run this script again (it will recreate it)
@REM
@REM ============================================================================

@echo off
setlocal enabledelayedexpansion

title StudyGen AI Backend - FastAPI
color 0A

echo.
echo ============================================================================
echo   StudyGen AI - Backend Startup
echo ============================================================================
echo.
echo   Starting FastAPI backend server...
echo.

cd /d "%~dp0backend" || (
    echo ERROR: Cannot find backend directory
    echo Make sure you're running this script from the project root
    pause
    exit /b 1
)

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo [1/3] Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo.
)

REM Activate virtual environment
echo [2/3] Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Install/upgrade dependencies
echo [3/3] Installing dependencies...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    echo Try running: pip install -r requirements.txt
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo   Starting Backend Server...
echo ============================================================================
echo.
echo   Backend URL: http://localhost:8000
echo   Health:     http://localhost:8000/
echo   Docs:       http://localhost:8000/docs
echo.
echo   Press Ctrl+C to stop the server
echo.
echo ============================================================================
echo.

REM Start the backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
