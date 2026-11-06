import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { parseEnv } from 'node:util';

const host = '127.0.0.1';
const listen = (server) => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, host, () => resolve(server.address().port));
});
const close = (server) => new Promise((resolve) => server.close(resolve));
const tmp = await mkdtemp(path.join(os.tmpdir(), 'cowin-rfq-smoke-'));
let accepted = 0;
let rejected = 0;
let rejectNext = false;
const smtp = net.createServer((socket) => {
  let buffer = '';
  let stage = '';
  socket.write('220 Isolated SMTP\r\n');
  socket.on('error', () => socket.destroy());
  socket.on('data', (chunk) => {
    buffer += chunk.toString();
    for (let end; (end = buffer.indexOf('\r\n')) >= 0;) {
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      if (stage === 'data') {
        if (line !== '.') continue;
        stage = '';
        if (rejectNext) { rejectNext = false; rejected += 1; socket.write('450 Rejected by isolated test\r\n'); }
        else { accepted += 1; socket.write('250 Accepted\r\n'); }
      } else if (stage === 'user') { stage = 'pass'; socket.write('334 Password\r\n'); }
      else if (stage === 'pass') { stage = ''; socket.write('235 Authenticated\r\n'); }
      else if (line === 'AUTH LOGIN') { stage = 'user'; socket.write('334 Username\r\n'); }
      else if (line === 'DATA') { stage = 'data'; socket.write('354 End with dot\r\n'); }
      else if (line === 'QUIT') socket.end('221 Closing\r\n');
      else socket.write('250 OK\r\n');
    }
  });
});

let child;
let logs = '';
try {
  const smtpPort = await listen(smtp);
  const probe = net.createServer();
  const port = await listen(probe);
  await close(probe);
  const projectEnv = {};
  for (const filename of ['.env', '.env.local', '.env.production', '.env.production.local']) {
    const contents = await readFile(filename, 'utf8').catch((error) => { if (error.code !== 'ENOENT') throw error; return ''; });
    Object.assign(projectEnv, Object.fromEntries(Object.keys(parseEnv(contents)).map((key) => [key, ''])));
  }
  const password = randomUUID();
  const cron = randomUUID();
  child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', host, '-p', String(port)], {
    env: {
      PATH: process.env.PATH, HOME: process.env.HOME, ...projectEnv, TMPDIR: tmp, NODE_ENV: 'production',
      DATABASE_URL: '', VERCEL: '', NEXT_TELEMETRY_DISABLED: '1', RESEND_API_KEY: '',
      SMTP_HOST: host, SMTP_PORT: String(smtpPort), SMTP_USER: 'ops-smtp@shop.invalid', SMTP_PASSWORD: password,
      SMTP_STARTTLS: 'false', SMTP_SECURE: 'false', ADMIN_EMAIL: 'ops-admin@shop.invalid', ADMIN_PASSWORD: password,
      ADMIN_PASSWORD_HASH: '', ADMIN_JWT_SECRET: randomUUID(), CRON_SECRET: cron,
    }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (data) => { logs = (logs + data).slice(-5000); });
  const request = (pathname, options = {}) => fetch(`http://${host}:${port}${pathname}`, { redirect: 'manual', signal: AbortSignal.timeout(10000), ...options });
  const post = (pathname, body, headers = {}) => request(pathname, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  for (let attempt = 0; !(await request('/products').then((r) => r.ok).catch(() => false)); attempt += 1) {
    if (attempt >= 50 || child.exitCode !== null) throw Error('Isolated Next server did not start. Build it first.');
    await delay(200);
  }
  const payload = { name: 'Sample Buyer', email: 'buyer@shop.invalid', product: 'Audi A3', requirement: 'Test a sample for our collection', idempotencyKey: randomUUID() };
  const invalid = await post('/api/inquiry', { ...payload, attachment: { name: 'fake.png', type: 'image/png', contentBase64: 'dGVzdA==' } });
  assert.equal(invalid.status, 400);
  const results = await Promise.all(Array.from({ length: 3 }, () => post('/api/inquiry', payload).then((r) => r.json())));
  const first = results.find((result) => !result.duplicate);
  assert.ok(first?.ok && first.emailSent && first.statusSaved && !first.testExcluded);
  assert.equal(accepted, 1);
  assert.ok(results.every((result) => result.id === first.id));
  assert.equal(results.filter((result) => result.duplicate).length, 2);

  rejectNext = true;
  const failure = await post('/api/inquiry', { ...payload, idempotencyKey: randomUUID() }).then((r) => r.json());
  assert.ok(failure.ok && failure.statusSaved && failure.deliveryStatus === 'failed');
  assert.equal(rejected, 1);
  const retryPath = `/api/admin/inquiries/${failure.id}`;
  assert.equal((await post(retryPath, { action: 'retry-notification' })).status, 401);
  const login = await request('/api/admin/login', { method: 'POST', body: new URLSearchParams({ email: 'ops-admin@shop.invalid', password }) });
  assert.equal(login.status, 303);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const detail = await request(retryPath, { headers: { cookie } }).then((r) => r.json());
  assert.equal(detail.inquiry.deliveryStatus, 'failed');
  const retry = await post(retryPath, { action: 'retry-notification' }, { cookie }).then((r) => r.json());
  assert.ok(retry.emailSent && retry.statusSaved);
  assert.equal((await post(retryPath, { action: 'retry-notification' }, { cookie })).status, 409);
  assert.equal(accepted, 2);
  const records = JSON.parse(await readFile(path.join(tmp, 'cowinmotors-inquiries.json'), 'utf8'));
  assert.equal(records.length, 2);
  assert.ok(records.every((record) => record.deliveryStatus === 'sent' && !record.phone));
  assert.equal((await request('/api/admin/sync')).status, 401);
  assert.equal((await request('/api/admin/sync', { headers: { cookie } })).status, 503);
  const monthly = () => request('/api/cron/inquiry-email-test', { headers: { authorization: `Bearer ${cron}` } }).then((r) => r.json());
  assert.equal((await monthly()).ok, true);
  assert.equal((await monthly()).duplicate, true);
  assert.equal(accepted, 3);
  console.log('Isolated RFQ passed: optional phone, file validation, 3 concurrent requests -> 1 row and 1 email, SMTP failure and authenticated recovery, admin protection, monthly deduplication.');
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  if (child && child.exitCode === null) {
    const finished = new Promise((resolve) => child.once('exit', resolve));
    child.kill('SIGTERM');
    await finished;
  }
  await close(smtp);
  await rm(tmp, { force: true, recursive: true });
}
