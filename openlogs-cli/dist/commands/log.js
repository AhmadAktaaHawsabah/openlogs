"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const openlogs_sdk_1 = require("@nextera.one/openlogs-sdk");
const fsutil_1 = require("./fsutil");
function hexToBytes(hex) {
    return Uint8Array.from(Buffer.from(hex, "hex"));
}
exports.logCommand = new commander_1.Command("log")
    .description("Append a new OpenLogs v2 record to a JSONL file")
    .requiredOption("-a, --actor <actor>", "Actor identifier (e.g., user:alice, system:cron, device:sensor-1)")
    .requiredOption("-t, --tps <tps>", "TPS Reality String (e.g., tps://L:bldg=hq@T:greg.y26.M01)")
    .requiredOption("-e, --event <event>", "Event type (e.g., door.unlock, step.start)")
    .option("-d, --data <json>", "JSON payload string", "{}")
    .option("-x, --indexes <json>", 'JSON indexes for querying (e.g., {"s2":"88d9b4"})')
    .option("-f, --file <path>", "Output JSONL file", "./openlogs.jsonl")
    .option("-k, --key <path>", "Identity JSON path (for signing)", "./.openlogs/identity.json")
    .option("--unsigned", "Do not sign (even if key is available)")
    .action(async (options) => {
    const filePath = String(options.file);
    // Read previous hash from chain
    let prev_hash = null;
    try {
        const rows = (0, fsutil_1.readJsonLines)(filePath);
        const last = rows[rows.length - 1];
        prev_hash = last?.hash ?? null;
    }
    catch {
        prev_hash = null;
    }
    // Parse data payload
    let data;
    try {
        const parsed = options.data
            ? JSON.parse(String(options.data))
            : undefined;
        if (parsed && Object.keys(parsed).length > 0) {
            data = parsed;
        }
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`Invalid --data JSON: ${msg}`);
    }
    // Parse indexes
    let indexes;
    if (options.indexes) {
        try {
            indexes = JSON.parse(String(options.indexes));
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new Error(`Invalid --indexes JSON: ${msg}`);
        }
    }
    // Create v2 record
    const record = (0, openlogs_sdk_1.createV2Record)({
        actor: String(options.actor),
        tps: String(options.tps),
        event: String(options.event),
        data,
        indexes,
    }, prev_hash);
    let out = record;
    // Sign if key available
    const wantUnsigned = Boolean(options.unsigned);
    if (!wantUnsigned) {
        try {
            const id = (0, fsutil_1.readJsonFile)(String(options.key));
            out = await (0, openlogs_sdk_1.signV2Record)(record, {
                privateKey: hexToBytes(id.privateKeyHex),
                publicKey: hexToBytes(id.publicKeyHex),
                kid: id.kid,
            });
        }
        catch {
            // Keep unsigned if key missing
        }
    }
    (0, fsutil_1.appendJsonLine)(filePath, out);
    console.log(chalk_1.default.green("✅ Logged (OpenLogs v2)"));
    console.log(`id:    ${out.entry.id}`);
    console.log(`event: ${out.entry.event}`);
    console.log(`hash:  ${out.hash}`);
});
