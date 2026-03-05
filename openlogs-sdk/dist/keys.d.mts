import { e as OpenLogsV2Record } from './types-CyUveAII.mjs';

/**
 * OpenLogs SDK - Key Rotation Helpers
 * ------------------------------------
 * Utilities for managing multi-key scenarios and key rotation in signed chains.
 */

/**
 * Represents a known signing key with metadata.
 */
interface SigningKeyInfo {
    /** Key identifier (matches sig.kid) */
    kid: string;
    /** Public key hex */
    publicKeyHex: string;
    /** When this key became active */
    activeFrom?: string;
    /** When this key was revoked (if ever) */
    revokedAt?: string;
    /** Optional description */
    description?: string;
}
/**
 * A key registry for managing trusted signing keys.
 */
declare class KeyRegistry {
    private keys;
    /**
     * Register a trusted signing key.
     */
    addKey(key: SigningKeyInfo): void;
    /**
     * Remove a key from the registry.
     */
    removeKey(kid: string): boolean;
    /**
     * Mark a key as revoked at a specific time.
     */
    revokeKey(kid: string, revokedAt?: string): void;
    /**
     * Get a key by its identifier.
     */
    getKey(kid: string): SigningKeyInfo | undefined;
    /**
     * Check if a key is currently trusted (registered and not revoked).
     */
    isTrusted(kid: string): boolean;
    /**
     * List all registered keys.
     */
    listKeys(): SigningKeyInfo[];
    /**
     * List only active (non-revoked) keys.
     */
    listActiveKeys(): SigningKeyInfo[];
    /**
     * Verify a record's signature against the registry.
     * Returns true if the signature is valid AND the key is trusted.
     */
    verifyRecord(record: OpenLogsV2Record): Promise<{
        valid: boolean;
        trusted: boolean;
        kid?: string;
    }>;
    /**
     * Verify all records in a chain against the registry.
     * Returns details about each record's signature status.
     */
    verifyChainKeys(records: OpenLogsV2Record[]): Promise<Array<{
        index: number;
        valid: boolean;
        trusted: boolean;
        kid?: string;
        unsigned: boolean;
    }>>;
}
/**
 * Extract unique signing key identifiers from a chain of records.
 */
declare function extractSigningKeys(records: OpenLogsV2Record[]): Array<{
    kid?: string;
    publicKeyHex: string;
}>;
/**
 * Group records by their signing key.
 */
declare function groupBySigningKey(records: OpenLogsV2Record[]): Map<string, OpenLogsV2Record[]>;

export { KeyRegistry, type SigningKeyInfo, extractSigningKeys, groupBySigningKey };
