@echo off
REM Start Backend - StudyGen AI
REM This script starts the FastAPI backend server on http://localhost:8000

echo ==========================================
echo Starting StudyGen AI Backend
echo ==========================================
echo.
echo Backend will run on: http://localhost:8000
echo Press Ctrl+C to stop
echo.

cd backend

REM Check if venv exists
if not exist "venv" (
    echo Virtual environment not found. Creating...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies if needed
pip install -q -r requirements.txt

REM Start the backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
