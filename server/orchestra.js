// Manager/worker chats: a worker node has `managerId` pointing at its manager node on the same board.
// Chats talk through the `delo` command (server/bin/delo), which calls the routes in index.js.
import { loadWorkspaces } from './storage.js';
import { ptyManager } from './pty-manager.js';

const fail = (message) => Object.assign(new Error(message), { expose: true });

const isAgentNode = (n) => n?.type === 'terminal' && n.agentType && n.agentType !== 'zsh';

// Strip control characters (keep newlines/tabs) so a message can't break out of the paste and type keystrokes.
const clean = (text) => String(text || '').replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '').trim();

// Short stable names like "openai-codex", "openai-codex-2", unique per board.
function handlesFor(nodes) {
  const handles = new Map();
  const used = new Set();
  for (const n of nodes.filter(isAgentNode)) {
    const base = (n.title || n.agentType).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || n.agentType;
    let h = base;
    for (let i = 2; used.has(h); i++) h = `${base}-${i}`;
    used.add(h);
    handles.set(n.id, h);
  }
  return handles;
}

// The caller's board, as last saved by the app.
function boardOf(nodeId) {
  for (const ws of loadWorkspaces()) {
    const me = ws.nodes?.find(n => n.id === nodeId);
    if (me) {
      const handles = handlesFor(ws.nodes);
      const workers = ws.nodes.filter(n => isAgentNode(n) && n.managerId === me.id);
      const manager = ws.nodes.find(n => n.id === me.managerId && isAgentNode(n));
      return { me, workers, manager, name: (n) => handles.get(n.id) || n.id };
    }
  }
  throw fail('This chat is not on a saved board. Is DeloSpace open?');
}

function workerOf(board, to) {
  const w = board.workers.find(n => n.id === to || board.name(n) === String(to || '').toLowerCase());
  if (!w) {
    const names = board.workers.map(board.name).join(', ') || 'none — connect one on the board first';
    throw fail(`"${to}" is not one of your workers. Your workers: ${names}`);
  }
  return w;
}

function deliver(node, board, text) {
  if (!ptyManager.sessions.has(node.id)) throw fail(`${board.name(node)} is not running. Open its chat on the board first.`);
  if (!ptyManager.isAgentRunning(node.id)) throw fail(`${board.name(node)} has no agent running (its chat is at the shell prompt).`);
  ptyManager.sendPrompt(node.id, text);
}

const statusOf = (n) => ptyManager.sessions.get(n.id)?.status || 'not running';

export function list(from) {
  const b = boardOf(from);
  const lines = [`You are: ${b.name(b.me)}`];
  if (b.manager) lines.push(`Your manager: ${b.name(b.manager)}`);
  lines.push(b.workers.length ? 'Your workers:' : 'You have no workers.');
  for (const w of b.workers) lines.push(`  ${b.name(w)}  (${w.title || w.agentType}, ${statusOf(w)})`);
  return lines.join('\n');
}

export function send(from, to, text) {
  const b = boardOf(from);
  const w = workerOf(b, to);
  const task = clean(text);
  if (!task) throw fail('Empty task.');
  deliver(w, b, `[Task from manager "${b.name(b.me)}" via DeloSpace]\n${task}\n\nWhen you finish or get stuck, report back by running this shell command: delo report "<what you did and the result>"`);
  return `Sent to ${b.name(w)}. Its report will arrive as a new message starting with [Report from worker "${b.name(w)}"].`;
}

export function report(from, text) {
  const b = boardOf(from);
  if (!b.manager) throw fail('This chat has no manager to report to.');
  const summary = clean(text);
  if (!summary) throw fail('Empty report.');
  deliver(b.manager, b, `[Report from worker "${b.name(b.me)}" via DeloSpace]\n${summary}`);
  return `Reported to ${b.name(b.manager)}.`;
}

export function read(from, to, lines) {
  const b = boardOf(from);
  const w = workerOf(b, to);
  const n = Math.min(Math.max(parseInt(lines, 10) || 60, 1), 400);
  const out = ptyManager.getHistory(w.id, n * 3).split('\n').filter(l => l.trim()).slice(-n).join('\n');
  return `--- ${b.name(w)} (${statusOf(w)}), last ${n} lines ---\n${out || '(no output yet)'}`;
}

// Typed into the manager's chat when a worker is connected to it.
// The full instructions go once per running chat, so a restarted manager is briefed again.
export function brief(managerId, workerId) {
  const b = boardOf(managerId);
  const w = b.workers.find(n => n.id === workerId);
  if (!w) throw fail('That chat is not connected to this manager.');
  const session = ptyManager.sessions.get(b.me.id);
  if (session?.briefed) {
    deliver(b.me, b, `[DeloSpace] Worker connected: ${b.name(w)} (${w.title || w.agentType}). Run "delo list" to see all workers. Reply with a one-line acknowledgement.`);
    return;
  }
  deliver(b.me, b, [
    `[DeloSpace] You are now the manager of other AI agent chats on this board. Worker connected: ${b.name(w)} (${w.title || w.agentType}).`,
    'Delegate with the delo shell command:',
    '  delo list                    - your workers and their status',
    '  delo send <worker> "<task>"  - give a worker a task (long tasks: pipe them in via a heredoc instead of the quoted argument)',
    '  delo read <worker> [lines]   - a worker\'s recent screen output',
    'Each worker runs in its own chat that the user can watch. Workers cannot see this conversation, so give every task full context (goal, files, constraints, how to verify).',
    'Workers reply with messages starting with [Report from worker ...]. After sending tasks, carry on or end your turn - do not poll in a loop.',
    'Reply with a one-line acknowledgement.'
  ].join('\n'));
  session.briefed = true;
}
