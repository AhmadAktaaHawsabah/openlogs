import { describe, expect, it } from "vitest";
import {
  hexToBytes,
  utf8ToBytes,
  sha256Hex,
  randomBytes,
  generateEd25519Keypair,
  ed25519Sign,
  ed25519Verify,
} from "../crypto";

describe("hexToBytes", () => {
  it("converts valid hex to bytes", () => {
    const bytes = hexToBytes("deadbeef");
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(4);
    expect(bytes[0]).toBe(0xde);
    expect(bytes[1]).toBe(0xad);
    expect(bytes[2]).toBe(0xbe);
    expect(bytes[3]).toBe(0xef);
  });

  it("handles uppercase hex", () => {
    const bytes = hexToBytes("DEADBEEF");
    expect(bytes[0]).toBe(0xde);
  });

  it("handles hex with whitespace", () => {
    const bytes = hexToBytes("  deadbeef  ");
    expect(bytes.length).toBe(4);
  });

  it("throws on odd-length hex", () => {
    expect(() => hexToBytes("abc")).toThrow("Invalid hex");
  });

  it("handles empty string", () => {
    const bytes = hexToBytes("");
    expect(bytes.length).toBe(0);
  });
});

describe("utf8ToBytes", () => {
  it("converts ASCII string", () => {
    const bytes = utf8ToBytes("hello");
    expect(bytes.length).toBe(5);
  });

  it("converts empty string", () => {
    const bytes = utf8ToBytes("");
    expect(bytes.length).toBe(0);
  });

  it("handles unicode", () => {
    const bytes = utf8ToBytes("héllo");
    expect(bytes.length).toBeGreaterThan(5);
  });
});

describe("sha256Hex", () => {
  it("hashes a string to 64 hex chars", () => {
    const hash = sha256Hex("hello");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces deterministic output", () => {
    expect(sha256Hex("test")).toBe(sha256Hex("test"));
  });

  it("produces different output for different input", () => {
    expect(sha256Hex("a")).not.toBe(sha256Hex("b"));
  });

  it("accepts Uint8Array input", () => {
    const bytes = new Uint8Array([104, 101, 108, 108, 111]); // "hello"
    const hash = sha256Hex(bytes);
    expect(hash).toBe(sha256Hex("hello"));
  });
});

describe("randomBytes", () => {
  it("generates bytes of requested length", () => {
    const bytes = randomBytes(16);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(16);
  });

  it("generates different values each call", () => {
    const a = randomBytes(16);
    const b = randomBytes(16);
    // Extremely unlikely to be equal
    expect(Buffer.from(a).toString("hex")).not.toBe(
      Buffer.from(b).toString("hex"),
    );
  });

  it("handles zero length", () => {
    const bytes = randomBytes(0);
    expect(bytes.length).toBe(0);
  });
});

describe("Ed25519 keypair, sign, verify", () => {
  it("generates a valid keypair", async () => {
    const { privateKey, publicKey } = await generateEd25519Keypair();
    expect(privateKey).toBeInstanceOf(Uint8Array);
    expect(publicKey).toBeInstanceOf(Uint8Array);
    expect(privateKey.length).toBe(32);
    expect(publicKey.length).toBe(32);
  });

  it("signs and verifies a message", async () => {
    const { privateKey, publicKey } = await generateEd25519Keypair();
    const message = utf8ToBytes("hello world");
    const sig = await ed25519Sign(message, privateKey);
    expect(sig).toBeInstanceOf(Uint8Array);
    expect(sig.length).toBe(64);

    const valid = await ed25519Verify(sig, message, publicKey);
    expect(valid).toBe(true);
  });

  it("rejects tampered message", async () => {
    const { privateKey, publicKey } = await generateEd25519Keypair();
    const message = utf8ToBytes("original");
    const sig = await ed25519Sign(message, privateKey);

    const tampered = utf8ToBytes("tampered");
    const valid = await ed25519Verify(sig, tampered, publicKey);
    expect(valid).toBe(false);
  });

  it("rejects wrong public key", async () => {
    const keys1 = await generateEd25519Keypair();
    const keys2 = await generateEd25519Keypair();
    const message = utf8ToBytes("test");
    const sig = await ed25519Sign(message, keys1.privateKey);

    const valid = await ed25519Verify(sig, message, keys2.publicKey);
    expect(valid).toBe(false);
  });
});
