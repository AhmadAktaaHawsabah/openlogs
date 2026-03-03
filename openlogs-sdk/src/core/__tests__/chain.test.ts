import { describe, expect, it } from 'vitest';

import {
  createRecord,
  generateEd25519Keypair,
  signRecord,
  verifyChain,
} from '../index';

describe('openlogs-sdk chain', () => {
  it('creates a valid hash chain', async () => {
    const r1 = createRecord(
      {
        actor: 'actor:test',
        intent: 'test.one',
        tps: 'tps:test:1',
        data: { n: 1 },
      },
      null,
    );

    const r2 = createRecord(
      {
        actor: 'actor:test',
        intent: 'test.two',
        tps: 'tps:test:2',
        data: { n: 2 },
      },
      r1.hash,
    );

    const res = await verifyChain([r1, r2]);
    expect(res.ok).toBe(true);
  });

  it('detects a broken prevHash', async () => {
    const r1 = createRecord(
      { actor: 'actor:test', intent: 'test.one', tps: 'tps:test:1' },
      null,
    );
    const r2 = createRecord(
      { actor: 'actor:test', intent: 'test.two', tps: 'tps:test:2' },
      'deadbeef',
    );

    const res = await verifyChain([r1, r2]);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('prev-hash-mismatch');
    expect(res.index).toBe(1);
  });

  it('signs and verifies signatures when present', async () => {
    const keys = await generateEd25519Keypair();

    const r1 = createRecord(
      { actor: 'actor:test', intent: 'test.sig', tps: 'tps:test:1' },
      null,
    );

    const signed = await signRecord(r1, keys);
    expect(signed.sig).toBeTruthy();

    const res = await verifyChain([signed]);
    expect(res.ok).toBe(true);
  });
});
