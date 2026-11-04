// Run: node --test server/orchestra.test.js
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

process.env.HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'delo-orchestra-'));
const { saveWorkspaces } = await import('./storage.js');
const { ptyManager } = await import('./pty-manager.js');
const orchestra = await import('./orchestra.js');

// Handles come from titles: M=agent, W=agent-2, X=agent-3, Y=agent-4 (the zsh node S gets none)
const agent = (id, extra) => ({ id, type: 'terminal', agentType: 'claude', title: 'Agent', x: 0, y: 0, width: 1, height: 1, ...extra });
saveWorkspaces([{ id: 'ws', nodes: [
  agent('M'),
  agent('W', { managerId: 'M' }),
  agent('X'),
  agent('Y', { managerId: 'M' }),
  { id: 'S', type: 'terminal', agentType: 'zsh', title: 'Shell', managerId: 'M' }
] }]);

// Stand-in agent: turns on bracketed paste and echoes whatever it is sent. Y stays at the shell prompt.
for (const id of ['M', 'W']) ptyManager.spawn(id, { command: `bash -c 'printf "\\e[?2004h"; cat'` });
ptyManager.spawn('Y');
await new Promise(r => setTimeout(r, 2500));
after(() => ['M', 'W', 'Y'].forEach(id => ptyManager.kill(id)));

const settle = () => new Promise(r => setTimeout(r, 800));

test('manager sends a multi-line task and the worker reports back', async () => {
  assert.match(orchestra.list('M'), /agent-2 .*\n.*agent-4/);
  orchestra.send('M', 'agent-2', 'line one\nline "two" $x');
  await settle();
  const worker = ptyManager.getHistory('W', 50);
  assert.match(worker, /\[Task from manager "agent" via DeloSpace\]/);
  assert.match(worker, /line "two" \$x/);
  assert.match(worker, /delo report/);

  orchestra.report('W', 'all done');
  await settle();
  assert.match(ptyManager.getHistory('M', 50), /\[Report from worker "agent-2" via DeloSpace\][\s\S]*all done/);
});

test('refuses non-workers, plain shells, and chats with no agent running', () => {
  assert.throws(() => orchestra.send('M', 'agent-3', 'hi'), /not one of your workers/);
  assert.throws(() => orchestra.send('M', 'shell', 'hi'), /not one of your workers/);
  assert.throws(() => orchestra.send('M', 'agent-4', 'hi'), /no agent running/);
  assert.throws(() => orchestra.send('M', 'agent-2', '  '), /Empty task/);
  assert.throws(() => orchestra.report('M', 'hi'), /no manager/);
});
