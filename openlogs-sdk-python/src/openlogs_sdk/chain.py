from __future__ import annotations

import hashlib
import json
import uuid
from copy import deepcopy
from typing import Any

from .crypto import sign_record, verify_record_signature
from .models import OpenLogsEntry, OpenLogsRecord


SPEC = "openlogs.v2"


def canonical_json(value: Any) -> str:
    return json.dumps(value, separators=(",", ":"), sort_keys=True)


def compute_hash(spec: str, record_id: str, entry: OpenLogsEntry, prev: str | None) -> str:
    payload = {
        "spec": spec,
        "id": record_id,
        "prev": prev,
        "entry": {
            "actor": entry.actor,
            "tps": entry.tps,
            "event": entry.event,
            "data": entry.data,
            "indexes": entry.indexes,
        },
    }
    return hashlib.sha256(canonical_json(payload).encode("utf-8")).hexdigest()


class OpenLogsChainService:
    def __init__(self) -> None:
        self._records: list[OpenLogsRecord] = []
        self._latest_hash: str | None = None

    def log(self, entry: OpenLogsEntry) -> OpenLogsRecord:
        record_id = str(uuid.uuid4())
        prev = self._latest_hash
        digest = compute_hash(SPEC, record_id, entry, prev)

        record = OpenLogsRecord(
            spec=SPEC,
            id=record_id,
            entry=entry,
            prev=prev,
            hash=digest,
            signature=None,
        )
        self._records.append(record)
        self._latest_hash = record.hash
        return record

    def log_signed(self, entry: OpenLogsEntry, private_key: bytes, public_key: bytes, kid: str | None = None) -> OpenLogsRecord:
        record = self.log(entry)
        signed = sign_record(record, private_key=private_key, public_key=public_key, kid=kid)
        self._records[-1] = signed
        return signed

    def get_chain(self) -> list[OpenLogsRecord]:
        return deepcopy(self._records)

    def get_latest_hash(self) -> str | None:
        return self._latest_hash

    def verify_chain(self) -> bool:
        expected_prev: str | None = None
        for record in self._records:
            if record.prev != expected_prev:
                return False
            recomputed = compute_hash(record.spec, record.id, record.entry, record.prev)
            if recomputed != record.hash:
                return False
            expected_prev = record.hash
        return True

    def verify_signatures(self, public_key: bytes) -> bool:
        for record in self._records:
            if record.signature is None:
                continue
            if not verify_record_signature(record, public_key):
                return False
        return True
