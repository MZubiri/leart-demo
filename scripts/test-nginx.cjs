// Proxy regression with a disposable Nginx; no application secrets or live volumes.
const { execFileSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const assert = require('node:assert/strict');
const run = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const directory = mkdtempSync(join(tmpdir(), 'leart-nginx-'));
const name = `leart-nginx-test-${process.pid}`;
(async () => {
  try {
    const config = readFileSync(resolve(__dirname, '../nginx.conf'), 'utf8').replaceAll('http://backend:5000', 'http://127.0.0.1:5000');
    writeFileSync(join(directory, 'default.conf'), config + '\nserver { listen 5000; location / { add_header X-Test-Upstream yes; return 200 "upstream"; } }\n');
    run('run', '-d', '--rm', '--name', name, '-p', '127.0.0.1::80', '-v', `${directory}/default.conf:/etc/nginx/conf.d/default.conf:ro`, 'nginx:alpine');
    const port = run('port', name, '80/tcp').split(':').at(-1);
    const url = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      try { await fetch(url); ready = true; break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    assert(ready, 'nginx started');
    for (const path of ['/uploads/products/photo.jpg', '/api/test.png', '/api/admin/orders/attachments/1']) {
      const response = await fetch(url + path);
      assert.equal(response.status, 200, path); assert.equal(response.headers.get('x-test-upstream'), 'yes', path);
    }
    for (const path of ['/uploads/orders/photo.jpg', '/private/orders/photo.png']) {
      assert.equal((await fetch(url + path)).status, 404, path);
    }
    console.log('Nginx: 5 routing assertions passed.');
  } finally {
    try { run('stop', name); } catch { /* container may not have started */ }
    rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
