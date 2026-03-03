import { describe, expect, it } from "vitest";
import { createEntry } from "../chain";
import type { OpenLogsV2Entry } from "../types";

describe("createEntry", () => {
  it("creates a valid v2 entry with all fields", () => {
    const entry = createEntry({
      actor: "user:alice",
      tps: "tps://L:40.7128,-74.0060@T:greg.m3.c1.y26.m3.d3.h16.m30.s0.m0",
      event: "auth.login",
      data: { method: "oauth2" },
      indexes: { s2: "89c28342d" },
    });

    expect(entry.spec).toBe("openlogs.v2");
    expect(entry.actor).toBe("user:alice");
    expect(entry.event).toBe("auth.login");
    expect(entry.data).toEqual({ method: "oauth2" });
    expect(entry.indexes).toEqual({ s2: "89c28342d" });
    expect(entry.id).toBeDefined();
    expect(entry.tps).toBeDefined();
  });

  it("trims whitespace from actor", () => {
    const entry = createEntry({
      actor: "  user:bob  ",
      tps: "tps://L:0,0@T:greg.m3.c1.y26.m1.d1.h0.m0.s0.m0",
      event: "test",
    });
    expect(entry.actor).toBe("user:bob");
  });

  it("throws when actor is empty", () => {
    expect(() =>
      createEntry({
        actor: "",
        tps: "tps://L:0,0@T:greg.m3.c1.y26.m1.d1.h0.m0.s0.m0",
        event: "test",
      }),
    ).toThrow("actor is required");
  });

  it("throws when actor is whitespace only", () => {
    expect(() =>
      createEntry({
        actor: "   ",
        tps: "tps://L:0,0@T:greg.m3.c1.y26.m1.d1.h0.m0.s0.m0",
        event: "test",
      }),
    ).toThrow("actor is required");
  });

  it("omits data when not provided", () => {
    const entry = createEntry({
      actor: "system:test",
      tps: "tps://L:0,0@T:greg.m3.c1.y26.m1.d1.h0.m0.s0.m0",
      event: "test",
    });
    expect(entry.data).toBeUndefined();
  });

  it("omits indexes when not provided", () => {
    const entry = createEntry({
      actor: "system:test",
      tps: "tps://L:0,0@T:greg.m3.c1.y26.m1.d1.h0.m0.s0.m0",
      event: "test",
    });
    expect(entry.indexes).toBeUndefined();
  });

  it("uses provided id when given", () => {
    const entry = createEntry({
      actor: "system:test",
      tps: "tps://L:0,0@T:greg.m3.c1.y26.m1.d1.h0.m0.s0.m0",
      event: "test",
      id: "custom-id-123",
    });
    expect(entry.id).toBe("custom-id-123");
  });
});
