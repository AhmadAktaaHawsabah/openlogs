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

// src/keys.ts
var keys_exports = {};
__export(keys_exports, {
  KeyRegistry: () => KeyRegistry,
  extractSigningKeys: () => extractSigningKeys,
  groupBySigningKey: () => groupBySigningKey
});
module.exports = __toCommonJS(keys_exports);

// src/core/chain.ts
var import_utils3 = require("@noble/hashes/utils.js");
var import_ulid = require("ulid");

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
async function ed25519Verify(sig, message, publicKey) {
  return ed.verifyAsync(sig, message, publicKey);
}

// src/core/tps.ts
var import_tps_standard = require("@nextera.one/tps-standard");

// src/core/tpsuid.ts
var import_tps_standard2 = require("@nextera.one/tps-standard");
var import_utils2 = require("@noble/hashes/utils.js");

// src/core/chain.ts
async function verifyV2RecordSignature(record) {
  if (!record.sig) return false;
  if (record.sig.alg !== "ed25519") return false;
  const pub = hexToBytes(record.sig.publicKeyHex);
  const sig = hexToBytes(record.sig.sigHex);
  return ed25519Verify(sig, utf8ToBytes(record.hash), pub);
}

// src/keys.ts
var KeyRegistry = class {
  keys = /* @__PURE__ */ new Map();
  /**
   * Register a trusted signing key.
   */
  addKey(key) {
    if (!key.kid) throw new Error("Key must have a kid (key identifier)");
    if (!key.publicKeyHex) throw new Error("Key must have a publicKeyHex");
    this.keys.set(key.kid, key);
  }
  /**
   * Remove a key from the registry.
   */
  removeKey(kid) {
    return this.keys.delete(kid);
  }
  /**
   * Mark a key as revoked at a specific time.
   */
  revokeKey(kid, revokedAt) {
    const key = this.keys.get(kid);
    if (!key) throw new Error(`Key '${kid}' not found in registry`);
    key.revokedAt = revokedAt ?? (/* @__PURE__ */ new Date()).toISOString();
  }
  /**
   * Get a key by its identifier.
   */
  getKey(kid) {
    return this.keys.get(kid);
  }
  /**
   * Check if a key is currently trusted (registered and not revoked).
   */
  isTrusted(kid) {
    const key = this.keys.get(kid);
    if (!key) return false;
    return !key.revokedAt;
  }
  /**
   * List all registered keys.
   */
  listKeys() {
    return Array.from(this.keys.values());
  }
  /**
   * List only active (non-revoked) keys.
   */
  listActiveKeys() {
    return this.listKeys().filter((k) => !k.revokedAt);
  }
  /**
   * Verify a record's signature against the registry.
   * Returns true if the signature is valid AND the key is trusted.
   */
  async verifyRecord(record) {
    if (!record.sig) {
      return { valid: false, trusted: false };
    }
    const kid = record.sig.kid;
    const valid = await verifyV2RecordSignature(record);
    if (!valid) {
      return { valid: false, trusted: false, kid };
    }
    if (kid) {
      const trusted = this.isTrusted(kid);
      return { valid: true, trusted, kid };
    }
    const pubHex = record.sig.publicKeyHex;
    const matchingKey = this.listKeys().find((k) => k.publicKeyHex === pubHex);
    if (matchingKey) {
      return {
        valid: true,
        trusted: !matchingKey.revokedAt,
        kid: matchingKey.kid
      };
    }
    return { valid: true, trusted: false, kid };
  }
  /**
   * Verify all records in a chain against the registry.
   * Returns details about each record's signature status.
   */
  async verifyChainKeys(records) {
    const results = [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record.sig) {
        results.push({
          index: i,
          valid: true,
          trusted: false,
          unsigned: true
        });
      } else {
        const result = await this.verifyRecord(record);
        results.push({ index: i, ...result, unsigned: false });
      }
    }
    return results;
  }
};
function extractSigningKeys(records) {
  const seen = /* @__PURE__ */ new Set();
  const keys = [];
  for (const record of records) {
    if (!record.sig) continue;
    const identifier = record.sig.kid ?? record.sig.publicKeyHex;
    if (!seen.has(identifier)) {
      seen.add(identifier);
      keys.push({
        kid: record.sig.kid,
        publicKeyHex: record.sig.publicKeyHex
      });
    }
  }
  return keys;
}
function groupBySigningKey(records) {
  const groups = /* @__PURE__ */ new Map();
  for (const record of records) {
    const key = record.sig ? record.sig.kid ?? record.sig.publicKeyHex : "__unsigned__";
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }
  return groups;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KeyRegistry,
  extractSigningKeys,
  groupBySigningKey
});
//# sourceMappingURL=keys.js.map