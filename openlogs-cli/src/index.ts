import { Command } from 'commander';

import { initCommand } from './commands/init';
import { logCommand } from './commands/log';
import { verifyCommand } from './commands/verify';
import { inspectCommand } from './commands/inspect';

const program = new Command();

program
  .name('openlogs')
  .description('OpenLogs CLI - Provable execution evidence')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(logCommand);
program.addCommand(verifyCommand);
program.addCommand(inspectCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
