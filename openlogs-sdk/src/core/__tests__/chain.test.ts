import { describe, expect, it } from "vitest";
import {
  createV2Record,
  createV2Chain,
  signV2Record,
  verifyV2Chain,
  verifyV2RecordSignature,
  computeV2RecordHash,
  generateEd25519Keypair,
} from "../index";

describe("openlogs-sdk chain", () => {
  const baseTps = "tps://node:test@T:greg.m3.c1.y26.m01.d09.h14.m30.s25.m0";

  it("creates a valid hash chain", async () => {
    const r1 = createV2Record(
      { actor: "system:test", tps: baseTps, event: "test.one", data: { n: 1 } },
      null,
    );

    const r2 = createV2Record(
      {
        actor: "system:test",
        tps: "tps://node:test@T:greg.m3.c1.y26.m01.d09.h14.m30.s26.m0",
        event: "test.two",
        data: { n: 2 },
      },
      r1.hash,
    );

    const res = await verifyV2Chain([r1, r2]);
    expect(res.ok).toBe(true);
  });

  it("detects a broken prevHash", async () => {
    const r1 = createV2Record(
      { actor: "system:test", tps: baseTps, event: "test.one" },
      null,
    );
    const r2 = createV2Record(
      {
        actor: "system:test",
        tps: "tps://node:test@T:greg.m3.c1.y26.m01.d09.h14.m30.s26.m0",
        event: "test.two",
      },
      "deadbeef",
    );

    const res = await verifyV2Chain([r1, r2]);
    expect(res.ok).toBe(false);
    expect(res.error).toBe("prev-hash-mismatch");
    expect(res.index).toBe(1);
  });

  it("detects tampered entry data", async () => {
    const r1 = createV2Record(
      { actor: "system:test", tps: baseTps, event: "test.one" },
      null,
    );

    // Tamper with the entry
    const tampered = { ...r1, entry: { ...r1.entry, event: "tampered" } };
    const res = await verifyV2Chain([tampered]);
    expect(res.ok).toBe(false);
    expect(res.error).toBe("hash-mismatch");
  });

  it("signs and verifies signatures when present", async () => {
    const keys = await generateEd25519Keypair();

    const r1 = createV2Record(
      { actor: "system:test", tps: baseTps, event: "test.sig" },
      null,
    );

    const signed = await signV2Record(r1, keys);
    expect(signed.sig).toBeTruthy();

    const res = await verifyV2Chain([signed]);
    expect(res.ok).toBe(true);
  });

  it("detects bad signatures", async () => {
    const keys = await generateEd25519Keypair();
    const r1 = createV2Record(
      { actor: "system:test", tps: baseTps, event: "test.sig" },
      null,
    );

    const signed = await signV2Record(r1, keys);

    // Tamper with the signature
    const tampered = {
      ...signed,
      sig: { ...signed.sig!, sigHex: signed.sig!.sigHex.replace(/^./, "0") },
    };
    const res = await verifyV2Chain([tampered]);
    expect(res.ok).toBe(false);
    expect(res.error).toBe("bad-signature");
  });

  it("verifyV2RecordSignature returns false for unsigned records", async () => {
    const r1 = createV2Record(
      { actor: "system:test", tps: baseTps, event: "test" },
      null,
    );
    const result = await verifyV2RecordSignature(r1);
    expect(result).toBe(false);
  });

  it("signV2Record validates key sizes", async () => {
    const r1 = createV2Record(
      { actor: "system:test", tps: baseTps, event: "test" },
      null,
    );

    await expect(
      signV2Record(r1, {
        privateKey: new Uint8Array(16),
        publicKey: new Uint8Array(32),
      }),
    ).rejects.toThrow("32-byte");

    await expect(
      signV2Record(r1, {
        privateKey: new Uint8Array(32),
        publicKey: new Uint8Array(16),
      }),
    ).rejects.toThrow("32-byte");
  });

  it("computeV2RecordHash validates entry spec", () => {
    expect(() => computeV2RecordHash({ spec: "wrong" } as any, null)).toThrow(
      "openlogs.v2",
    );
  });
});

describe("createV2Chain", () => {
  it("creates a batch of chained records", async () => {
    const records = createV2Chain([
      {
        actor: "system:test",
        tps: "tps://node:test@T:greg.m3.c1.y26.m01.d09.h14.m30.s25.m0",
        event: "step.one",
      },
      {
        actor: "system:test",
        tps: "tps://node:test@T:greg.m3.c1.y26.m01.d09.h14.m30.s26.m0",
        event: "step.two",
      },
      {
        actor: "system:test",
        tps: "tps://node:test@T:greg.m3.c1.y26.m01.d09.h14.m30.s27.m0",
        event: "step.three",
      },
    ]);

    expect(records.length).toBe(3);
    expect(records[0].prev_hash).toBeNull();
    expect(records[1].prev_hash).toBe(records[0].hash);
    expect(records[2].prev_hash).toBe(records[1].hash);

    const res = await verifyV2Chain(records);
    expect(res.ok).toBe(true);
  });

  it("throws on empty input", () => {
    expect(() => createV2Chain([])).toThrow("at least one input");
  });
});
