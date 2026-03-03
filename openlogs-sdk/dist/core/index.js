"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/core/index.ts
var core_exports = {};
__export(core_exports, {
  canonicalize: () => canonicalize,
  computeRecordHash: () => computeRecordHash,
  computeV2RecordHash: () => computeV2RecordHash,
  createEntry: () => createEntry,
  createPayload: () => createPayload,
  createRecord: () => createRecord,
  createV2Chain: () => createV2Chain,
  createV2Record: () => createV2Record,
  decodeTpsUid: () => decodeTpsUid,
  ed25519Sign: () => ed25519Sign,
  ed25519Verify: () => ed25519Verify,
  generateEd25519Keypair: () => generateEd25519Keypair,
  generateTpsUid: () => generateTpsUid,
  hexToBytes: () => hexToBytes,
  normalizeTpsUri: () => normalizeTpsUri,
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
module.exports = __toCommonJS(core_exports);

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

// src/core/crypto.ts
var ed = __toESM(require("@noble/ed25519"));
var import_sha2 = require("@noble/hashes/sha2.js");
var import_utils = require("@noble/hashes/utils.js");
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
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const out = new Uint8Array(length);
    globalThis.crypto.getRandomValues(out);
    return out;
  }
  try {
    const nodeCrypto = require("crypto");
    return new Uint8Array(nodeCrypto.randomBytes(length));
  } catch {
    throw new Error(
      "No cryptographic random source available. Use Node.js >= 19 or a browser with Web Crypto API."
    );
  }
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

// src/core/chain.ts
var import_utils3 = require("@noble/hashes/utils.js");
var import_ulid = require("ulid");

// src/core/tps.ts
var import_tps_standard = require("@nextera.one/tps-standard");
function normalizeTpsUri(input) {
  const tps = input?.trim();
  if (!tps) {
    throw new Error("TPS URI is required");
  }
  try {
    const parsed = import_tps_standard.TPS.parse(tps);
    if (typeof parsed === "string") {
      return parsed;
    }
    if (parsed && typeof parsed === "object") {
      const p = parsed;
      if (typeof p.uri === "string") return p.uri;
      if (typeof p.tps === "string") return p.tps;
      return import_tps_standard.TPS.toURI(parsed);
    }
    throw new Error("Unsupported TPS parse output");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid TPS URI: ${message}`);
  }
}

// src/core/tpsuid.ts
var import_tps_standard2 = require("@nextera.one/tps-standard");
var import_utils2 = require("@noble/hashes/utils.js");
function generateTpsUid(tpsString) {
  const randomContext = (0, import_utils2.bytesToHex)(randomBytes(8));
  const tpsWithContext = `${tpsString}?ctx=${randomContext}`;
  try {
    const uid = import_tps_standard2.TPSUID7RB.encodeBinaryB64(tpsWithContext, { compress: true });
    return uid;
  } catch (err) {
    const fallbackUid = import_tps_standard2.TPSUID7RB.encodeBinaryB64(
      `${tpsString}#${randomContext}`,
      { compress: true }
    );
    return fallbackUid;
  }
}
function decodeTpsUid(uid) {
  try {
    const decoded = import_tps_standard2.TPSUID7RB.decodeBinaryB64(uid);
    if (!decoded.tps) {
      throw new Error("Failed to decode TPS-UID");
    }
    const ctxMatch = decoded.tps.match(/\?ctx=([a-f0-9]+)/);
    const context = ctxMatch ? ctxMatch[1] : void 0;
    const tps = decoded.tps.replace(/\?ctx=[a-f0-9]+$/, "");
    return { tps, context };
  } catch (err) {
    throw new Error(
      `Failed to decode TPS-UID: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// src/core/chain.ts
function createEntry(input) {
  if (!input.actor || input.actor.trim().length === 0) {
    throw new Error(
      'actor is required (e.g., "user:alice", "system:cron", "device:sensor-1")'
    );
  }
  const normalizedTps = normalizeTpsUri(input.tps);
  return {
    spec: "openlogs.v2",
    id: input.id ?? generateTpsUid(normalizedTps),
    actor: input.actor.trim(),
    tps: normalizedTps,
    event: input.event,
    ...input.data && { data: input.data },
    ...input.indexes && { indexes: input.indexes }
  };
}
function computeV2RecordHash(entry, prev_hash) {
  if (!entry || typeof entry !== "object" || entry.spec !== "openlogs.v2") {
    throw new Error(
      "computeV2RecordHash requires a valid OpenLogsV2Entry with spec 'openlogs.v2'"
    );
  }
  if (prev_hash !== null && typeof prev_hash !== "string") {
    throw new Error("prev_hash must be a string or null");
  }
  const body = canonicalize({ entry, prev_hash });
  return sha256Hex(body);
}
function createV2Record(input, prev_hash) {
  const entry = createEntry(input);
  const hash = computeV2RecordHash(entry, prev_hash);
  return { entry, hash, prev_hash };
}
async function signV2Record(record, keys) {
  if (!record || !record.hash) {
    throw new Error("signV2Record requires a record with a valid hash");
  }
  if (!(keys.privateKey instanceof Uint8Array) || keys.privateKey.length !== 32) {
    throw new Error("privateKey must be a 32-byte Uint8Array");
  }
  if (!(keys.publicKey instanceof Uint8Array) || keys.publicKey.length !== 32) {
    throw new Error("publicKey must be a 32-byte Uint8Array");
  }
  const sigBytes = await ed25519Sign(utf8ToBytes(record.hash), keys.privateKey);
  const sig = {
    alg: "ed25519",
    publicKeyHex: (0, import_utils3.bytesToHex)(keys.publicKey),
    sigHex: (0, import_utils3.bytesToHex)(sigBytes),
    kid: keys.kid
  };
  return { ...record, sig };
}
async function verifyV2RecordSignature(record) {
  if (!record.sig) return false;
  if (record.sig.alg !== "ed25519") return false;
  const pub = hexToBytes(record.sig.publicKeyHex);
  const sig = hexToBytes(record.sig.sigHex);
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
function createV2Chain(inputs) {
  if (!inputs || inputs.length === 0) {
    throw new Error("createV2Chain requires at least one input");
  }
  const records = [];
  let prev_hash = null;
  for (const input of inputs) {
    const record = createV2Record(input, prev_hash);
    records.push(record);
    prev_hash = record.hash;
  }
  return records;
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
    publicKeyHex: (0, import_utils3.bytesToHex)(keys.publicKey),
    sigHex: (0, import_utils3.bytesToHex)(sigBytes),
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  canonicalize,
  computeRecordHash,
  computeV2RecordHash,
  createEntry,
  createPayload,
  createRecord,
  createV2Chain,
  createV2Record,
  decodeTpsUid,
  ed25519Sign,
  ed25519Verify,
  generateEd25519Keypair,
  generateTpsUid,
  hexToBytes,
  normalizeTpsUri,
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