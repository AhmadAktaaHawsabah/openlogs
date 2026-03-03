/**
 * OpenLogs SDK - Key Rotation Helpers
 * ------------------------------------
 * Utilities for managing multi-key scenarios and key rotation in signed chains.
 */

import type { OpenLogsV2Record, OpenLogsSignature } from "./core/types";
import { verifyV2RecordSignature } from "./core/chain";

/**
 * Represents a known signing key with metadata.
 */
export interface SigningKeyInfo {
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
export class KeyRegistry {
  private keys: Map<string, SigningKeyInfo> = new Map();

  /**
   * Register a trusted signing key.
   */
  addKey(key: SigningKeyInfo): void {
    if (!key.kid) throw new Error("Key must have a kid (key identifier)");
    if (!key.publicKeyHex) throw new Error("Key must have a publicKeyHex");
    this.keys.set(key.kid, key);
  }

  /**
   * Remove a key from the registry.
   */
  removeKey(kid: string): boolean {
    return this.keys.delete(kid);
  }

  /**
   * Mark a key as revoked at a specific time.
   */
  revokeKey(kid: string, revokedAt?: string): void {
    const key = this.keys.get(kid);
    if (!key) throw new Error(`Key '${kid}' not found in registry`);
    key.revokedAt = revokedAt ?? new Date().toISOString();
  }

  /**
   * Get a key by its identifier.
   */
  getKey(kid: string): SigningKeyInfo | undefined {
    return this.keys.get(kid);
  }

  /**
   * Check if a key is currently trusted (registered and not revoked).
   */
  isTrusted(kid: string): boolean {
    const key = this.keys.get(kid);
    if (!key) return false;
    return !key.revokedAt;
  }

  /**
   * List all registered keys.
   */
  listKeys(): SigningKeyInfo[] {
    return Array.from(this.keys.values());
  }

  /**
   * List only active (non-revoked) keys.
   */
  listActiveKeys(): SigningKeyInfo[] {
    return this.listKeys().filter((k) => !k.revokedAt);
  }

  /**
   * Verify a record's signature against the registry.
   * Returns true if the signature is valid AND the key is trusted.
   */
  async verifyRecord(
    record: OpenLogsV2Record,
  ): Promise<{ valid: boolean; trusted: boolean; kid?: string }> {
    if (!record.sig) {
      return { valid: false, trusted: false };
    }

    const kid = record.sig.kid;
    const valid = await verifyV2RecordSignature(record);

    if (!valid) {
      return { valid: false, trusted: false, kid };
    }

    // Check if the signing key is in our registry and trusted
    if (kid) {
      const trusted = this.isTrusted(kid);
      return { valid: true, trusted, kid };
    }

    // If no kid, check by publicKeyHex
    const pubHex = record.sig.publicKeyHex;
    const matchingKey = this.listKeys().find((k) => k.publicKeyHex === pubHex);
    if (matchingKey) {
      return {
        valid: true,
        trusted: !matchingKey.revokedAt,
        kid: matchingKey.kid,
      };
    }

    return { valid: true, trusted: false, kid };
  }

  /**
   * Verify all records in a chain against the registry.
   * Returns details about each record's signature status.
   */
  async verifyChainKeys(records: OpenLogsV2Record[]): Promise<
    Array<{
      index: number;
      valid: boolean;
      trusted: boolean;
      kid?: string;
      unsigned: boolean;
    }>
  > {
    const results = [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record.sig) {
        results.push({
          index: i,
          valid: true,
          trusted: false,
          unsigned: true,
        });
      } else {
        const result = await this.verifyRecord(record);
        results.push({ index: i, ...result, unsigned: false });
      }
    }
    return results;
  }
}

/**
 * Extract unique signing key identifiers from a chain of records.
 */
export function extractSigningKeys(
  records: OpenLogsV2Record[],
): Array<{ kid?: string; publicKeyHex: string }> {
  const seen = new Set<string>();
  const keys: Array<{ kid?: string; publicKeyHex: string }> = [];

  for (const record of records) {
    if (!record.sig) continue;
    const identifier = record.sig.kid ?? record.sig.publicKeyHex;
    if (!seen.has(identifier)) {
      seen.add(identifier);
      keys.push({
        kid: record.sig.kid,
        publicKeyHex: record.sig.publicKeyHex,
      });
    }
  }

  return keys;
}

/**
 * Group records by their signing key.
 */
export function groupBySigningKey(
  records: OpenLogsV2Record[],
): Map<string, OpenLogsV2Record[]> {
  const groups = new Map<string, OpenLogsV2Record[]>();

  for (const record of records) {
    const key = record.sig
      ? (record.sig.kid ?? record.sig.publicKeyHex)
      : "__unsigned__";
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }

  return groups;
}
