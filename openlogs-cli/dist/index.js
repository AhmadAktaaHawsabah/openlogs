"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const init_1 = require("./commands/init");
const log_1 = require("./commands/log");
const verify_1 = require("./commands/verify");
const inspect_1 = require("./commands/inspect");
const export_1 = require("./commands/export");
// Read version from package.json
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf8"));
const program = new commander_1.Command();
program
    .name("openlogs")
    .description("OpenLogs CLI - Provable execution evidence")
    .version(pkg.version);
program.addCommand(init_1.initCommand);
program.addCommand(log_1.logCommand);
program.addCommand(verify_1.verifyCommand);
program.addCommand(inspect_1.inspectCommand);
program.addCommand(export_1.exportCommand);
// Global error handler for user-friendly output
program.exitOverride();
(async () => {
    try {
        await program.parseAsync(process.argv);
        if (!process.argv.slice(2).length) {
            program.outputHelp();
        }
    }
    catch (err) {
        // Commander throws for --help and --version; those are not real errors
        if (err instanceof Error && "code" in err) {
            const code = err.code;
            if (code === "commander.helpDisplayed" || code === "commander.version") {
                return;
            }
        }
        const message = err instanceof Error ? err.message : String(err);
        console.error(chalk_1.default.red(`\n❌ Error: ${message}`));
        process.exitCode = 1;
    }
})();
