import os
os.environ.setdefault('SUPABASE_URL', 'https://example.supabase.co')
os.environ.setdefault('SUPABASE_SERVICE_KEY', 'service-role-key')

import json
from fastapi.testclient import TestClient
from app.main import app
from app.services.supabase_service import supabase_service

client = TestClient(app)

class DummyUser:
    def __init__(self, uid, email):
        self.id = uid
        self.email = email

class DummySession:
    def __init__(self, access_token, refresh_token):
        self.access_token = access_token
        self.refresh_token = refresh_token

class DummyAuthResponse:
    def __init__(self, session, user):
        self.session = session
        self.user = user

class DummyAuthClient:
    def sign_in_with_password(self, credentials):
        session = DummySession('atk123', 'rtk456')
        user = DummyUser('user_1', credentials.get('email'))
        return DummyAuthResponse(session, user)

    def sign_up(self, credentials):
        user = DummyUser('user_1', credentials.get('email'))
        return DummyAuthResponse(None, user)

    def refresh_session(self, token):
        session = DummySession('new_atk', 'new_rtk')
        user = DummyUser('user_1', 'a@b.com')
        return DummyAuthResponse(session, user)

class DummyClient:
    def __init__(self):
        self.auth = DummyAuthClient()


def test_server_login_sets_cookie(monkeypatch):
    monkeypatch.setattr(supabase_service, 'client', DummyClient())

    resp = client.post('/api/auth/server-login', json={'email': 'a@b.com', 'password': 'pass'})
    assert resp.status_code == 200
    body = resp.json()
    assert body.get('access_token') == 'atk123'
    # cookie set
    set_cookie = resp.headers.get('set-cookie', '')
    assert 'refresh_token=rtk456' in set_cookie


def test_refresh_returns_new_token(monkeypatch):
    monkeypatch.setattr(supabase_service, 'client', DummyClient())

    resp = client.post('/api/auth/refresh', json={'refresh_token': 'old'})
    assert resp.status_code == 200
    j = resp.json()
    assert j['result']['access_token'] == 'new_atk'
