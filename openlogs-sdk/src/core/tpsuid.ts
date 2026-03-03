import { TPSUID7RB } from "@nextera.one/tps-standard";
import { randomBytes } from "./crypto";
import { bytesToHex } from "@noble/hashes/utils.js";

/**
 * Generate a TPS-UID for OpenLogs entries.
 * Uses the TPS string as temporal part and adds random context.
 * Returns a reversible binary base64url encoded ID.
 *
 * @param tpsString The normalized TPS Reality String
 * @returns TPS-UID in binary base64url format
 */
export function generateTpsUid(tpsString: string): string {
  // Add random context (8 bytes of random data in the context part)
  const randomContext = bytesToHex(randomBytes(8));

  // Build extended TPS with random context
  // Format: tps://...@T:...?ctx=<random>
  const tpsWithContext = `${tpsString}?ctx=${randomContext}`;

  try {
    // Encode to reversible binary base64url form
    const uid = TPSUID7RB.encodeBinaryB64(tpsWithContext, { compress: true });
    return uid;
  } catch (err) {
    // Fallback: if TPS encoding fails, try with just the random context appended
    const fallbackUid = TPSUID7RB.encodeBinaryB64(
      `${tpsString}#${randomContext}`,
      { compress: true },
    );
    return fallbackUid;
  }
}

/**
 * Decode a TPS-UID back to its original TPS string with context.
 *
 * @param uid The TPS-UID in binary base64url format
 * @returns Object with decoded TPS string and context
 */
export function decodeTpsUid(uid: string): { tps: string; context?: string } {
  try {
    const decoded = TPSUID7RB.decodeBinaryB64(uid);

    if (!decoded.tps) {
      throw new Error("Failed to decode TPS-UID");
    }

    // Extract context from query string if present
    const ctxMatch = decoded.tps.match(/\?ctx=([a-f0-9]+)/);
    const context = ctxMatch ? ctxMatch[1] : undefined;

    // Clean TPS string (remove context query param)
    const tps = decoded.tps.replace(/\?ctx=[a-f0-9]+$/, "");

    return { tps, context };
  } catch (err: unknown) {
    throw new Error(
      `Failed to decode TPS-UID: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
