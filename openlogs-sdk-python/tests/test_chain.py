from openlogs_sdk import OpenLogsChainService, OpenLogsEntry, compute_hash, generate_ed25519_keypair


def test_chain_links_prev_hash() -> None:
    service = OpenLogsChainService()

    r1 = service.log(
        OpenLogsEntry(
            actor="system:test",
            tps="tps://node:test@T:unix.1700000000",
            event="http.request.success",
            data={"statusCode": 200},
            indexes={"status": "200"},
        )
    )
    r2 = service.log(
        OpenLogsEntry(
            actor="system:test",
            tps="tps://node:test@T:unix.1700000010",
            event="http.request.success",
            data={"statusCode": 201},
            indexes={"status": "201"},
        )
    )

    assert r1.prev is None
    assert r2.prev == r1.hash
    assert service.verify_chain() is True


def test_hash_changes_when_id_changes() -> None:
    entry = OpenLogsEntry(
        actor="system:test",
        tps="tps://node:test@T:unix.1700000000",
        event="event",
        data={},
        indexes={},
    )
    h1 = compute_hash("openlogs.v2", "id-1", entry, None)
    h2 = compute_hash("openlogs.v2", "id-2", entry, None)
    assert h1 != h2


def test_sign_and_verify() -> None:
    service = OpenLogsChainService()
    keys = generate_ed25519_keypair()

    record = service.log_signed(
        OpenLogsEntry(
            actor="system:test",
            tps="tps://node:test@T:unix.1700000000",
            event="http.request.success",
            data={"statusCode": 200},
            indexes={"status": "200"},
        ),
        private_key=keys.private_key,
        public_key=keys.public_key,
        kid="k1",
    )

    assert record.signature is not None
    assert record.signature.alg == "Ed25519"
    assert service.verify_signatures(keys.public_key) is True
