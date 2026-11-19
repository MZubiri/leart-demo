// Fullstack image smoke on disposable MySQL and anonymous runtime volumes.
const cp = require('node:child_process'), crypto = require('node:crypto'), fs = require('node:fs'), assert = require('node:assert/strict');
const mysql = `leart-runtime-db-${process.pid}`, web = `leart-runtime-web-${process.pid}`;
const password = crypto.randomBytes(24).toString('hex'), jwt = crypto.randomBytes(32).toString('hex');
const docker = (...args) => cp.execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const waitFor = async check => { for (let i = 0; i < 180; i++) { try { if (await check()) return; } catch {} await new Promise(resolve => setTimeout(resolve, 500)); } throw Error('Service did not become ready'); };
(async () => {
  try {
    cp.execFileSync('docker', ['run', '-d', '--rm', '--name', mysql, '-p', '127.0.0.1::8080', '-e', 'MYSQL_ROOT_PASSWORD', '-e', 'MYSQL_PASSWORD', '-e', 'MYSQL_USER=leart', '-e', 'MYSQL_DATABASE=leart_runtime', 'mysql:8.4'],
      { env: { ...process.env, MYSQL_ROOT_PASSWORD: password, MYSQL_PASSWORD: password }, stdio: 'pipe' });
    await waitFor(() => { docker('exec', mysql, 'sh', '-c', 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -h 127.0.0.1 -u leart -D leart_runtime -e "SELECT 1"'); return true; });
    const env = { ...process.env, ConnectionStrings__DefaultConnection: `Server=127.0.0.1;Database=leart_runtime;User=leart;Password=${password}`, Jwt__Secret: jwt, BootstrapAdmin__Username: 'owner', BootstrapAdmin__Email: 'owner@example.test', BootstrapAdmin__Password: password };
    cp.execFileSync('docker', ['run', '-d', '--rm', '--name', web, '--network', `container:${mysql}`, ...Object.keys(env).filter(k => /^(ConnectionStrings__|Jwt__|BootstrapAdmin__)/.test(k)).flatMap(key => ['-e', key]), process.env.LEART_RUNTIME_IMAGE || 'leart-audit-web:local'], { env, stdio: 'pipe' });
    const url = `http://127.0.0.1:${docker('port', mysql, '8080/tcp').split(':').at(-1)}`;
    await waitFor(async () => (await fetch(url + '/health/ready')).status === 200);
    assert.equal((await fetch(url)).status, 200);
    assert((await (await fetch(url)).text()).includes('<app-root>'));
    assert.equal((await fetch(url + '/api/nonexistent')).status, 404);
    assert((await (await fetch(url + '/api/public/products')).json()).length > 0);
    const rules = await (await fetch(url + '/api/public/pricing')).json();
    assert.equal(rules.simulated, true); assert.equal(rules.frames.M['1'], 116000);
    docker('exec', web, 'curl', '--fail', '--silent', 'http://127.0.0.1:8080/health/ready');
    const login = await fetch(url + '/api/admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'owner', password }) });
    assert.equal(login.status, 200); const { token } = await login.json();
    const form = new FormData();
    for (const [key, value] of Object.entries({ orderReference: 'RUNTIME-TEST', customerName: 'Test only', phone: '573001112233', productTitle: 'Cuadros' })) form.set(key, value);
    form.set('photos', new Blob([fs.readFileSync('public/images/minifiguras.webp')], { type: 'image/webp' }), 'reference.webp');
    const received = await fetch(url + '/api/public/personalization', { method: 'POST', body: form });
    assert.equal(received.status, 200, await received.clone().text()); const order = await received.json(); assert.equal(order.attachments.length, 1);
    const attachmentUrl = url + '/api/admin/orders/attachments/' + order.attachments[0].id;
    assert.equal((await fetch(attachmentUrl)).status, 401);
    const attachment = await fetch(attachmentUrl, { headers: { Authorization: `Bearer ${token}` } }); assert.equal(attachment.status, 200);
    const signature = Buffer.from(await attachment.arrayBuffer()).subarray(0, 8).toString('hex'); assert.equal(signature, '89504e470d0a1a0a');
    docker('restart', web); await waitFor(async () => (await fetch(url + '/health/ready')).status === 200);
    assert.equal((await fetch(attachmentUrl, { headers: { Authorization: `Bearer ${token}` } })).status, 200);
    console.log('Runtime: SPA/API, persisted simulated pricing, readiness probe, MySQL migration/bootstrap, normalized private photo and restart passed.');
  } finally { for (const name of [web, mysql]) try { docker('stop', name); } catch {} }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
