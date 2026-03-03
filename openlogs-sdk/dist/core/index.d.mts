export { O as OpenLogsAlg, a as OpenLogsPayload, b as OpenLogsRecord, c as OpenLogsSignature, d as OpenLogsV2Entry, e as OpenLogsV2Record, V as VerifyResult } from '../types-CyUveAII.mjs';
export { c as computeRecordHash, a as computeV2RecordHash, b as createEntry, d as createPayload, e as createRecord, f as createV2Chain, g as createV2Record, s as signRecord, h as signV2Record, v as verifyChain, i as verifyRecordSignature, j as verifyV2Chain, k as verifyV2RecordSignature } from '../v1-DQuM2euz.mjs';

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

declare function normalizeTpsUri(input: string): string;

/**
 * Generate a TPS-UID for OpenLogs entries.
 * Uses the TPS string as temporal part and adds random context.
 * Returns a reversible binary base64url encoded ID.
 *
 * @param tpsString The normalized TPS Reality String
 * @returns TPS-UID in binary base64url format
 */
declare function generateTpsUid(tpsString: string): string;
/**
 * Decode a TPS-UID back to its original TPS string with context.
 *
 * @param uid The TPS-UID in binary base64url format
 * @returns Object with decoded TPS string and context
 */
declare function decodeTpsUid(uid: string): {
    tps: string;
    context?: string;
};

export { canonicalize, decodeTpsUid, ed25519Sign, ed25519Verify, generateEd25519Keypair, generateTpsUid, hexToBytes, normalizeTpsUri, randomBytes, sha256Hex, utf8ToBytes };
