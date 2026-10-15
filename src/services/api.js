const BASE_URL = '';

export async function fetchWorkspaces() {
  const res = await fetch(`${BASE_URL}/api/workspaces`);
  const data = await res.json();
  return data.workspaces || [];
}

export async function saveWorkspaces(workspaces) {
  const res = await fetch(`${BASE_URL}/api/workspaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaces })
  });
  return res.json();
}

export async function fetchAgents() {
  const res = await fetch(`${BASE_URL}/api/agents`);
  const data = await res.json();
  return data.agents || [];
}

export async function spawnTerminal(options) {
  const res = await fetch(`${BASE_URL}/api/terminal/spawn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });
  return res.json();
}

export async function writeTerminal(id, data) {
  const res = await fetch(`${BASE_URL}/api/terminal/${id}/write`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  return res.json();
}

export async function signalTerminal(id, signal = 'SIGINT') {
  const res = await fetch(`${BASE_URL}/api/terminal/${id}/signal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signal })
  });
  return res.json();
}

export async function killTerminal(id) {
  const res = await fetch(`${BASE_URL}/api/terminal/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function getTerminalHistory(id, lines = 60) {
  const res = await fetch(`${BASE_URL}/api/terminal/${id}/history?lines=${lines}`);
  const data = await res.json();
  return data.history || '';
}

export async function broadcastPrompt(terminalIds, prompt) {
  const res = await fetch(`${BASE_URL}/api/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ terminalIds, prompt })
  });
  return res.json();
}

export const broadcastInput = broadcastPrompt;

export async function fetchGitStatus(cwd) {
  const url = cwd ? `${BASE_URL}/api/git/status?cwd=${encodeURIComponent(cwd)}` : `${BASE_URL}/api/git/status`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchProjectMemory() {
  const res = await fetch(`${BASE_URL}/api/memory`);
  const data = await res.json();
  return data.memory || [];
}

export async function saveProjectMemory(memory) {
  const res = await fetch(`${BASE_URL}/api/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memory })
  });
  return res.json();
}

export async function fetchFileTree(dir) {
  const url = dir ? `${BASE_URL}/api/fs/tree?dir=${encodeURIComponent(dir)}` : `${BASE_URL}/api/fs/tree`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchFileContent(filePath) {
  const res = await fetch(`${BASE_URL}/api/fs/file?path=${encodeURIComponent(filePath)}`);
  return res.json();
}

export function createTerminalWebSocket(terminalId) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  // If Vite running on 5173, proxy handles /ws or connect to port 3001
  const wsUrl = `${protocol}//${host}/ws/terminal/${encodeURIComponent(terminalId)}`;
  return new WebSocket(wsUrl);
}
