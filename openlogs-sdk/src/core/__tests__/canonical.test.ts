import { describe, expect, it } from "vitest";
import { canonicalize } from "../canonical";

describe("canonicalize", () => {
  it("sorts object keys alphabetically", () => {
    const result = canonicalize({ z: 1, a: 2, m: 3 });
    expect(result).toBe('{"a":2,"m":3,"z":1}');
  });

  it("handles nested objects with sorted keys", () => {
    const result = canonicalize({ b: { z: 1, a: 2 }, a: 3 });
    expect(result).toBe('{"a":3,"b":{"a":2,"z":1}}');
  });

  it("handles null", () => {
    expect(canonicalize(null)).toBe("null");
  });

  it("handles strings", () => {
    expect(canonicalize("hello")).toBe('"hello"');
  });

  it("handles numbers", () => {
    expect(canonicalize(42)).toBe("42");
    expect(canonicalize(3.14)).toBe("3.14");
    expect(canonicalize(-1)).toBe("-1");
  });

  it("handles booleans", () => {
    expect(canonicalize(true)).toBe("true");
    expect(canonicalize(false)).toBe("false");
  });

  it("handles arrays", () => {
    expect(canonicalize([3, 1, 2])).toBe("[3,1,2]");
  });

  it("handles arrays of objects", () => {
    const result = canonicalize([{ b: 1, a: 2 }]);
    expect(result).toBe('[{"a":2,"b":1}]');
  });

  it("converts undefined values to null in arrays", () => {
    const result = canonicalize([1, undefined, 3]);
    expect(result).toBe("[1,null,3]");
  });

  it("omits undefined properties from objects", () => {
    const result = canonicalize({ a: 1, b: undefined, c: 3 });
    expect(result).toBe('{"a":1,"c":3}');
  });

  it("converts Date to ISO string", () => {
    const d = new Date("2026-01-01T00:00:00.000Z");
    const result = canonicalize(d);
    expect(result).toBe('"2026-01-01T00:00:00.000Z"');
  });

  it("throws on BigInt", () => {
    expect(() => canonicalize(BigInt(42))).toThrow("BigInt");
  });

  it("throws on non-finite numbers", () => {
    expect(() => canonicalize(Infinity)).toThrow("Non-finite");
    expect(() => canonicalize(NaN)).toThrow("Non-finite");
    expect(() => canonicalize(-Infinity)).toThrow("Non-finite");
  });

  it("handles deeply nested structures", () => {
    const result = canonicalize({ a: { b: { c: { d: 1 } } } });
    expect(result).toBe('{"a":{"b":{"c":{"d":1}}}}');
  });

  it("produces deterministic output for same input", () => {
    const input = { z: [1, { b: 2, a: 1 }], a: "hello", m: true };
    const r1 = canonicalize(input);
    const r2 = canonicalize(input);
    expect(r1).toBe(r2);
  });

  it("handles empty object", () => {
    expect(canonicalize({})).toBe("{}");
  });

  it("handles empty array", () => {
    expect(canonicalize([])).toBe("[]");
  });
});
