/**
 * OpenLogs SDK v2.0 Types
 * -----------------------
 * v2 consolidates actor, time, and location into the TPS Reality String.
 */
type OpenLogsAlg = 'ed25519';
interface OpenLogsSignature {
    alg: OpenLogsAlg;
    publicKeyHex: string;
    sigHex: string;
    kid?: string;
}
/**
 * OpenLogs v2 Entry
 * TPS is the Primary Key - time, location, actor, and proof are intrinsic.
 */
interface OpenLogsV2Entry {
    /** Specification version */
    spec: 'openlogs.v2';
    /** Unique entry identifier (ULID) */
    id: string;
    /** TPS Reality String with intrinsic L:, A:, T:, and optional ! signature */
    tps: string;
    /** Event type (e.g., "door.unlock", "step.start", "anomaly.detected") */
    event: string;
    /** Optional event-specific payload */
    data?: Record<string, unknown>;
    /** Optional explicit indexes for querying (s2, h3, host, etc.) */
    indexes?: Record<string, string>;
}
/**
 * OpenLogs v2 Record (with hash chain)
 */
interface OpenLogsV2Record {
    /** The v2 entry */
    entry: OpenLogsV2Entry;
    /** Hash of this record for chain integrity */
    hash: string;
    /** Hash of previous record (null for first in chain) */
    prev_hash: string | null;
    /** Optional cryptographic signature */
    sig?: OpenLogsSignature;
}
interface VerifyResult {
    ok: boolean;
    error?: string;
    index?: number;
}
/** @deprecated Use OpenLogsV2Entry instead */
interface OpenLogsPayload {
    actor: string;
    intent: string;
    tps: string;
    ts: string;
    nonce: string;
    location?: unknown;
    data?: unknown;
}
/** @deprecated Use OpenLogsV2Record instead */
interface OpenLogsRecord {
    v: 1;
    prevHash: string | null;
    payload: OpenLogsPayload;
    hash: string;
    sig?: OpenLogsSignature;
}

declare function canonicalize(value: unknown): string;

declare function hexToBytes(hex: string): Uint8Array;
declare function utf8ToBytes(s: string): Uint8Array;
declare function sha256Hex(data: Uint8Array | string): string;
declare function randomBytes(length: number): Uint8Array;
declare function generateEd25519Keypair(): Promise<{
    privateKey: Uint8Array;
    publicKey: Uint8Array;
}>;
declare function ed25519Sign(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array>;
declare function ed25519Verify(sig: Uint8Array, message: Uint8Array, publicKey: Uint8Array): Promise<boolean>;

/**
 * Create an OpenLogs v2 entry
 * TPS is the primary key - time, location, actor are intrinsic to the TPS string.
 */
declare function createEntry(input: {
    tps: string;
    event: string;
    data?: Record<string, unknown>;
    indexes?: Record<string, string>;
    id?: string;
}): OpenLogsV2Entry;
/**
 * Compute hash for a v2 record
 */
declare function computeV2RecordHash(entry: OpenLogsV2Entry, prev_hash: string | null): string;
/**
 * Create an OpenLogs v2 record with hash chain
 */
declare function createV2Record(input: {
    tps: string;
    event: string;
    data?: Record<string, unknown>;
    indexes?: Record<string, string>;
    id?: string;
}, prev_hash: string | null): OpenLogsV2Record;
/**
 * Sign a v2 record
 */
declare function signV2Record(record: OpenLogsV2Record, keys: {
    privateKey: Uint8Array;
    publicKey: Uint8Array;
    kid?: string;
}): Promise<OpenLogsV2Record>;
/**
 * Verify signature of a v2 record
 */
declare function verifyV2RecordSignature(record: OpenLogsV2Record): Promise<boolean>;
/**
 * Verify a chain of v2 records
 */
declare function verifyV2Chain(records: OpenLogsV2Record[]): Promise<VerifyResult>;
/** @deprecated Use createEntry instead */
declare function createPayload(input: Omit<OpenLogsPayload, 'ts' | 'nonce'> & {
    ts?: string;
    nonce?: string;
}): OpenLogsPayload;
/** @deprecated Use computeV2RecordHash instead */
declare function computeRecordHash(payload: OpenLogsPayload, prevHash: string | null): string;
/** @deprecated Use createV2Record instead */
declare function createRecord(payloadInput: Omit<OpenLogsPayload, 'ts' | 'nonce'> & {
    ts?: string;
    nonce?: string;
}, prevHash: string | null): OpenLogsRecord;
/** @deprecated Use signV2Record instead */
declare function signRecord(record: OpenLogsRecord, keys: {
    privateKey: Uint8Array;
    publicKey: Uint8Array;
    kid?: string;
}): Promise<OpenLogsRecord>;
/** @deprecated Use verifyV2RecordSignature instead */
declare function verifyRecordSignature(record: OpenLogsRecord): Promise<boolean>;
/** @deprecated Use verifyV2Chain instead */
declare function verifyChain(records: OpenLogsRecord[]): Promise<VerifyResult>;

export { type OpenLogsAlg, type OpenLogsPayload, type OpenLogsRecord, type OpenLogsSignature, type OpenLogsV2Entry, type OpenLogsV2Record, type VerifyResult, canonicalize, computeRecordHash, computeV2RecordHash, createEntry, createPayload, createRecord, createV2Record, ed25519Sign, ed25519Verify, generateEd25519Keypair, hexToBytes, randomBytes, sha256Hex, signRecord, signV2Record, utf8ToBytes, verifyChain, verifyRecordSignature, verifyV2Chain, verifyV2RecordSignature };
