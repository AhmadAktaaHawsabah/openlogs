/**
 * OpenLogs SDK v1 Legacy Module
 * -----------------------------
 * Deprecated v1 types and functions extracted for migration support.
 * Import from '@nextera.one/openlogs-sdk/v1' for backward compatibility.
 *
 * @deprecated Use the main '@nextera.one/openlogs-sdk' (v2) API instead.
 */
export type {
  OpenLogsPayload,
  OpenLogsRecord,
  OpenLogsSignature,
  VerifyResult,
} from "./core/types";

export {
  createPayload,
  computeRecordHash,
  createRecord,
  signRecord,
  verifyRecordSignature,
  verifyChain,
} from "./core/chain";
