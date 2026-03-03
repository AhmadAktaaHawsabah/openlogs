import { ulid } from "ulid";
import { canonicalize } from "./canonical";
import { bytesToHex } from "@noble/hashes/utils.js";

import {
  OpenLogsV2Entry,
  OpenLogsV2Record,
  VerifyResult,
  OpenLogsSignature,
  // Legacy v1 types (deprecated)
  OpenLogsPayload,
  OpenLogsRecord,
} from "./types";
import { ed25519Sign, ed25519Verify, sha256Hex, utf8ToBytes } from "./crypto";
import { normalizeTpsUri } from "./tps";

// =============================================================================
// OpenLogs v2.0 Functions
// =============================================================================

/**
 * Create an OpenLogs v2 entry
 * TPS is the primary key - time, location, actor are intrinsic to the TPS string.
 */
export function createEntry(input: {
  tps: string;
  event: string;
  data?: Record<string, unknown>;
  indexes?: Record<string, string>;
  id?: string;
}): OpenLogsV2Entry {
  return {
    spec: "openlogs.v2",
    id: input.id ?? ulid(),
    tps: normalizeTpsUri(input.tps),
    event: input.event,
    ...(input.data && { data: input.data }),
    ...(input.indexes && { indexes: input.indexes }),
  };
}

/**
 * Compute hash for a v2 record
 */
export function computeV2RecordHash(
  entry: OpenLogsV2Entry,
  prev_hash: string | null,
): string {
  const body = canonicalize({ entry, prev_hash });
  return sha256Hex(body);
}

/**
 * Create an OpenLogs v2 record with hash chain
 */
export function createV2Record(
  input: {
    tps: string;
    event: string;
    data?: Record<string, unknown>;
    indexes?: Record<string, string>;
    id?: string;
  },
  prev_hash: string | null,
): OpenLogsV2Record {
  const entry = createEntry(input);
  const hash = computeV2RecordHash(entry, prev_hash);
  return { entry, hash, prev_hash };
}

/**
 * Sign a v2 record
 */
export async function signV2Record(
  record: OpenLogsV2Record,
  keys: { privateKey: Uint8Array; publicKey: Uint8Array; kid?: string },
): Promise<OpenLogsV2Record> {
  const sigBytes = await ed25519Sign(utf8ToBytes(record.hash), keys.privateKey);
  const sig: OpenLogsSignature = {
    alg: "ed25519",
    publicKeyHex: bytesToHex(keys.publicKey),
    sigHex: bytesToHex(sigBytes),
    kid: keys.kid,
  };
  return { ...record, sig };
}

/**
 * Verify signature of a v2 record
 */
export async function verifyV2RecordSignature(
  record: OpenLogsV2Record,
): Promise<boolean> {
  if (!record.sig) return false;
  if (record.sig.alg !== "ed25519") return false;
  const { hexToBytes } = await import("./crypto");
  const pub = hexToBytes(record.sig.publicKeyHex);
  const sig = hexToBytes(record.sig.sigHex);
  return ed25519Verify(sig, utf8ToBytes(record.hash), pub);
}

/**
 * Verify a chain of v2 records
 */
export async function verifyV2Chain(
  records: OpenLogsV2Record[],
): Promise<VerifyResult> {
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

// =============================================================================
// Legacy v1 Functions (deprecated, kept for migration support)
// =============================================================================

/** @deprecated Use createEntry instead */
export function createPayload(
  input: Omit<OpenLogsPayload, "ts" | "nonce"> & {
    ts?: string;
    nonce?: string;
  },
): OpenLogsPayload {
  return {
    actor: input.actor,
    intent: input.intent,
    tps: input.tps,
    ts: input.ts ?? new Date().toISOString(),
    nonce: input.nonce ?? ulid(),
    location: input.location,
    data: input.data,
  };
}

/** @deprecated Use computeV2RecordHash instead */
export function computeRecordHash(
  payload: OpenLogsPayload,
  prevHash: string | null,
): string {
  const body = canonicalize({ v: 1, prevHash, payload });
  return sha256Hex(body);
}

/** @deprecated Use createV2Record instead */
export function createRecord(
  payloadInput: Omit<OpenLogsPayload, "ts" | "nonce"> & {
    ts?: string;
    nonce?: string;
  },
  prevHash: string | null,
): OpenLogsRecord {
  const payload = createPayload(payloadInput);
  const hash = computeRecordHash(payload, prevHash);
  return { v: 1, prevHash, payload, hash };
}

/** @deprecated Use signV2Record instead */
export async function signRecord(
  record: OpenLogsRecord,
  keys: { privateKey: Uint8Array; publicKey: Uint8Array; kid?: string },
): Promise<OpenLogsRecord> {
  const sigBytes = await ed25519Sign(utf8ToBytes(record.hash), keys.privateKey);
  const sig: OpenLogsSignature = {
    alg: "ed25519",
    publicKeyHex: bytesToHex(keys.publicKey),
    sigHex: bytesToHex(sigBytes),
    kid: keys.kid,
  };
  return { ...record, sig };
}

/** @deprecated Use verifyV2RecordSignature instead */
export async function verifyRecordSignature(
  record: OpenLogsRecord,
): Promise<boolean> {
  if (!record.sig) return false;
  if (record.sig.alg !== "ed25519") return false;
  const { hexToBytes } = await import("./crypto");
  const pub = hexToBytes(record.sig.publicKeyHex);
  const sig = hexToBytes(record.sig.sigHex);
  return ed25519Verify(sig, utf8ToBytes(record.hash), pub);
}

/** @deprecated Use verifyV2Chain instead */
export async function verifyChain(
  records: OpenLogsRecord[],
): Promise<VerifyResult> {
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
