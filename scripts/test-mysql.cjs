// Runs tests against an isolated MySQL server. Never connects to an existing installation.
const cp = require('node:child_process'), crypto = require('node:crypto');
const name = `leart-mysql-test-${process.pid}`;
const password = crypto.randomBytes(24).toString('hex');
const docker = (...args) => cp.execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
(async () => {
  try {
    cp.execFileSync('docker', ['run', '-d', '--rm', '--name', name, '-p', '127.0.0.1::3306',
      '-e', 'MYSQL_ROOT_PASSWORD', '-e', 'MYSQL_PASSWORD', '-e', 'MYSQL_USER=leart', '-e', 'MYSQL_DATABASE=leart_tests', 'mysql:8.4'],
      { env: { ...process.env, MYSQL_ROOT_PASSWORD: password, MYSQL_PASSWORD: password }, stdio: 'pipe' });
    let ready = false;
    for (let i = 0; i < 180; i++) {
      try { docker('exec', name, 'sh', '-c', 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -h 127.0.0.1 -u leart -D leart_tests -e "SELECT 1"'); ready = true; break; }
      catch { await new Promise(resolve => setTimeout(resolve, 500)); }
    }
    if (!ready) throw Error('MySQL did not become ready');
    const port = docker('port', name, '3306/tcp').split(':').at(-1);
    const result = cp.spawnSync(process.env.DOTNET_COMMAND || 'dotnet', ['test', 'backend/Leart.Api.Tests', '--filter', 'MySqlIntegration', '--nologo', '--verbosity', 'quiet'], {
      env: { ...process.env, LEART_TEST_MYSQL: `Server=127.0.0.1;Port=${port};Database=leart_tests;User=leart;Password=${password};SslMode=Disabled` }, stdio: 'inherit',
    });
    if (result.error) throw result.error;
    if (result.status) throw Error(`MySQL tests exited ${result.status}`);
  } finally { try { docker('stop', name); } catch { /* nothing started */ } }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
