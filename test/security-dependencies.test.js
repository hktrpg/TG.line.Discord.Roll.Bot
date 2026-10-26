'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const floors = {
  '@xmldom/xmldom': '0.8.15', 'body-parser': '1.20.9', 'engine.io': '6.6.11',
  'js-yaml': '4.3.2', 'ip-address': '10.7.4', axios: '1.20.0', qs: '6.16.0',
  moment: '2.31.0', browserslist: '4.28.7', 'follow-redirects': '1.16.1',
  '@humanfs/node': '0.16.8', 'brace-expansion': '2.1.7',
  'basic-ftp': '6.2.3',
};
function atLeast(version, floor) {
  const a = version.split('.').map(Number), b = floor.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true;
}

test.each(Object.entries(floors))('%s installs a patched version', (name, floor) => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8'));
  expect(atLeast(manifest.version, floor)).toBe(true);
});

test('lockfile does not retain the vulnerable legacy HTTP cache chain', () => {
  const lock = fs.readFileSync(path.join(root, 'yarn.lock'), 'utf8');
  expect(/^http-cache-semantics@/m.test(lock)).toBe(false);
});

test('malformed FTP listings cannot pin the parser process', () => {
  // Bound the child process so the old quadratic parser cannot hang Jest.
  // This exercises the installed parser with the upstream advisory's input shape.
  const script = `
    const { parseList } = require('basic-ftp');
    const malformed = '-rw-r--r-- 1 ' + 'a '.repeat(65536) + '!';
    const valid = '-rw-r--r-- 1 owner group 42 Jan 1 2020 file.txt';
    try { parseList(malformed + '\\r\\n' + valid + '\\r\\n'); }
    catch (error) { if (!(error instanceof Error)) throw error; }
    console.log('completed');
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: root, timeout: 3000, encoding: 'utf8',
    env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, NODE_ENV: 'test' },
  });
  expect({ status: result.status, error: result.error?.code })
    .toEqual({ status: 0, error: undefined });
  expect(result.stdout).toContain('completed');
});

test('Express survives a compressed JSON body followed by invalid trailing bytes', () => {
  // Run in a separate process: a regression must fail the test, not kill Jest.
  // Only a temporary loopback listener is used; no application config is loaded.
  const script = `
    const express = require('express'), http = require('node:http'), zlib = require('node:zlib');
    const app = express(); app.use(express.json());
    app.post('/', (req, res) => res.json({ ok: true }));
    app.get('/health', (req, res) => res.json({ ok: true }));
    app.use((err, req, res, next) => res.status(400).end());
    const server = app.listen(0, '127.0.0.1', async () => {
      try {
        const port = server.address().port;
        const body = Buffer.concat([zlib.gzipSync(Buffer.from('{"ok":true}')), Buffer.from([0]), Buffer.alloc(100 * 1024, 0x58)]);
        await new Promise((resolve, reject) => {
          const req = http.request({ host: '127.0.0.1', port, method: 'POST', path: '/',
            headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip', 'Content-Length': body.length } },
            res => { res.resume(); res.on('end', resolve); });
          req.on('error', reject); req.end(body);
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        const response = await fetch('http://127.0.0.1:' + port + '/health');
        if (!response.ok || !(await response.json()).ok) throw Error('health');
        server.closeAllConnections(); server.close();
      } catch { server.closeAllConnections(); server.close(); process.exitCode = 2; }
    });
    setTimeout(() => process.exit(3), 6000).unref();
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: root, timeout: 8000, encoding: 'utf8',
    env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, NODE_ENV: 'test' },
  });
  expect({ status: result.status, signal: result.signal, error: result.error?.code })
    .toEqual({ status: 0, signal: null, error: undefined });
});
