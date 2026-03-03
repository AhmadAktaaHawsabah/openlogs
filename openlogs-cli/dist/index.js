"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./commands/init");
const log_1 = require("./commands/log");
const verify_1 = require("./commands/verify");
const inspect_1 = require("./commands/inspect");
const program = new commander_1.Command();
program
    .name('openlogs')
    .description('OpenLogs CLI - Provable execution evidence')
    .version('0.1.0');
program.addCommand(init_1.initCommand);
program.addCommand(log_1.logCommand);
program.addCommand(verify_1.verifyCommand);
program.addCommand(inspect_1.inspectCommand);
program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
