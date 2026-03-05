// src/core/canonical.ts
function normalize(value) {
  if (value === null) return null;
  const t = typeof value;
  if (t === "string" || t === "boolean") return value;
  if (t === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Non-finite numbers are not supported in canonical JSON");
    }
    return value;
  }
  if (t === "bigint") {
    throw new Error("BigInt is not supported in canonical JSON");
  }
  if (t === "undefined" || t === "function" || t === "symbol") {
    return null;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((v) => normalize(v));
  }
  if (typeof value === "object") {
    const obj = value;
    const out = {};
    for (const key of Object.keys(obj).sort()) {
      const v = obj[key];
      if (typeof v === "undefined") continue;
      out[key] = normalize(v);
    }
    return out;
  }
  throw new Error("Unsupported value for canonical JSON");
}
function canonicalize(value) {
  return JSON.stringify(normalize(value));
}

// src/core/chain.ts
import { bytesToHex as bytesToHex3 } from "@noble/hashes/utils.js";
import { ulid } from "ulid";

// src/core/crypto.ts
import * as ed from "@noble/ed25519";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
function hexToBytes(hex) {
  const clean = hex.trim().toLowerCase();
  if (clean.length % 2 !== 0) throw new Error("Invalid hex");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
function utf8ToBytes(s) {
  return new TextEncoder().encode(s);
}
function sha256Hex(data) {
  const bytes = typeof data === "string" ? utf8ToBytes(data) : data;
  return bytesToHex(sha256(bytes));
}
async function ed25519Sign(message, privateKey) {
  return ed.signAsync(message, privateKey);
}
async function ed25519Verify(sig, message, publicKey) {
  return ed.verifyAsync(sig, message, publicKey);
}

// src/core/tps.ts
import { TPS } from "@nextera.one/tps-standard";

// src/core/tpsuid.ts
import { TPSUID7RB } from "@nextera.one/tps-standard";
import { bytesToHex as bytesToHex2 } from "@noble/hashes/utils.js";

// src/core/chain.ts
function createPayload(input) {
  return {
    actor: input.actor,
    intent: input.intent,
    tps: input.tps,
    ts: input.ts ?? (/* @__PURE__ */ new Date()).toISOString(),
    nonce: input.nonce ?? ulid(),
    location: input.location,
    data: input.data
  };
}
function computeRecordHash(payload, prevHash) {
  const body = canonicalize({ v: 1, prevHash, payload });
  return sha256Hex(body);
}
function createRecord(payloadInput, prevHash) {
  const payload = createPayload(payloadInput);
  const hash = computeRecordHash(payload, prevHash);
  return { v: 1, prevHash, payload, hash };
}
async function signRecord(record, keys) {
  const sigBytes = await ed25519Sign(utf8ToBytes(record.hash), keys.privateKey);
  const sig = {
    alg: "ed25519",
    publicKeyHex: bytesToHex3(keys.publicKey),
    sigHex: bytesToHex3(sigBytes),
    kid: keys.kid
  };
  return { ...record, sig };
}
async function verifyRecordSignature(record) {
  if (!record.sig) return false;
  if (record.sig.alg !== "ed25519") return false;
  const pub = hexToBytes(record.sig.publicKeyHex);
  const sig = hexToBytes(record.sig.sigHex);
  return ed25519Verify(sig, utf8ToBytes(record.hash), pub);
}
async function verifyChain(records) {
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const expectedHash = computeRecordHash(r.payload, r.prevHash);
    if (r.hash !== expectedHash) {
      return { ok: false, error: "hash-mismatch", index: i };
    }
    const expectedPrev = i === 0 ? null : records[i - 1].hash;
    if (r.prevHash !== expectedPrev) {
      return { ok: false, error: "prev-hash-mismatch", index: i };
    }
    if (r.sig) {
      const ok = await verifyRecordSignature(r);
      if (!ok) return { ok: false, error: "bad-signature", index: i };
    }
  }
  return { ok: true };
}
export {
  computeRecordHash,
  createPayload,
  createRecord,
  signRecord,
  verifyChain,
  verifyRecordSignature
};
//# sourceMappingURL=v1.mjs.map