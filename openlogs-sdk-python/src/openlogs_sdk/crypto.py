from __future__ import annotations

from dataclasses import dataclass

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519

from .models import OpenLogsRecord, OpenLogsSignature


@dataclass(slots=True)
class Ed25519KeyPair:
    private_key: bytes
    public_key: bytes


def generate_ed25519_keypair() -> Ed25519KeyPair:
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    private_key_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_key_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    return Ed25519KeyPair(private_key=private_key_bytes, public_key=public_key_bytes)


def _signing_payload(record: OpenLogsRecord) -> bytes:
    payload = (
        f"{record.spec}|{record.id}|{record.prev}|{record.hash}|"
        f"{record.entry.actor}|{record.entry.tps}|{record.entry.event}"
    )
    return payload.encode("utf-8")


def sign_record(record: OpenLogsRecord, private_key: bytes, public_key: bytes, kid: str | None = None) -> OpenLogsRecord:
    sk = ed25519.Ed25519PrivateKey.from_private_bytes(private_key)
    signature = sk.sign(_signing_payload(record))
    return OpenLogsRecord(
        spec=record.spec,
        id=record.id,
        entry=record.entry,
        prev=record.prev,
        hash=record.hash,
        signature=OpenLogsSignature(
            alg="Ed25519",
            public_key_hex=public_key.hex(),
            value_hex=signature.hex(),
            kid=kid,
        ),
    )


def verify_record_signature(record: OpenLogsRecord, public_key: bytes) -> bool:
    if record.signature is None:
        return False

    vk = ed25519.Ed25519PublicKey.from_public_bytes(public_key)
    try:
        vk.verify(bytes.fromhex(record.signature.value_hex), _signing_payload(record))
        return True
    except Exception:
        return False
