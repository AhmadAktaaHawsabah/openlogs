import { strict as assert } from "node:assert";

import {
  createEntry,
  createV2Record,
  signV2Record,
  verifyV2Chain,
  createV2Chain,
  generateEd25519Keypair,
  generateTpsUid,
  decodeTpsUid,
  type OpenLogsV2Entry,
  type OpenLogsV2Record,
  type VerifyResult,
} from "@nextera.one/openlogs-sdk";

// ============================================================================
// Helpers
// ============================================================================

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err: unknown) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ ${name}: ${msg}`);
  }
}

function section(name: string) {
  console.log(`\n▸ ${name}`);
}

// ============================================================================
// Tests
// ============================================================================

async function run() {
  console.log("\n╔═════════════════════════════════════════╗");
  console.log("║  OpenLogs SDK v2 — Assertion Test Suite  ║");
  console.log("╚═════════════════════════════════════════╝");

  // ─── Entry Creation ─────────────────────────────────────────────────────
  section("Entry Creation");

  await test("creates a valid v2 entry", () => {
    const entry: OpenLogsV2Entry = createEntry({
      actor: "user:alice",
      tps: "tps://L:40.7128,-74.0060@T:greg.m3.c1.y26.m3.d3.h16.m30.s0.m0",
      event: "auth.login",
      data: { method: "oauth2", provider: "google" },
    });
    assert.equal(entry.spec, "openlogs.v2");
    assert.equal(entry.actor, "user:alice");
    assert.equal(entry.event, "auth.login");
    assert.ok(entry.id, "id should be set");
    assert.ok(entry.tps, "tps should be set");
    assert.deepEqual(entry.data, { method: "oauth2", provider: "google" });
  });

  await test("rejects empty actor", () => {
    assert.throws(
      () =>
        createEntry({
          actor: "",
          tps: "tps://L:0,0@T:greg.m3.c1.y26.m1.d1.h0.m0.s0.m0",
          event: "test",
        }),
      /actor is required/,
    );
  });

  await test("supports geospatial indexes", () => {
    const entry = createEntry({
      actor: "device:iot-42",
      tps: "tps://L:37.7749,-122.4194@T:greg.m3.c1.y26.m3.d3.h14.m23.s45.m0",
      event: "sensor.reading",
      data: { temperature: 22.5 },
      indexes: { s2: "89c28342d", h3: "8a283469d7fffff" },
    });
    assert.equal(entry.indexes?.s2, "89c28342d");
    assert.equal(entry.indexes?.h3, "8a283469d7fffff");
  });

  // ─── Hash Chain ─────────────────────────────────────────────────────────
  section("Hash Chain");

  const r1: OpenLogsV2Record = createV2Record(
    {
      actor: "system:audit",
      tps: "tps://L:35.6762,139.6503@T:greg.m3.c1.y26.m3.d3.h08.m0.s0.m0",
      event: "data.read",
      data: { query: "SELECT * FROM users", rows: 42 },
    },
    null,
  );

  const r2: OpenLogsV2Record = createV2Record(
    {
      actor: "user:bob",
      tps: "tps://L:35.6762,139.6503@T:greg.m3.c1.y26.m3.d3.h08.m15.s30.m0",
      event: "file.upload",
      data: { filename: "report.pdf", size: 2048000 },
    },
    r1.hash,
  );

  const r3: OpenLogsV2Record = createV2Record(
    {
      actor: "service:processor",
      tps: "tps://L:35.6762,139.6503@T:greg.m3.c1.y26.m3.d3.h08.m45.s15.m0",
      event: "job.complete",
      data: { jobId: "job-12345", status: "success" },
    },
    r2.hash,
  );

  await test("builds a 3-record chain with correct linking", () => {
    assert.equal(r1.prev_hash, null);
    assert.equal(r2.prev_hash, r1.hash);
    assert.equal(r3.prev_hash, r2.hash);
  });

  await test("verifies valid chain", async () => {
    const res: VerifyResult = await verifyV2Chain([r1, r2, r3]);
    assert.ok(res.ok, `Chain should be valid: ${res.error}`);
  });

  await test("detects tampered data", async () => {
    const tampered = { ...r2, entry: { ...r2.entry, event: "tampered" } };
    const res = await verifyV2Chain([r1, tampered, r3]);
    assert.ok(!res.ok);
    assert.equal(res.error, "hash-mismatch");
  });

  await test("detects broken prev_hash", async () => {
    const broken = createV2Record(
      { actor: "system:test", tps: r2.entry.tps, event: "test" },
      "deadbeef",
    );
    const res = await verifyV2Chain([r1, broken]);
    assert.ok(!res.ok);
    assert.equal(res.error, "prev-hash-mismatch");
  });

  // ─── Batch Chain ────────────────────────────────────────────────────────
  section("Batch Chain (createV2Chain)");

  await test("creates batch of linked records", async () => {
    const batch = createV2Chain([
      {
        actor: "system:test",
        tps: "tps://node:test@T:greg.m3.c1.y26.m1.d1.h0.m0.s0.m0",
        event: "step.1",
      },
      {
        actor: "system:test",
        tps: "tps://node:test@T:greg.m3.c1.y26.m1.d1.h0.m1.s0.m0",
        event: "step.2",
      },
      {
        actor: "system:test",
        tps: "tps://node:test@T:greg.m3.c1.y26.m1.d1.h0.m2.s0.m0",
        event: "step.3",
      },
    ]);

    assert.equal(batch.length, 3);
    assert.equal(batch[0].prev_hash, null);
    assert.equal(batch[1].prev_hash, batch[0].hash);
    assert.equal(batch[2].prev_hash, batch[1].hash);

    const res = await verifyV2Chain(batch);
    assert.ok(res.ok);
  });

  // ─── Signing ────────────────────────────────────────────────────────────
  section("Ed25519 Signing");

  const keys = await generateEd25519Keypair();

  const signed1 = await signV2Record(r1, { ...keys, kid: "key:test-2026" });
  const signed2 = await signV2Record(r2, { ...keys, kid: "key:test-2026" });
  const signed3 = await signV2Record(r3, { ...keys, kid: "key:test-2026" });

  await test("signs records with Ed25519", () => {
    assert.ok(signed1.sig, "should have signature");
    assert.equal(signed1.sig!.alg, "ed25519");
    assert.equal(signed1.sig!.kid, "key:test-2026");
    assert.ok(signed1.sig!.sigHex.length > 0);
    assert.ok(signed1.sig!.publicKeyHex.length > 0);
  });

  await test("verifies signed chain", async () => {
    const res = await verifyV2Chain([signed1, signed2, signed3]);
    assert.ok(res.ok, `Signed chain should be valid: ${res.error}`);
  });

  // ─── TPS-UID ────────────────────────────────────────────────────────────
  section("TPS-UID");

  await test("generates and decodes TPS-UID roundtrip", () => {
    const tps = "tps://L:40.7128,-74.0060@T:greg.m3.c1.y26.m3.d3.h14.m30.s0.m0";
    const uid: string = generateTpsUid(tps);
    assert.ok(uid.length > 0, "UID should be non-empty");

    const decoded = decodeTpsUid(uid);
    assert.equal(decoded.tps, tps, "decoded TPS should match original");
    assert.ok(decoded.context, "should have random context");
  });

  await test("generates unique UIDs", () => {
    const tps = "tps://L:40.7128,-74.0060@T:greg.m3.c1.y26.m3.d3.h14.m30.s0.m0";
    const uid1 = generateTpsUid(tps);
    const uid2 = generateTpsUid(tps);
    assert.notEqual(uid1, uid2, "UIDs should be unique");
  });

  // ─── Multi-Calendar ─────────────────────────────────────────────────────
  section("Multi-Calendar");

  await test("supports Gregorian calendar", () => {
    const entry = createEntry({
      actor: "system:admin",
      tps: "tps://L:51.5074,-0.1278@T:greg.m3.c1.y26.m3.d3.h12.m0.s0.m0",
      event: "config.update",
    });
    assert.equal(entry.spec, "openlogs.v2");
  });

  await test("supports Unix timestamp", () => {
    const entry = createEntry({
      actor: "system:admin",
      tps: "tps://L:51.5074,-0.1278@T:unix.m1741020000",
      event: "config.update",
    });
    assert.equal(entry.spec, "openlogs.v2");
  });

  // ─── Summary ────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("═══════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
