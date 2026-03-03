import { describe, expect, it } from "vitest";

import {
  createV2Record,
  generateEd25519Keypair,
  signV2Record,
  verifyV2Chain,
} from "../index";

describe("openlogs-sdk chain", () => {
  it("creates a valid hash chain", async () => {
    const r1 = createV2Record(
      {
        actor: "system:test",
        tps: "tps://node:test@T:greg.m3.c1.y26.m01.d09.h14.m30.s25.m0",
        event: "test.one",
        data: { n: 1 },
      },
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
      {
        actor: "system:test",
        tps: "tps://node:test@T:greg.m3.c1.y26.m01.d09.h14.m30.s25.m0",
        event: "test.one",
      },
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

  it("signs and verifies signatures when present", async () => {
    const keys = await generateEd25519Keypair();

    const r1 = createV2Record(
      {
        actor: "system:test",
        tps: "tps://node:test@T:greg.m3.c1.y26.m01.d09.h14.m30.s25.m0",
        event: "test.sig",
      },
      null,
    );

    const signed = await signV2Record(r1, keys);
    expect(signed.sig).toBeTruthy();

    const res = await verifyV2Chain([signed]);
    expect(res.ok).toBe(true);
  });
});
