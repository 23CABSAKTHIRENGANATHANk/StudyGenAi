"""FastAPI middleware: request ID logging and timing."""
import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a unique request ID and log request/response details."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id
        start = time.perf_counter()

        logger.info(
            "[%s] %s %s — started",
            request_id,
            request.method,
            request.url.path,
        )

        try:
            response: Response = await call_next(request)
        except Exception as exc:
            duration = (time.perf_counter() - start) * 1000
            logger.exception("[%s] %s %s — failed after %.2f ms", request_id, request.method, request.url.path, duration)
            raise

        duration = (time.perf_counter() - start) * 1000
        logger.info(
            "[%s] %s %s — %d in %.2f ms",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            duration,
        )
        response.headers['X-Request-ID'] = request_id
        return response
