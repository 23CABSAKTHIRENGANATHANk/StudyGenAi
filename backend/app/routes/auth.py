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
    if not supabase_service.client:
        raise HTTPException(status_code=500, detail='Supabase client not configured')
    try:
        # Sign up using Supabase Python SDK
        res = supabase_service.client.auth.sign_up({
            'email': data.email,
            'password': data.password
        })
        
        user = getattr(res, 'user', None)
        uid = user.id if user else None
        
        if uid:
            _upsert_user(uid, data.email)
            
        # Format a user-friendly response dictionary matching the SDK structure
        user_dict = {
            "id": uid,
            "email": user.email if user else data.email,
        }
        return {
            "message": "Signup initiated. Check your email to confirm if confirmation is enabled.",
            "result": {"user": user_dict}
        }
    except Exception as e:
        logger.exception('signup failed')
        raise HTTPException(status_code=400, detail=str(e))


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
    if not supabase_service.client:
        raise HTTPException(status_code=500, detail='Supabase client not configured')
    try:
        # Use Supabase Python SDK to sign in — this handles all headers and token exchange safely
        res = supabase_service.client.auth.sign_in_with_password({
            'email': data.email,
            'password': data.password
        })
        
        session = getattr(res, 'session', None)
        user = getattr(res, 'user', None)
        
        if not session:
            raise HTTPException(status_code=400, detail="Invalid session returned")
            
        access_token = session.access_token
        refresh_token = session.refresh_token
        
        user_data = {
            "id": user.id if user else None,
            "email": user.email if user else data.email,
        }
        
        if user and user.id:
            _upsert_user(user.id, data.email)
            
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
        return {'access_token': access_token, 'refresh_token': refresh_token, 'user': user_data}
    except Exception as e:
        logger.exception('server-login failed')
        # Raise clear HTTP 400 with the exact error details
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
    if not supabase_service.client:
        raise HTTPException(status_code=500, detail='Supabase client not configured')
    try:
        # Use Supabase Python SDK to refresh the session safely
        res = supabase_service.client.auth.refresh_session(token)
        
        session = getattr(res, 'session', None)
        if not session:
            raise HTTPException(status_code=400, detail="Invalid session returned during refresh")
            
        new_access = session.access_token
        new_refresh = session.refresh_token
        
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
        # Return same payload structure
        return {'message': 'Refreshed', 'result': {
            'access_token': new_access,
            'refresh_token': new_refresh,
            'user': getattr(res, 'user', None)
        }}
    except Exception as e:
        logger.exception('refresh failed')
        raise HTTPException(status_code=400, detail=str(e))
