import { Command } from 'commander';
import chalk from 'chalk';

import { readJsonLines } from './fsutil';

export const inspectCommand = new Command('inspect')
  .description('Inspect an OpenLogs JSONL file')
  .option('-f, --file <path>', 'Input JSONL file', './openlogs.jsonl')
  .option('--last', 'Show only the last record')
  .action(async (options) => {
    const rows = readJsonLines(String(options.file));
    if (!rows.length) {
      console.log(chalk.yellow('No records'));
      return;
    }

    const out = options.last ? [rows[rows.length - 1]] : rows;
    console.log(JSON.stringify(out, null, 2));
  });
