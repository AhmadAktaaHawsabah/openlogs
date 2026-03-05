from __future__ import annotations

import time

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

from .config import OpenLogsConfig
from .service import OpenLogsFastAPIService


class OpenLogsMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: FastAPI, service: OpenLogsFastAPIService) -> None:
        super().__init__(app)
        self._service = service

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        started = time.time()
        error_msg: str | None = None

        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            error_msg = str(exc)
            raise
        finally:
            duration_ms = max(0, int((time.time() - started) * 1000))
            status = 500
            if "response" in locals():
                status = response.status_code  # type: ignore[name-defined]

            try:
                self._service.log_http_request(
                    method=request.method,
                    path=request.url.path,
                    status_code=status,
                    duration_ms=duration_ms,
                    client_ip=request.client.host if request.client else "unknown",
                    user_agent=request.headers.get("user-agent", "unknown"),
                    error=error_msg,
                    server_host=request.url.hostname,
                )
            except Exception:
                # Logging failures should never break request handling.
                pass


def add_openlogs(app: FastAPI, config: OpenLogsConfig | None = None) -> OpenLogsFastAPIService:
    cfg = config or OpenLogsConfig()
    service = OpenLogsFastAPIService(cfg)

    if cfg.enabled:
        app.add_middleware(OpenLogsMiddleware, service=service)

    app.state.openlogs_service = service
    return service
