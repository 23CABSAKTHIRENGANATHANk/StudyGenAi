import os
import io
import json
from fastapi.testclient import TestClient
import requests

os.environ.setdefault('SUPABASE_URL', 'https://example.supabase.co')
os.environ.setdefault('SUPABASE_SERVICE_KEY', 'service-role-key')

from app.main import app
from app.services import supabase_service, ai_service

client = TestClient(app)


class DummyConn:
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, tb):
        return False
    def cursor(self):
        class C:
            def __enter__(self):
                return self
            def __exit__(self, a, b, c):
                return False
            def execute(self, *a, **k):
                return None
            def fetchone(self):
                return None
            def fetchall(self):
                return []
        return C()
    def commit(self):
        return None


def test_upload_rejects_large_file(monkeypatch):
    monkeypatch.setenv('MAX_UPLOAD_SIZE_BYTES', '1024')
    # small file over 1KB
    data = b'a' * 1500
    files = {'file': ('notes.txt', io.BytesIO(data), 'text/plain')}
    # bypass auth by overriding dependency
    app.dependency_overrides.clear()
    app.dependency_overrides['app.deps.get_current_user'] = lambda: {'id': 'user_1'}
    resp = client.post('/api/documents/upload', files=files)
    assert resp.status_code == 400


def test_upload_rejects_bad_ext(monkeypatch):
    data = b'hello'
    files = {'file': ('malware.exe', io.BytesIO(data), 'application/octet-stream')}
    app.dependency_overrides.clear()
    app.dependency_overrides['app.deps.get_current_user'] = lambda: {'id': 'user_1'}
    resp = client.post('/api/documents/upload', files=files)
    assert resp.status_code == 400


def test_upload_accepts_and_processes(monkeypatch):
    data = b'Hello world from test'
    files = {'file': ('notes.txt', io.BytesIO(data), 'text/plain')}

    # Monkeypatch external services: storage and AI and DB connection
    monkeypatch.setattr(supabase_service, 'upload_file', lambda bucket, path, content, content_type=None: {'path': path})
    monkeypatch.setattr(ai_service, 'generate_embedding', lambda text: [0.1, 0.2, 0.3])
    monkeypatch.setattr('app.routes.documents.get_connection', lambda: DummyConn())

    app.dependency_overrides.clear()
    app.dependency_overrides['app.deps.get_current_user'] = lambda: {'id': 'user_1'}

    resp = client.post('/api/documents/upload', files=files)
    assert resp.status_code in (200, 201)
    body = resp.json()
    assert 'document_id' in body
