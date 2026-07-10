# Backend (FastAPI)

Run the backend locally with a virtual environment and the required packages.

Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Environment

- Copy `backend/.env.example` to `backend/.env` and fill values (do NOT commit `.env`).

Run

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Tests

```powershell
cd backend
pytest -q
```
