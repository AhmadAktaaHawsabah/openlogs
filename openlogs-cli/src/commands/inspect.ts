import { Command } from "commander";
import chalk from "chalk";

import { readJsonLines } from "./fsutil";

export const inspectCommand = new Command("inspect")
  .description("Inspect an OpenLogs JSONL file")
  .option("-f, --file <path>", "Input JSONL file", "./openlogs.jsonl")
  .option("--last", "Show only the last record")
  .option("-n, --count <n>", "Show last N records")
  .option(
    "--format <format>",
    "Output format: json (default), compact, or table",
    "json",
  )
  .action(async (options) => {
    const rows = readJsonLines(String(options.file));
    if (!rows.length) {
      console.log(chalk.yellow("No records"));
      return;
    }

    let out = rows;
    if (options.last) {
      out = [rows[rows.length - 1]];
    } else if (options.count) {
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

function printCompact(rows: any[]): void {
  for (const row of rows) {
    if (row.entry?.spec === "openlogs.v2") {
      const e = row.entry;
      const sig = row.sig ? chalk.green(" ✓signed") : chalk.dim(" unsigned");
      console.log(
        `${chalk.cyan(e.id.substring(0, 12))}… ` +
          `${chalk.bold(e.event)} ` +
          `${chalk.dim("by")} ${e.actor} ` +
          `${chalk.dim("hash:")}${row.hash.substring(0, 8)}…` +
          sig,
      );
    } else {
      // v1 fallback
      const p = row.payload;
      console.log(
        `${chalk.bold(p?.intent)} ` +
          `${chalk.dim("by")} ${p?.actor} ` +
          `${chalk.dim("hash:")}${row.hash?.substring(0, 8)}…`,
      );
    }
  }
}

function printTable(rows: any[]): void {
  if (!rows.length) return;

  const isV2 = rows[0].entry?.spec === "openlogs.v2";

  if (isV2) {
    // Table header
    console.log(
      chalk.bold(
        padRight("ID", 14) +
          padRight("EVENT", 20) +
          padRight("ACTOR", 22) +
          padRight("HASH", 12) +
          "SIGNED",
      ),
    );
    console.log("─".repeat(74));

    for (const row of rows) {
      const e = row.entry;
      console.log(
        padRight(e.id.substring(0, 12) + "…", 14) +
          padRight(e.event, 20) +
          padRight(e.actor, 22) +
          padRight(row.hash.substring(0, 10) + "…", 12) +
          (row.sig ? chalk.green("✓") : chalk.dim("✗")),
      );
    }
  } else {
    console.log(
      chalk.bold(
        padRight("INTENT", 20) + padRight("ACTOR", 22) + padRight("HASH", 12),
      ),
    );
    console.log("─".repeat(54));

    for (const row of rows) {
      const p = row.payload;
      console.log(
        padRight(p?.intent ?? "", 20) +
          padRight(p?.actor ?? "", 22) +
          padRight((row.hash ?? "").substring(0, 10) + "…", 12),
      );
    }
  }

  console.log(chalk.dim(`\n${rows.length} record(s)`));
}

function padRight(str: string, len: number): string {
  if (str.length >= len) return str.substring(0, len - 1) + " ";
  return str + " ".repeat(len - str.length);
}
