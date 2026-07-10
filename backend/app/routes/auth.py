from fastapi import APIRouter, HTTPException, Response, Request, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from ..services.supabase_service import supabase_service
from ..core.config import settings
from ..db import get_connection
import requests
import logging
import json
import os

logger = logging.getLogger(__name__)

router = APIRouter()


class AuthRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str | None = None


def _upsert_user(user_id: str, email: str) -> None:
    """Ensure the user exists in our local `users` table (syncs from Supabase auth)."""
    try:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO users (id, email)
                       VALUES (%s, %s)
                       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now()""",
                    (user_id, email)
                )
            conn.commit()
        finally:
            conn.close()
    except Exception as e:
        logger.warning("Could not upsert user into users table: %s", e)


@router.post("/signup")
async def signup(data: AuthRequest):
    supabase_url = settings.supabase_url or os.getenv('SUPABASE_URL')
    supabase_key = settings.supabase_service_key or settings.supabase_secret_key or os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_SECRET_KEY')
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail='Supabase not configured')
    try:
        url = f"{supabase_url}/auth/v1/signup"
        headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/json'
        }
        payload = {'email': data.email, 'password': data.password}
        r = requests.post(url, json=payload, headers=headers, timeout=10)
        r.raise_for_status()
        result = r.json()
        # Sync user to our DB if we got an id back
        uid = result.get('id') or (result.get('user') or {}).get('id')
        if uid:
            _upsert_user(uid, data.email)
        return {"message": "Signup initiated. Check your email to confirm.", "result": result}
    except requests.HTTPError:
        detail = None
        try:
            detail = r.json()
        except Exception:
            detail = str(r.text)
        raise HTTPException(status_code=400, detail=detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
async def login(data: AuthRequest):
    try:
        res = supabase_service.client.auth.sign_in_with_password({'email': data.email, 'password': data.password})
        return {"message": "Login successful", "result": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/server-login')
async def server_login(data: AuthRequest, response: Response):
    """Exchange credentials server-side with Supabase and set HttpOnly refresh cookie."""
    supabase_url = settings.supabase_url or os.environ.get('SUPABASE_URL')
    supabase_key = (
        settings.supabase_service_key or settings.supabase_secret_key
        or os.environ.get('SUPABASE_SERVICE_KEY') or os.environ.get('SUPABASE_SECRET_KEY')
    )
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail='Supabase not configured')
    try:
        url = f"{supabase_url}/auth/v1/token?grant_type=password"
        headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/json'
        }
        payload = {'email': data.email, 'password': data.password}
        r = requests.post(url, json=payload, headers=headers, timeout=10)
        r.raise_for_status()
        data_json = r.json()
        access_token = data_json.get('access_token')
        refresh_token = data_json.get('refresh_token')

        # Sync user into our local users table
        user_data = data_json.get('user', {})
        uid = user_data.get('id')
        email = user_data.get('email') or data.email
        if uid:
            _upsert_user(uid, email)

        if refresh_token:
            secure_cookie = str(settings.app_origin or '').startswith('https://')
            response.set_cookie(
                'refresh_token', refresh_token,
                httponly=True,
                secure=secure_cookie,
                samesite='lax',
                max_age=60 * 60 * 24 * 30,
                path='/'
            )
        return {'access_token': access_token, 'user': user_data}
    except requests.HTTPError:
        logger.exception('server-login HTTPError')
        try:
            detail = r.json()
        except Exception:
            detail = r.text
        raise HTTPException(status_code=400, detail=detail)
    except Exception as e:
        logger.exception('server-login failed')
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/forgot-password")
async def forgot_password(email: EmailStr):
    try:
        res = supabase_service.client.auth.reset_password_for_email(str(email))
        return {"message": "Password reset email sent", "result": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-email")
async def verify_email(token: str):
    return {"message": "Email verification handled by Supabase"}


@router.post("/logout")
async def logout(response: Response, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=400, detail='Missing authorization header')
    try:
        scheme, token = authorization.split(' ', 1)
        if scheme.lower() != 'bearer':
            raise HTTPException(status_code=400, detail='Invalid scheme')
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid authorization header')
    try:
        logout_url = settings.supabase_url or os.environ.get('SUPABASE_URL')
        auth_key = (
            settings.supabase_service_key or settings.supabase_secret_key
            or os.environ.get('SUPABASE_SERVICE_KEY') or os.environ.get('SUPABASE_SECRET_KEY')
        )
        auth_header = {'Authorization': authorization, 'apikey': auth_key}
        url = f"{logout_url}/auth/v1/logout"
        try:
            requests.post(url, headers=auth_header, timeout=5)
        except Exception:
            logger.warning('Supabase logout call failed (non-fatal)')
        secure_cookie = str(settings.app_origin or '').startswith('https://')
        response.delete_cookie('refresh_token', path='/', httponly=True, samesite='lax', secure=secure_cookie)
        return {'message': 'Logged out'}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh")
async def refresh_token(req: RefreshRequest, request: Request, response: Response):
    token = req.refresh_token or request.cookies.get('refresh_token')
    if not token:
        raise HTTPException(status_code=400, detail='Missing refresh_token')
    try:
        url = f"{settings.supabase_url}/auth/v1/token?grant_type=refresh_token"
        auth_key = settings.supabase_service_key or settings.supabase_secret_key
        headers = {
            'apikey': auth_key,
            'Authorization': f'Bearer {auth_key}',
            'Content-Type': 'application/json'
        }
        payload = {'refresh_token': token}
        r = requests.post(url, json=payload, headers=headers, timeout=10)
        r.raise_for_status()
        data_json = r.json()
        new_refresh = data_json.get('refresh_token')
        if new_refresh:
            secure_cookie = str(settings.app_origin or '').startswith('https://')
            response.set_cookie(
                'refresh_token', new_refresh,
                httponly=True,
                secure=secure_cookie,
                samesite='lax',
                max_age=60 * 60 * 24 * 30,
                path='/'
            )
        return {'message': 'Refreshed', 'result': data_json}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception('refresh failed')
        raise HTTPException(status_code=400, detail=str(e))
