from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class OpenLogsEntry:
    actor: str
    tps: str
    event: str
    data: dict[str, Any] = field(default_factory=dict)
    indexes: dict[str, str] = field(default_factory=dict)


@dataclass(slots=True)
class OpenLogsSignature:
    alg: str
    public_key_hex: str
    value_hex: str
    kid: str | None = None


@dataclass(slots=True)
class OpenLogsRecord:
    spec: str
    id: str
    entry: OpenLogsEntry
    prev: str | None
    hash: str
    signature: OpenLogsSignature | None = None
