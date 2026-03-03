"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fsutil_1 = require("./fsutil");
exports.inspectCommand = new commander_1.Command('inspect')
    .description('Inspect an OpenLogs JSONL file')
    .option('-f, --file <path>', 'Input JSONL file', './openlogs.jsonl')
    .option('--last', 'Show only the last record')
    .action(async (options) => {
    const rows = (0, fsutil_1.readJsonLines)(String(options.file));
    if (!rows.length) {
        console.log(chalk_1.default.yellow('No records'));
        return;
    }
    const out = options.last ? [rows[rows.length - 1]] : rows;
    console.log(JSON.stringify(out, null, 2));
});
