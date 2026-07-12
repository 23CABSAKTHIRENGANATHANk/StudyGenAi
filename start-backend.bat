@echo off
setlocal enabledelayedexpansion

REM Start Backend - StudyGen AI
REM This script starts the FastAPI backend server on http://localhost:8000

title StudyGen AI Backend - FastAPI
color 0A

echo.
echo ==========================================
echo Starting StudyGen AI Backend
echo ==========================================
echo.

cd backend || (
    echo ERROR: Cannot find backend directory
    pause
    exit /b 1
)

REM Check if venv exists
if not exist "venv" (
    echo [1/4] Creating Virtual Environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        echo Please install Python 3.10+ and try again
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo [2/4] Activating Virtual Environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Install dependencies
echo [3/4] Installing Dependencies...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo WARNING: Some dependencies failed to install
    echo Trying again with error output...
    pip install -r requirements.txt
)

REM Run diagnostics
echo [4/4] Running Diagnostics...
python diagnose.py
if errorlevel 1 (
    echo.
    echo ERROR: Diagnostics failed. Please fix the issues above.
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Backend Starting...
echo ==========================================
echo.
echo URL: http://localhost:8000
echo Health: http://localhost:8000/
echo Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop
echo.

REM Start the backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level info

pause
