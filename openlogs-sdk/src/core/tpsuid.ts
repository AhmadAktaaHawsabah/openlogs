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

  // Build extended TPS with random context using v0.6.0 context fragment
  // Format: tps://...@T:...#C:ctx=<random> OR ;ctx=<random> if #C: already exists
  const suffix = tpsString.includes("#C:")
    ? `;ctx=${randomContext}`
    : `#C:ctx=${randomContext}`;
  const tpsWithContext = `${tpsString}${suffix}`;

  try {
    // Encode to reversible binary base64url form
    const uid = TPSUID7RB.encodeBinaryB64(tpsWithContext, { compress: true });
    return uid;
  } catch (err) {
    // Fallback: if compression fails, try without compression (rare, but possible)
    const fallbackUid = TPSUID7RB.encodeBinaryB64(tpsWithContext, {
      compress: false,
    });
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

    // Extract context: could be ;ctx= (appended to existing #C:), #C:ctx=, or legacy ?ctx=
    let context: string | undefined;
    const ctxMatch =
      decoded.tps.match(/(?:#C:|;)ctx=([a-f0-9]+)/) ||
      decoded.tps.match(/\?ctx=([a-f0-9]+)/);
    if (ctxMatch) {
      context = ctxMatch[1];
    }

    // Clean TPS string
    let tps = decoded.tps;
    tps = tps.replace(/;ctx=[a-f0-9]+$/, ""); // if appended to existing #C:
    tps = tps.replace(/#C:ctx=[a-f0-9]+$/, ""); // if it was the only context
    tps = tps.replace(/\?ctx=[a-f0-9]+$/, ""); // legacy

    return { tps, context };
  } catch (err: unknown) {
    throw new Error(
      `Failed to decode TPS-UID: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
