// Run: node --test server/local-only.test.js
// The API can type into every chat, so only this computer's own pages and tools may reach it.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';

const PORT = 3998;
let server;

before(() => new Promise((resolve, reject) => {
  const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'delo-local-'));
  server = spawn(process.execPath, [path.join(import.meta.dirname, 'index.js')], { env: { ...process.env, HOME, PORT } });
  server.stdout.on('data', d => String(d).includes('running at') && resolve());
  server.on('exit', code => reject(new Error(`server exited with ${code}`)));
}));
after(() => server.kill());

// Status code of a request, 101 for an accepted socket, 'closed' when the connection is dropped.
const status = (headers, { method = 'GET', path = '/api/workspaces', body } = {}) => new Promise(resolve => {
  const req = http.request({ host: '127.0.0.1', port: PORT, method, path, headers }, res => { res.resume(); resolve(res.statusCode); });
  req.on('upgrade', (res, socket) => { socket.destroy(); resolve(101); });
  req.on('error', () => resolve('closed'));
  req.end(body);
});
const socket = (headers) => status({ Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Version': '13', 'Sec-WebSocket-Key': 'x3JJHMbDL1EzLkh9GBhXDw==', ...headers }, { path: '/ws/terminal/guard-test' });

test('the app, its dev proxy and delo get in', async () => {
  assert.equal(await status({}), 200); // delo / curl: no Origin
  assert.equal(await status({ Origin: 'http://localhost:3001' }), 200); // Electron window
  assert.equal(await status({ Host: 'localhost:3001', Origin: 'http://localhost:5173' }), 200); // Vite /api proxy
  assert.equal(await socket({ Host: 'localhost:5173', Origin: 'http://localhost:5173' }), 101); // Vite /ws proxy
});

test('other websites and DNS rebinding are refused', async () => {
  assert.equal(await status({ Origin: 'https://evil.com' }), 403);
  assert.equal(await status({ Origin: 'http://localhost.evil.com' }), 403);
  assert.equal(await status({ Origin: 'null' }), 403);
  assert.equal(await status({ Host: 'evil.com:3001' }), 403);
  assert.equal(await status({ Origin: 'https://evil.com', 'Content-Type': 'text/plain' },
    { method: 'POST', path: '/api/orchestra/report?from=x', body: 'hi' }), 403);
  assert.equal(await socket({ Origin: 'https://evil.com' }), 'closed');
  assert.equal(await socket({ Host: 'evil.com:3001' }), 'closed');
});
