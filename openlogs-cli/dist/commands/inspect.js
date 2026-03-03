"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fsutil_1 = require("./fsutil");
exports.inspectCommand = new commander_1.Command("inspect")
    .description("Inspect an OpenLogs JSONL file")
    .option("-f, --file <path>", "Input JSONL file", "./openlogs.jsonl")
    .option("--last", "Show only the last record")
    .option("-n, --count <n>", "Show last N records")
    .option("--format <format>", "Output format: json (default), compact, or table", "json")
    .action(async (options) => {
    const rows = (0, fsutil_1.readJsonLines)(String(options.file));
    if (!rows.length) {
        console.log(chalk_1.default.yellow("No records"));
        return;
    }
    let out = rows;
    if (options.last) {
        out = [rows[rows.length - 1]];
    }
    else if (options.count) {
        const n = Math.min(parseInt(String(options.count), 10), rows.length);
        out = rows.slice(-n);
    }
    const format = String(options.format).toLowerCase();
    switch (format) {
        case "table":
            printTable(out);
            break;
        case "compact":
            printCompact(out);
            break;
        case "json":
        default:
            console.log(JSON.stringify(out, null, 2));
            break;
    }
});
function printCompact(rows) {
    for (const row of rows) {
        if (row.entry?.spec === "openlogs.v2") {
            const e = row.entry;
            const sig = row.sig ? chalk_1.default.green(" ✓signed") : chalk_1.default.dim(" unsigned");
            console.log(`${chalk_1.default.cyan(e.id.substring(0, 12))}… ` +
                `${chalk_1.default.bold(e.event)} ` +
                `${chalk_1.default.dim("by")} ${e.actor} ` +
                `${chalk_1.default.dim("hash:")}${row.hash.substring(0, 8)}…` +
                sig);
        }
        else {
            // v1 fallback
            const p = row.payload;
            console.log(`${chalk_1.default.bold(p?.intent)} ` +
                `${chalk_1.default.dim("by")} ${p?.actor} ` +
                `${chalk_1.default.dim("hash:")}${row.hash?.substring(0, 8)}…`);
        }
    }
}
function printTable(rows) {
    if (!rows.length)
        return;
    const isV2 = rows[0].entry?.spec === "openlogs.v2";
    if (isV2) {
        // Table header
        console.log(chalk_1.default.bold(padRight("ID", 14) +
            padRight("EVENT", 20) +
            padRight("ACTOR", 22) +
            padRight("HASH", 12) +
            "SIGNED"));
        console.log("─".repeat(74));
        for (const row of rows) {
            const e = row.entry;
            console.log(padRight(e.id.substring(0, 12) + "…", 14) +
                padRight(e.event, 20) +
                padRight(e.actor, 22) +
                padRight(row.hash.substring(0, 10) + "…", 12) +
                (row.sig ? chalk_1.default.green("✓") : chalk_1.default.dim("✗")));
        }
    }
    else {
        console.log(chalk_1.default.bold(padRight("INTENT", 20) + padRight("ACTOR", 22) + padRight("HASH", 12)));
        console.log("─".repeat(54));
        for (const row of rows) {
            const p = row.payload;
            console.log(padRight(p?.intent ?? "", 20) +
                padRight(p?.actor ?? "", 22) +
                padRight((row.hash ?? "").substring(0, 10) + "…", 12));
        }
    }
    console.log(chalk_1.default.dim(`\n${rows.length} record(s)`));
}
function padRight(str, len) {
    if (str.length >= len)
        return str.substring(0, len - 1) + " ";
    return str + " ".repeat(len - str.length);
}
