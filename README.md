# OpenLogs

**Provable execution evidence** — tamper-evident, cryptographically signed log chains anchored to [TPS Reality Strings](https://github.com/nicholasgasior/tps-standard).

```
openlogs/
├── openlogs-sdk     →  Core TypeScript SDK (hash chains, Ed25519 signing, TPS-UID)
├── openlogs-cli     →  CLI tool (init, log, verify, inspect, export)
└── openlogs-test    →  Assertion-based integration test suite
```

## Quick Start

```bash
# Install all workspaces
npm install

# Build everything
npm run build

# Run all tests
npm run test
```

## How It Works

1. **Create** a log entry with an actor, event, TPS coordinate, and optional data
2. **Chain** entries together via SHA-256 hash links — each record references the previous
3. **Sign** records with Ed25519 for cryptographic proof of authorship
4. **Verify** the entire chain to detect tampering or unauthorized modifications

```ts
import {
  createV2Chain,
  signV2Record,
  verifyV2Chain,
  generateEd25519Keypair,
} from "@nextera.one/openlogs-sdk";

// Build a chain of 3 records
const chain = createV2Chain([
  {
    actor: "user:alice",
    tps: "tps://L:40.71,-74.00@T:greg.m3.c1.y26.m3.d3.h08.m0.s0.m0",
    event: "auth.login",
  },
  {
    actor: "user:alice",
    tps: "tps://L:40.71,-74.00@T:greg.m3.c1.y26.m3.d3.h08.m5.s0.m0",
    event: "data.read",
  },
  {
    actor: "user:alice",
    tps: "tps://L:40.71,-74.00@T:greg.m3.c1.y26.m3.d3.h08.m10.s0.m0",
    event: "auth.logout",
  },
]);

// Sign & verify
const keys = await generateEd25519Keypair();
const signed = await Promise.all(chain.map((r) => signV2Record(r, keys)));
console.log(await verifyV2Chain(signed)); // { ok: true }
```

## Packages

| Package                                       | Description                                                     | Version |
| --------------------------------------------- | --------------------------------------------------------------- | ------- |
| [@nextera.one/openlogs-sdk](./openlogs-sdk)   | Core SDK — entries, hash chains, signing, TPS-UID, key rotation | 2.1.0   |
| [@nextera.one/openlogs-cli](./openlogs-cli)   | CLI — `init`, `log`, `verify`, `inspect`, `export`              | 2.0.1   |
| [@nextera.one/openlogs-test](./openlogs-test) | Integration test suite (14 assertions)                          | 2.0.0   |

## Key Features

- **Hash-chained records** — SHA-256 linked entries for tamper evidence
- **Ed25519 signatures** — cryptographic proof per record
- **TPS Reality Strings** — time + place + space as primary keys
- **TPS-UID** — globally unique, reversible IDs
- **Geospatial indexes** — S2/H3 cell support
- **Multi-calendar** — Gregorian, Unix, and more
- **Key rotation** — `KeyRegistry` for managing trusted signing keys
- **Batch operations** — `createV2Chain` for multi-record creation
- **Dual CJS/ESM** — works everywhere

## Development

```bash
# Build individual packages
npm run build:sdk
npm run build:cli

# Test individual packages
npm run test:sdk
npm run test:cli
npm run test:integration
```

## License

Apache-2.0
