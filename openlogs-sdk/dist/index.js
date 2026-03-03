"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/core/crypto.ts
var crypto_exports = {};
__export(crypto_exports, {
  ed25519Sign: () => ed25519Sign,
  ed25519Verify: () => ed25519Verify,
  generateEd25519Keypair: () => generateEd25519Keypair,
  hexToBytes: () => hexToBytes,
  randomBytes: () => randomBytes,
  sha256Hex: () => sha256Hex,
  utf8ToBytes: () => utf8ToBytes
});
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
  return (0, import_utils.bytesToHex)((0, import_sha2.sha256)(bytes));
}
function randomBytes(length) {
  const g = globalThis;
  if (g.crypto?.getRandomValues) {
    const out = new Uint8Array(length);
    g.crypto.getRandomValues(out);
    return out;
  }
  const nodeCrypto = require("crypto");
  return new Uint8Array(nodeCrypto.randomBytes(length));
}
async function generateEd25519Keypair() {
  const privateKey = randomBytes(32);
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  return { privateKey, publicKey };
}
async function ed25519Sign(message, privateKey) {
  return ed.signAsync(message, privateKey);
}
async function ed25519Verify(sig, message, publicKey) {
  return ed.verifyAsync(sig, message, publicKey);
}
var ed, import_sha2, import_utils;
var init_crypto = __esm({
  "src/core/crypto.ts"() {
    "use strict";
    ed = __toESM(require("@noble/ed25519"));
    import_sha2 = require("@noble/hashes/sha2.js");
    import_utils = require("@noble/hashes/utils.js");
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  canonicalize: () => canonicalize,
  computeRecordHash: () => computeRecordHash,
  computeV2RecordHash: () => computeV2RecordHash,
  createEntry: () => createEntry,
  createPayload: () => createPayload,
  createRecord: () => createRecord,
  createV2Record: () => createV2Record,
  ed25519Sign: () => ed25519Sign,
  ed25519Verify: () => ed25519Verify,
  generateEd25519Keypair: () => generateEd25519Keypair,
  hexToBytes: () => hexToBytes,
  randomBytes: () => randomBytes,
  sha256Hex: () => sha256Hex,
  signRecord: () => signRecord,
  signV2Record: () => signV2Record,
  utf8ToBytes: () => utf8ToBytes,
  verifyChain: () => verifyChain,
  verifyRecordSignature: () => verifyRecordSignature,
  verifyV2Chain: () => verifyV2Chain,
  verifyV2RecordSignature: () => verifyV2RecordSignature
});
module.exports = __toCommonJS(index_exports);

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

// src/core/index.ts
init_crypto();

// src/core/chain.ts
var import_ulid = require("ulid");
var import_utils2 = require("@noble/hashes/utils.js");
init_crypto();
function createEntry(input) {
  return {
    spec: "openlogs.v2",
    id: input.id ?? (0, import_ulid.ulid)(),
    tps: input.tps,
    event: input.event,
    ...input.data && { data: input.data },
    ...input.indexes && { indexes: input.indexes }
  };
}
function computeV2RecordHash(entry, prev_hash) {
  const body = canonicalize({ entry, prev_hash });
  return sha256Hex(body);
}
function createV2Record(input, prev_hash) {
  const entry = createEntry(input);
  const hash = computeV2RecordHash(entry, prev_hash);
  return { entry, hash, prev_hash };
}
async function signV2Record(record, keys) {
  const sigBytes = await ed25519Sign(utf8ToBytes(record.hash), keys.privateKey);
  const sig = {
    alg: "ed25519",
    publicKeyHex: (0, import_utils2.bytesToHex)(keys.publicKey),
    sigHex: (0, import_utils2.bytesToHex)(sigBytes),
    kid: keys.kid
  };
  return { ...record, sig };
}
async function verifyV2RecordSignature(record) {
  if (!record.sig) return false;
  if (record.sig.alg !== "ed25519") return false;
  const { hexToBytes: hexToBytes2 } = await Promise.resolve().then(() => (init_crypto(), crypto_exports));
  const pub = hexToBytes2(record.sig.publicKeyHex);
  const sig = hexToBytes2(record.sig.sigHex);
  return ed25519Verify(sig, utf8ToBytes(record.hash), pub);
}
async function verifyV2Chain(records) {
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const expectedHash = computeV2RecordHash(r.entry, r.prev_hash);
    if (r.hash !== expectedHash) {
      return { ok: false, error: "hash-mismatch", index: i };
    }
    const expectedPrev = i === 0 ? null : records[i - 1].hash;
    if (r.prev_hash !== expectedPrev) {
      return { ok: false, error: "prev-hash-mismatch", index: i };
    }
    if (r.sig) {
      const ok = await verifyV2RecordSignature(r);
      if (!ok) return { ok: false, error: "bad-signature", index: i };
    }
  }
  return { ok: true };
}
function createPayload(input) {
  return {
    actor: input.actor,
    intent: input.intent,
    tps: input.tps,
    ts: input.ts ?? (/* @__PURE__ */ new Date()).toISOString(),
    nonce: input.nonce ?? (0, import_ulid.ulid)(),
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
    publicKeyHex: (0, import_utils2.bytesToHex)(keys.publicKey),
    sigHex: (0, import_utils2.bytesToHex)(sigBytes),
    kid: keys.kid
  };
  return { ...record, sig };
}
async function verifyRecordSignature(record) {
  if (!record.sig) return false;
  if (record.sig.alg !== "ed25519") return false;
  const { hexToBytes: hexToBytes2 } = await Promise.resolve().then(() => (init_crypto(), crypto_exports));
  const pub = hexToBytes2(record.sig.publicKeyHex);
  const sig = hexToBytes2(record.sig.sigHex);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  canonicalize,
  computeRecordHash,
  computeV2RecordHash,
  createEntry,
  createPayload,
  createRecord,
  createV2Record,
  ed25519Sign,
  ed25519Verify,
  generateEd25519Keypair,
  hexToBytes,
  randomBytes,
  sha256Hex,
  signRecord,
  signV2Record,
  utf8ToBytes,
  verifyChain,
  verifyRecordSignature,
  verifyV2Chain,
  verifyV2RecordSignature
});
//# sourceMappingURL=index.js.map