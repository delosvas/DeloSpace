import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { ptyManager } from './pty-manager.js';
import { getAgentCatalog } from './agent-catalog.js';
import { getGitStatus } from './git-service.js';
import { loadWorkspaces, saveWorkspaces, loadProjectMemory, saveProjectMemory } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

app.use(cors());
app.use(express.json());

// --- REST Endpoints ---

// Workspaces
app.get('/api/workspaces', (req, res) => {
  const workspaces = loadWorkspaces();
  res.json({ success: true, workspaces });
});

app.post('/api/workspaces', (req, res) => {
  const { workspaces } = req.body;
  if (!Array.isArray(workspaces)) {
    return res.status(400).json({ error: 'workspaces array is required' });
  }
  const ok = saveWorkspaces(workspaces);
  res.json({ success: ok });
});

// Agent Catalog
app.get('/api/agents', (req, res) => {
  const catalog = getAgentCatalog();
  res.json({ success: true, agents: catalog });
});

// Terminal Session Management
app.post('/api/terminal/spawn', (req, res) => {
  const { id, command, agentType, title, cwd, profile, cols, rows } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Terminal ID is required' });
  }
  const session = ptyManager.spawn(id, { command, agentType, title, cwd, profile, cols, rows });
  res.json({ success: true, terminalId: id, status: session.status });
});

app.post('/api/terminal/:id/write', (req, res) => {
  const { data } = req.body;
  const ok = ptyManager.write(req.params.id, data);
  res.json({ success: ok });
});

app.post('/api/terminal/:id/signal', (req, res) => {
  const { signal } = req.body;
  // \x03 is Ctrl-C (SIGINT)
  const char = signal === 'SIGINT' ? '\x03' : '\x04';
  const ok = ptyManager.write(req.params.id, char);
  res.json({ success: ok });
});

app.delete('/api/terminal/:id', (req, res) => {
  const ok = ptyManager.kill(req.params.id);
  res.json({ success: ok });
});

app.get('/api/terminal/:id/history', (req, res) => {
  const lines = parseInt(req.query.lines || '60', 10);
  const history = ptyManager.getHistory(req.params.id, lines);
  res.json({ success: true, history });
});

app.get('/api/terminals/active', (req, res) => {
  const active = ptyManager.getAllSessions();
  res.json({ success: true, sessions: active });
});

// Multi-Agent Broadcast Composer
app.post('/api/broadcast', (req, res) => {
  const { terminalIds, prompt } = req.body;
  if (!Array.isArray(terminalIds) || !prompt) {
    return res.status(400).json({ error: 'terminalIds and prompt are required' });
  }
  const results = {};
  for (const tid of terminalIds) {
    results[tid] = ptyManager.write(tid, `${prompt}\n`);
  }
  res.json({ success: true, results });
});

// Git Status
app.get('/api/git/status', async (req, res) => {
  const cwd = req.query.cwd || process.cwd();
  const status = await getGitStatus(cwd);
  res.json(status);
});

// Project Memory
app.get('/api/memory', (req, res) => {
  const memory = loadProjectMemory();
  res.json({ success: true, memory });
});

app.post('/api/memory', (req, res) => {
  const { memory } = req.body;
  if (!Array.isArray(memory)) {
    return res.status(400).json({ error: 'memory array is required' });
  }
  const ok = saveProjectMemory(memory);
  res.json({ success: ok });
});

// Code Studio / File Explorer
app.get('/api/fs/tree', (req, res) => {
  const targetDir = req.query.dir || process.cwd();
  try {
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const items = entries
      .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
      .slice(0, 100)
      .map(e => ({
        name: e.name,
        isDirectory: e.isDirectory(),
        path: path.join(targetDir, e.name)
      }));
    res.json({ success: true, currentDir: targetDir, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fs/file', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'path is required' });
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend in production if built
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

// --- WebSocket Upgrade Handling ---
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const match = url.pathname.match(/^\/ws\/terminal\/(.+)$/);

  if (match) {
    const terminalId = decodeURIComponent(match[1]);
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, terminalId);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws, request, terminalId) => {
  // Subscribe WebSocket to PTY session
  ptyManager.subscribe(terminalId, ws);

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'input') {
        ptyManager.write(terminalId, msg.data);
      } else if (msg.type === 'resize') {
        ptyManager.resize(terminalId, msg.cols, msg.rows);
      }
    } catch (err) {
      // Fallback: direct binary/text write
      ptyManager.write(terminalId, message.toString());
    }
  });

  ws.on('close', () => {
    ptyManager.unsubscribe(terminalId, ws);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Symvibe Server] running at http://localhost:${PORT}`);
  console.log(`[Symvibe Server] PTY ready for macOS native agents on zsh`);
});
