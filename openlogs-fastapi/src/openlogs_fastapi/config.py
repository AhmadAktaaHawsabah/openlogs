from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class OpenLogsLocation:
    latitude: float | None = None
    longitude: float | None = None
    place_country_code: str | None = None
    place_city_code: str | None = None


@dataclass(slots=True)
class OpenLogsConfig:
    enabled: bool = True
    actor: str | None = None
    node_name: str | None = None
    context: dict[str, str] = field(default_factory=dict)
    location: OpenLogsLocation = field(default_factory=OpenLogsLocation)
