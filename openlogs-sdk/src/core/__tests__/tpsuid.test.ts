import { describe, expect, it } from "vitest";
import { generateTpsUid, decodeTpsUid } from "../tpsuid";

describe("TPS-UID generation and decoding", () => {
  const tpsString =
    "tps://L:40.7128,-74.0060@T:greg.m3.c1.y26.m3.d3.h14.m30.s0.m0";

  it("generates a non-empty string", () => {
    const uid = generateTpsUid(tpsString);
    expect(uid).toBeDefined();
    expect(uid.length).toBeGreaterThan(0);
  });

  it("generates unique UIDs for same TPS input", () => {
    const uid1 = generateTpsUid(tpsString);
    const uid2 = generateTpsUid(tpsString);
    expect(uid1).not.toBe(uid2);
  });

  it("roundtrips TPS through encode/decode", () => {
    const uid = generateTpsUid(tpsString);
    const decoded = decodeTpsUid(uid);
    expect(decoded.tps).toBe(tpsString);
  });

  it("includes context in decoded output", () => {
    const uid = generateTpsUid(tpsString);
    const decoded = decodeTpsUid(uid);
    expect(decoded.context).toBeDefined();
    expect(decoded.context!.length).toBeGreaterThan(0);
  });

  it("works with different TPS strings", () => {
    const tps2 = "tps://L:35.6762,139.6503@T:greg.m3.c1.y26.m3.d3.h08.m0.s0.m0";
    const uid = generateTpsUid(tps2);
    const decoded = decodeTpsUid(uid);
    expect(decoded.tps).toBe(tps2);
  });

  it("throws on invalid UID", () => {
    expect(() => decodeTpsUid("not-a-real-uid")).toThrow();
  });
});
