# openlogs-sdk

TypeScript/JavaScript SDK for OpenLogs (provable execution evidence).

## Install

- `npm i openlogs-sdk`

## Quick start

```ts
import {
  createRecord,
  generateEd25519Keypair,
  signRecord,
  verifyChain,
} from 'openlogs-sdk';

const { privateKey, publicKey } = await generateEd25519Keypair();

const r1 = createRecord(
  {
    actor: 'actor:demo',
    intent: 'demo.hello',
    tps: 'tps:2026-01-09T00:00:00Z',
    data: { msg: 'hello' },
  },
  null,
);

const signed = await signRecord(r1, { privateKey, publicKey });

console.log(verifyChain([signed]));
```

License: Apache-2.0
