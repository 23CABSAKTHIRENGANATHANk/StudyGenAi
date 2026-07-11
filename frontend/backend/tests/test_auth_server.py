import os
os.environ.setdefault('SUPABASE_URL', 'https://example.supabase.co')
os.environ.setdefault('SUPABASE_SERVICE_KEY', 'service-role-key')

import json
from fastapi.testclient import TestClient
from app.main import app
import requests

client = TestClient(app)

class DummyResponse:
    def __init__(self, data, status_code=200):
        self._data = data
        self.status_code = status_code
    def json(self):
        return self._data
    def raise_for_status(self):
        if not (200 <= self.status_code < 300):
            raise requests.HTTPError(f"Status {self.status_code}")


def test_server_login_sets_cookie(monkeypatch):
    dummy = {'access_token': 'atk123', 'refresh_token': 'rtk456', 'user': {'id': 'user_1'}}
    def fake_post(url, json=None, headers=None, timeout=10):
        return DummyResponse(dummy, 200)
    monkeypatch.setattr(requests, 'post', fake_post)

    resp = client.post('/api/auth/server-login', json={'email': 'a@b.com', 'password': 'pass'})
    assert resp.status_code == 200
    body = resp.json()
    assert body.get('access_token') == 'atk123'
    # cookie set
    set_cookie = resp.headers.get('set-cookie', '')
    assert 'refresh_token=rtk456' in set_cookie


def test_refresh_returns_new_token(monkeypatch):
    dummy = {'access_token': 'new_atk', 'refresh_token': 'new_rtk'}
    def fake_post(url, json=None, headers=None, timeout=10):
        return DummyResponse(dummy, 200)
    monkeypatch.setattr(requests, 'post', fake_post)

    resp = client.post('/api/auth/refresh', json={'refresh_token': 'old'})
    assert resp.status_code == 200
    j = resp.json()
    assert j['result']['access_token'] == 'new_atk'
