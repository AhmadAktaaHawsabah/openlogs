import { Command } from "commander";
import chalk from "chalk";

import { readJsonLines } from "./fsutil";

export const exportCommand = new Command("export")
  .description("Export OpenLogs records as JSON array or CSV")
  .option("-f, --file <path>", "Input JSONL file", "./openlogs.jsonl")
  .option("--format <format>", "Output format: json or csv", "json")
  .option(
    "--fields <fields>",
    "Comma-separated fields to include (e.g., entry.id,entry.event,hash)",
  )
  .action(async (options) => {
    const rows = readJsonLines(String(options.file));
    if (!rows.length) {
      console.log(chalk.yellow("No records"));
      return;
    }

    const format = String(options.format).toLowerCase();

    if (format === "csv") {
      exportCsv(
        rows,
        options.fields ? String(options.fields).split(",") : null,
      );
    } else {
      exportJson(rows);
    }
  });

function exportJson(rows: any[]): void {
  console.log(JSON.stringify(rows, null, 2));
}

function getNestedValue(obj: any, path: string): string {
  const parts = path.trim().split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null) return "";
    current = current[part];
  }
  if (current == null) return "";
  if (typeof current === "object") return JSON.stringify(current);
  return String(current);
}

function exportCsv(rows: any[], fields: string[] | null): void {
  // Auto-detect fields from first record if not specified
  const resolvedFields = fields ?? detectFields(rows[0]);

  // Print header
  console.log(resolvedFields.join(","));

  // Print rows
  for (const row of rows) {
    const values = resolvedFields.map((field) => {
      const val = getNestedValue(row, field);
      // Escape CSV values that contain commas or quotes
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    console.log(values.join(","));
  }
}

function detectFields(record: any): string[] {
  if (!record) return [];

  // For v2 records
  if (record.entry?.spec === "openlogs.v2") {
    return [
      "entry.id",
      "entry.actor",
      "entry.event",
      "entry.tps",
      "hash",
      "prev_hash",
    ];
  }

  // For v1 records
  return ["payload.actor", "payload.intent", "payload.tps", "hash", "prevHash"];
}
