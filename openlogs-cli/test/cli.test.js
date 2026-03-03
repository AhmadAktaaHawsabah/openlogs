const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function runOpenLogs(args, cwd) {
  const cliEntry = path.resolve(__dirname, '..', 'dist', 'index.js');
  const res = spawnSync(
    process.execPath,
    [cliEntry, ...args],
    {
      cwd,
      encoding: 'utf8',
    },
  );
  return {
    code: res.status ?? 0,
    stdout: res.stdout ?? '',
    stderr: res.stderr ?? '',
  };
}

test('openlogs --help shows commands', () => {
  const cwd = process.cwd();
  const res = runOpenLogs(['--help'], cwd);
  assert.equal(res.code, 0);
  assert.match(res.stdout, /Commands:/);
  assert.match(res.stdout, /init/);
  assert.match(res.stdout, /log/);
  assert.match(res.stdout, /verify/);
  assert.match(res.stdout, /inspect/);
});

test('init + log + verify roundtrip', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'openlogs-cli-'));

  const init = runOpenLogs(
    ['init', '--out', '.openlogs/identity.json', '--kid', 'kid:test'],
    tmp,
  );
  assert.equal(init.code, 0, init.stderr || init.stdout);

  const log1 = runOpenLogs(
    [
      'log',
      '--actor',
      'system:test',
      '--event',
      'test.one',
      '--tps',
      'tps://node:test@T:greg.m3.c1.y26.m01.d09.h14.m30.s25.m0',
      '--data',
      '{"n":1}',
    ],
    tmp,
  );
  assert.equal(log1.code, 0, log1.stderr || log1.stdout);

  const log2 = runOpenLogs(
    [
      'log',
      '--actor',
      'system:test',
      '--event',
      'test.two',
      '--tps',
      'tps://node:test@T:greg.m3.c1.y26.m01.d09.h14.m30.s26.m0',
      '--data',
      '{"n":2}',
    ],
    tmp,
  );
  assert.equal(log2.code, 0, log2.stderr || log2.stdout);

  const verify = runOpenLogs(['verify', '--file', 'openlogs.jsonl'], tmp);
  assert.equal(verify.code, 0, verify.stderr || verify.stdout);
  assert.match(verify.stdout, /OK/);
});
