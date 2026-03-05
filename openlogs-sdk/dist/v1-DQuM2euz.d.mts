import { a as OpenLogsPayload, d as OpenLogsV2Entry, b as OpenLogsRecord, e as OpenLogsV2Record, V as VerifyResult } from './types-CyUveAII.mjs';

/**
 * Create an OpenLogs v2 entry
 * TPS is the primary key - time, location, calendar are intrinsic.
 * Actor is mandatory - identifies the entity responsible for the event.
 * ID is a TPS-UID with random context encoded to binary.
 */
declare function createEntry(input: {
    actor: string;
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
 * Requires actor, tps, and event at minimum.
 */
declare function createV2Record(input: {
    actor: string;
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
/**
 * Create a batch of chained v2 records from an array of inputs.
 * Each record is automatically linked to the previous one.
 */
declare function createV2Chain(inputs: Array<{
    actor: string;
    tps: string;
    event: string;
    data?: Record<string, unknown>;
    indexes?: Record<string, string>;
    id?: string;
}>): OpenLogsV2Record[];
/** @deprecated Use createEntry instead */
declare function createPayload(input: Omit<OpenLogsPayload, "ts" | "nonce"> & {
    ts?: string;
    nonce?: string;
}): OpenLogsPayload;
/** @deprecated Use computeV2RecordHash instead */
declare function computeRecordHash(payload: OpenLogsPayload, prevHash: string | null): string;
/** @deprecated Use createV2Record instead */
declare function createRecord(payloadInput: Omit<OpenLogsPayload, "ts" | "nonce"> & {
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

export { computeV2RecordHash as a, createEntry as b, computeRecordHash as c, createPayload as d, createRecord as e, createV2Chain as f, createV2Record as g, signV2Record as h, verifyRecordSignature as i, verifyV2Chain as j, verifyV2RecordSignature as k, signRecord as s, verifyChain as v };
