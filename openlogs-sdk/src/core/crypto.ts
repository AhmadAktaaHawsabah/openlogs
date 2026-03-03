import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase();
  if (clean.length % 2 !== 0) throw new Error('Invalid hex');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function utf8ToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function sha256Hex(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? utf8ToBytes(data) : data;
  return bytesToHex(sha256(bytes));
}

export function randomBytes(length: number): Uint8Array {
  const g = globalThis as any;
  if (g.crypto?.getRandomValues) {
    const out = new Uint8Array(length);
    g.crypto.getRandomValues(out);
    return out;
  }

  // Node fallback
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeCrypto = require('crypto') as typeof import('crypto');
  return new Uint8Array(nodeCrypto.randomBytes(length));
}

export async function generateEd25519Keypair(): Promise<{
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}> {
  const privateKey = randomBytes(32);
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  return { privateKey, publicKey };
}

export async function ed25519Sign(
  message: Uint8Array,
  privateKey: Uint8Array,
): Promise<Uint8Array> {
  return ed.signAsync(message, privateKey);
}

export async function ed25519Verify(
  sig: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array,
): Promise<boolean> {
  return ed.verifyAsync(sig, message, publicKey);
}
