import { Command } from 'commander';
import chalk from 'chalk';

import { verifyChain, verifyV2Chain, OpenLogsV2Record, OpenLogsRecord } from '@nextera.one/openlogs-sdk';
import { readJsonLines } from './fsutil';

export const verifyCommand = new Command('verify')
  .description(
    'Verify an OpenLogs JSONL file (hash chain and signatures when present)',
  )
  .option('-f, --file <path>', 'Input JSONL file', './openlogs.jsonl')
  .action(async (options) => {
    const filePath = String(options.file);
    const rows = readJsonLines(filePath);

    if (rows.length === 0) {
      console.log(chalk.yellow('⚠️  No records found'));
      return;
    }

    // Detect version from first record
    const first = rows[0];
    const isV2 = first.entry?.spec === 'openlogs.v2';

    let res;
    if (isV2) {
      console.log(chalk.cyan('📋 Detected OpenLogs v2 format'));
      res = await verifyV2Chain(rows as OpenLogsV2Record[]);
    } else {
      console.log(chalk.cyan('📋 Detected OpenLogs v1 format (legacy)'));
      res = await verifyChain(rows as OpenLogsRecord[]);
    }

    if (res.ok) {
      console.log(chalk.green('✅ OK'));
      console.log(`records: ${rows.length}`);
      return;
    }

    console.error(chalk.red('❌ FAIL'));
    console.error(`error: ${res.error}`);
    if (typeof res.index === 'number') console.error(`index: ${res.index}`);
    process.exitCode = 1;
  });
