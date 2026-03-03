import {
  createEntry,
  createV2Record,
  signV2Record,
  verifyV2Chain,
  generateEd25519Keypair,
  generateTpsUid,
  decodeTpsUid,
  type OpenLogsV2Entry,
  type OpenLogsV2Record,
  type VerifyResult,
} from "@nextera.one/openlogs-sdk";

// ============================================================================
// Console Formatting Utilities
// ============================================================================

interface Colors {
  reset: string;
  bright: string;
  dim: string;
  green: string;
  yellow: string;
  cyan: string;
  blue: string;
  magenta: string;
}

const colors: Colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

function header(text: string): void {
  console.log(
    `\n${colors.bright}${colors.cyan}╔═══════════════════════════════════════╗${colors.reset}`,
  );
  console.log(
    `${colors.bright}${colors.cyan}║ ${text.padEnd(37)} ║${colors.reset}`,
  );
  console.log(
    `${colors.bright}${colors.cyan}╚═══════════════════════════════════════╝${colors.reset}\n`,
  );
}

function section(text: string): void {
  console.log(`${colors.bright}${colors.blue}→ ${text}${colors.reset}`);
}

function success(text: string): void {
  console.log(`${colors.green}✅ ${text}${colors.reset}`);
}

function info(label: string, value: unknown): void {
  console.log(`  ${colors.dim}${label}${colors.reset}: ${value}`);
}

function error(text: string): void {
  console.log(`${colors.bright}${colors.yellow}⚠️  ${text}${colors.reset}`);
}

function divider(): void {
  console.log(
    `${colors.dim}─────────────────────────────────────${colors.reset}`,
  );
}

function logJson(obj: unknown, indent: number = 2): void {
  console.log(JSON.stringify(obj, null, indent));
}

// ============================================================================
// Test Examples
// ============================================================================

async function runExamples(): Promise<void> {
  try {
    header("OpenLogs SDK v2.0 TypeScript Test Suite");

    // ───────────────────────────────────────────────────────────────────────
    // Example 1: Simple Entry Creation
    // ───────────────────────────────────────────────────────────────────────
    section("Example 1: Create a Simple Entry");
    const entry1: OpenLogsV2Entry = createEntry({
      actor: "user:alice",
      tps: "tps://L:40.7128,-74.0060@T:greg.m3.c1.y26.m3.d3.h16.m30.s0.m0",
      event: "auth.login",
      data: { method: "oauth2", provider: "google" },
    });
    success("Entry created");
    info("ID", entry1.id);
    info("Actor", entry1.actor);
    info("Event", entry1.event);
    info("Location", "NYC (40.7128, -74.0060)");
    divider();

    // ───────────────────────────────────────────────────────────────────────
    // Example 2: Record Chain
    // ───────────────────────────────────────────────────────────────────────
    section("Example 2: Build a Hash Chain (3 records)");
    const record1: OpenLogsV2Record = createV2Record(
      {
        actor: "system:audit",
        tps: "tps://L:35.6762,139.6503@T:greg.m3.c1.y26.m3.d3.h08.m0.s0.m0",
        event: "data.read",
        data: { query: "SELECT * FROM users", rows: 42 },
      },
      null,
    );
    success("Record 1 created");
    info("Hash", record1.hash.substring(0, 16) + "...");

    const record2: OpenLogsV2Record = createV2Record(
      {
        actor: "user:bob",
        tps: "tps://L:35.6762,139.6503@T:greg.m3.c1.y26.m3.d3.h08.m15.s30.m0",
        event: "file.upload",
        data: { filename: "report.pdf", size: 2048000 },
      },
      record1.hash,
    );
    success("Record 2 created (chained to Record 1)");
    info("Hash", record2.hash.substring(0, 16) + "...");
    info("Prev Hash", record2.prev_hash?.substring(0, 16) + "...");

    const record3: OpenLogsV2Record = createV2Record(
      {
        actor: "service:processor",
        tps: "tps://L:35.6762,139.6503@T:greg.m3.c1.y26.m3.d3.h08.m45.s15.m0",
        event: "job.complete",
        data: { jobId: "job-12345", status: "success", duration_ms: 3456 },
      },
      record2.hash,
    );
    success("Record 3 created (chained to Record 2)");
    info("Hash", record3.hash.substring(0, 16) + "...");
    divider();

    // ───────────────────────────────────────────────────────────────────────
    // Example 3: Sign Chain
    // ───────────────────────────────────────────────────────────────────────
    section("Example 3: Sign Chain with Ed25519");
    const keys = await generateEd25519Keypair();
    success("Keypair generated");
    info("Public Key", keys.publicKey.toString().substring(0, 20) + "...");

    const signed1: OpenLogsV2Record = await signV2Record(record1, {
      ...keys,
      kid: "boy:audit-key-2026",
    });
    success("Record 1 signed");
    info("Signature", signed1.sig?.sigHex.substring(0, 16) + "...");
    info("KID", signed1.sig?.kid);

    const signed2: OpenLogsV2Record = await signV2Record(record2, {
      ...keys,
      kid: "boy:audit-key-2026",
    });
    success("Record 2 signed");

    const signed3: OpenLogsV2Record = await signV2Record(record3, {
      ...keys,
      kid: "boy:audit-key-2026",
    });
    success("Record 3 signed");
    divider();

    // ───────────────────────────────────────────────────────────────────────
    // Example 4: Verify Chain Integrity
    // ───────────────────────────────────────────────────────────────────────
    section("Example 4: Verify Chain Integrity");
    const verifyResult: VerifyResult = await verifyV2Chain([
      signed1,
      signed2,
      signed3,
    ]);
    if (verifyResult.ok) {
      success("Chain verification passed");
      info("Records verified", "3");
      info("Hashes", "✓ Valid");
      info("Signatures", "✓ Valid");
    } else {
      error(
        `Verification failed: ${verifyResult.error} at index ${verifyResult.index}`,
      );
    }
    divider();

    // ───────────────────────────────────────────────────────────────────────
    // Example 5: With Spatial Indexes
    // ───────────────────────────────────────────────────────────────────────
    section("Example 5: Record with Geospatial Indexes");
    const geoRecord: OpenLogsV2Record = createV2Record(
      {
        actor: "device:iot-sensor-42",
        tps: "tps://L:37.7749,-122.4194@T:greg.m3.c1.y26.m3.d3.h14.m23.s45.m0",
        event: "sensor.reading",
        data: {
          temperature: 22.5,
          humidity: 65,
          pressure: 1013.25,
        },
        indexes: {
          s2: "89c28342d",
          h3: "8a283469d7fffff",
          region: "us-west-1",
        },
      },
      null,
    );
    success("Geo-indexed record created");
    info("Location", "San Francisco (37.7749, -122.4194)");
    info("S2 Cell", geoRecord.entry.indexes?.s2);
    info("H3 Cell", geoRecord.entry.indexes?.h3);
    divider();

    // ───────────────────────────────────────────────────────────────────────
    // Example 6: Multi-Calendar Support
    // ───────────────────────────────────────────────────────────────────────
    section("Example 6: Multi-Calendar TPS Strings");
    const gregorian: OpenLogsV2Entry = createEntry({
      actor: "system:admin",
      tps: "tps://L:51.5074,-0.1278@T:greg.m3.c1.y26.m3.d3.h12.m0.s0.m0",
      event: "config.update",
      data: { component: "auth", version: "2.1.4" },
    });
    success("Gregorian calendar entry");
    info("Calendar", "gregorian");

    const utc: OpenLogsV2Entry = createEntry({
      actor: "system:admin",
      tps: "tps://L:51.5074,-0.1278@T:unix.m1741020000",
      event: "config.update",
      data: { component: "auth", version: "2.1.4" },
    });
    success("Unix timestamp entry");
    info("Calendar", "unix");
    divider();

    // ───────────────────────────────────────────────────────────────────────
    // Example 7: TPS-UID Generation & Decoding
    // ───────────────────────────────────────────────────────────────────────
    section("Example 7: TPS-UID Generation & Decoding");
    const tpsString: string =
      "tps://L:40.7128,-74.0060@T:greg.m3.c1.y26.m3.d3.h14.m30.s0.m0";
    const tpsuid: string = generateTpsUid(tpsString);
    success("TPS-UID generated");
    info("TPS Input", tpsString.substring(0, 45) + "...");
    info("TPS-UID", tpsuid.substring(0, 50) + "...");
    info("Full length", tpsuid.length + " chars");

    const decoded = decodeTpsUid(tpsuid);
    success("TPS-UID decoded");
    info("Recovered TPS", decoded.tps.substring(0, 45) + "...");
    info("Context", decoded.context);
    info("Match", decoded.tps === tpsString ? "✓ Yes" : "✗ No");
    divider();

    // ───────────────────────────────────────────────────────────────────────
    // Example 8: Detailed Record Structure
    // ───────────────────────────────────────────────────────────────────────
    section("Example 8: Complete Record Structure");
    console.log(colors.dim + "Full v2 Record JSON:" + colors.reset);
    logJson(signed1, 2);
    divider();

    // ───────────────────────────────────────────────────────────────────────
    // Summary
    // ───────────────────────────────────────────────────────────────────────
    header("Test Summary");
    console.log(
      `${colors.bright}${colors.green}✅ All 8 examples executed successfully${colors.reset}`,
    );
    console.log(
      `
${colors.dim}Key Takeaways:${colors.reset}
  • OpenLogs v2 uses ${colors.bright}TPS-UID${colors.reset} as globally unique identifiers
  • Each ID encodes temporal (TPS) and random context for uniqueness
  • TPS-UIDs are ${colors.bright}reversible${colors.reset} — decode to recover original TPS
  • Records linked via SHA256 hash chains for tamper evidence
  • Ed25519 signatures add cryptographic proof per record
  • Spatial indexes (S2, H3) enable geo-querying
  • Multi-calendar support for flexible time representation
  • Actor field is ${colors.bright}mandatory${colors.reset} — identifies event producer
  `,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    error(`Test failed: ${message}`);
    if (err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// ============================================================================
// Main
// ============================================================================

runExamples().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  error(`Unexpected error: ${message}`);
  process.exit(1);
});
