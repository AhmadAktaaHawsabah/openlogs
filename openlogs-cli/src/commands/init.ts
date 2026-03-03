import { Command } from 'commander';
import chalk from 'chalk';

import { generateEd25519Keypair } from '@nextera.one/openlogs-sdk';
import { writeJsonFile } from './fsutil';

function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

export const initCommand = new Command('init')
  .description('Create an OpenLogs identity keypair (ed25519)')
  .option(
    '-o, --out <path>',
    'Output path for identity JSON',
    './.openlogs/identity.json',
  )
  .option('--kid <kid>', 'Key id to embed in signatures', 'kid:local')
  .action(async (options) => {
    const { privateKey, publicKey } = await generateEd25519Keypair();

    const identity = {
      alg: 'ed25519',
      kid: String(options.kid),
      privateKeyHex: bytesToHex(privateKey),
      publicKeyHex: bytesToHex(publicKey),
      createdAt: new Date().toISOString(),
    };

    writeJsonFile(String(options.out), identity);

    console.log(chalk.green('✅ OpenLogs identity created'));
    console.log(`Wrote: ${options.out}`);
  });
