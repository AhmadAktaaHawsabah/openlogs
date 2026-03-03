"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const openlogs_sdk_1 = require("@nextera.one/openlogs-sdk");
const fsutil_1 = require("./fsutil");
exports.verifyCommand = new commander_1.Command('verify')
    .description('Verify an OpenLogs JSONL file (hash chain and signatures when present)')
    .option('-f, --file <path>', 'Input JSONL file', './openlogs.jsonl')
    .action(async (options) => {
    const filePath = String(options.file);
    const rows = (0, fsutil_1.readJsonLines)(filePath);
    if (rows.length === 0) {
        console.log(chalk_1.default.yellow('⚠️  No records found'));
        return;
    }
    // Detect version from first record
    const first = rows[0];
    const isV2 = first.entry?.spec === 'openlogs.v2';
    let res;
    if (isV2) {
        console.log(chalk_1.default.cyan('📋 Detected OpenLogs v2 format'));
        res = await (0, openlogs_sdk_1.verifyV2Chain)(rows);
    }
    else {
        console.log(chalk_1.default.cyan('📋 Detected OpenLogs v1 format (legacy)'));
        res = await (0, openlogs_sdk_1.verifyChain)(rows);
    }
    if (res.ok) {
        console.log(chalk_1.default.green('✅ OK'));
        console.log(`records: ${rows.length}`);
        return;
    }
    console.error(chalk_1.default.red('❌ FAIL'));
    console.error(`error: ${res.error}`);
    if (typeof res.index === 'number')
        console.error(`index: ${res.index}`);
    process.exitCode = 1;
});
