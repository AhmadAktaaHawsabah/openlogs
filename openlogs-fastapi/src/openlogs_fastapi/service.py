from __future__ import annotations

from datetime import datetime, timezone

from openlogs_sdk import OpenLogsChainService, OpenLogsEntry, OpenLogsRecord

from .config import OpenLogsConfig


class OpenLogsFastAPIService:
    def __init__(self, config: OpenLogsConfig) -> None:
        self._config = config
        self._chain = OpenLogsChainService()

    def log_http_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: int,
        client_ip: str,
        user_agent: str,
        error: str | None = None,
        server_host: str | None = None,
    ) -> OpenLogsRecord:
        actor = self._config.actor or f"client:{client_ip}"
        event = "http.request.failed" if error else "http.request.success"

        data = {
            "method": method,
            "url": path,
            "statusCode": status_code,
            "durationMs": duration_ms,
            "userAgent": user_agent or "unknown",
        }
        if error:
            data["error"] = error

        indexes = {
            "method": method,
            "status": str(status_code),
        }

        entry = OpenLogsEntry(
            actor=actor,
            tps=self._build_tps_uri(server_host),
            event=event,
            data=data,
            indexes=indexes,
        )
        return self._chain.log(entry)

    def get_chain(self) -> list[OpenLogsRecord]:
        return self._chain.get_chain()

    def get_latest_hash(self) -> str | None:
        return self._chain.get_latest_hash()

    def _build_tps_uri(self, server_host: str | None) -> str:
        parts: list[str] = []

        if self._config.node_name:
            parts.append(f"node:{self._config.node_name}")
        elif server_host:
            parts.append(f"node:{server_host}")

        loc = self._config.location
        if loc.latitude is not None and loc.longitude is not None:
            parts.append(f"L:{loc.latitude},{loc.longitude}")
            place_parts: list[str] = []
            if loc.place_country_code:
                place_parts.append(f"cc={loc.place_country_code}")
            if loc.place_city_code:
                place_parts.append(f"ci={loc.place_city_code}")
            if place_parts:
                parts.append(f"P:{','.join(place_parts)}")

        location = ";".join(parts) if parts else "unknown"

        timestamp = int(datetime.now(tz=timezone.utc).timestamp())
        ctx = ""
        if self._config.context:
            fragments = [f"{k}={v}" for k, v in self._config.context.items()]
            ctx = "#C:" + ";".join(fragments)

        return f"tps://{location}@T:unix.{timestamp}{ctx}"
