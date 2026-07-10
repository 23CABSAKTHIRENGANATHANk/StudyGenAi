"""Simple in-memory rate limiter for FastAPI."""
import time
from functools import wraps
from fastapi import HTTPException, Request
from typing import Callable, Dict, List


class InMemoryRateLimiter:
    """Per-client IP rate limiter with sliding window."""

    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._store: Dict[str, List[float]] = {}

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        timestamps = self._store.get(key, [])
        # Remove old timestamps
        timestamps = [t for t in timestamps if now - t < self.window_seconds]
        if len(timestamps) >= self.max_requests:
            self._store[key] = timestamps
            return False
        timestamps.append(now)
        self._store[key] = timestamps
        return True

    def reset(self, key: str):
        self._store.pop(key, None)


# Default limiters
general_limiter = InMemoryRateLimiter(max_requests=60, window_seconds=60)
ai_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=60)


def rate_limit(max_requests: int = 60, window_seconds: int = 60):
    """Decorator to rate-limit a FastAPI endpoint by client IP."""
    limiter = InMemoryRateLimiter(max_requests=max_requests, window_seconds=window_seconds)

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request: Request | None = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if request is None:
                for v in kwargs.values():
                    if isinstance(v, Request):
                        request = v
                        break
            if request is not None:
                client = request.client.host if request.client else 'unknown'
                if not limiter.is_allowed(client):
                    raise HTTPException(status_code=429, detail='Rate limit exceeded. Please slow down.')
            return await func(*args, **kwargs)
        return wrapper
    return decorator
