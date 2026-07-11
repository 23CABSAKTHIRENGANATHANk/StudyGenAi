import os
os.environ.setdefault('GOOGLE_GEMINI_API_KEY', 'fake-key')
import pytest
import requests
from app.services import ai_service

class DummyResp:
    def __init__(self, data, status=200):
        self._data = data
        self.status_code = status
    def json(self):
        return self._data
    def raise_for_status(self):
        if not (200 <= self.status_code < 300):
            raise requests.HTTPError()


def test_generate_embedding_with_api(monkeypatch):
    fake = {'embeddings': [[0.1, 0.2, 0.3]]}
    def fake_post(url, json=None, headers=None, timeout=30):
        return DummyResp(fake, 200)
    monkeypatch.setattr(requests, 'post', fake_post)
    emb = ai_service.generate_embedding('hello world')
    assert isinstance(emb, list)
    assert len(emb) >= 1


def test_generate_chat_with_api(monkeypatch):
    fake = {'candidates': [{'content': {'text': 'Hi there'}}]}
    def fake_post(url, json=None, headers=None, timeout=30):
        return DummyResp(fake, 200)
    monkeypatch.setattr(requests, 'post', fake_post)
    resp = ai_service.generate_chat_response('Hello', 'Context')
    assert 'Hi there' in resp
