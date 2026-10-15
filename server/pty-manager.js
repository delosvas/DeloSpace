import pty from 'node-pty';
import os from 'os';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Ensure spawn-helper permissions on macOS
function ensureSpawnHelper() {
  if (process.platform === 'darwin') {
    const helperPaths = [
      path.join(process.cwd(), 'node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper'),
      path.join(process.cwd(), 'node_modules/node-pty/prebuilds/darwin-x64/spawn-helper'),
      path.join(process.cwd(), 'node_modules/node-pty/build/Release/spawn-helper'),
      path.join(__dirname, '../node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper'),
      path.join(__dirname, '../node_modules/node-pty/prebuilds/darwin-x64/spawn-helper'),
      ...(process.resourcesPath ? [
        path.join(process.resourcesPath, 'app.asar.unpacked/node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper'),
        path.join(process.resourcesPath, 'app.asar.unpacked/node_modules/node-pty/prebuilds/darwin-x64/spawn-helper'),
        path.join(process.resourcesPath, 'app.asar.unpacked/node_modules/node-pty/build/Release/spawn-helper')
      ] : [])
    ];
    for (const hp of helperPaths) {
      if (fs.existsSync(hp)) {
        try {
          fs.chmodSync(hp, 0o755);
        } catch {}
      }
    }
  }
}

class PtyManager {
  constructor() {
    this.sessions = new Map(); // id -> { ptyProcess, history: [], status: 'idle', subscribers: Set, metadata }
    ensureSpawnHelper();
  }

  spawn(id, options = {}) {
    ensureSpawnHelper();

    // If exists, return existing
    if (this.sessions.has(id)) {
      return this.sessions.get(id);
    }

    const cwd = options.cwd || process.cwd();
    const env = { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' };

    // Apply profile isolation if specified
    if (options.profile && options.profile !== 'default') {
      const profileDir = path.join(os.homedir(), `.symvibe-profiles`, options.agentType || 'agent', options.profile);
      if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
      }
      if (options.agentType === 'claude') {
        env.CLAUDE_CONFIG_DIR = profileDir;
      } else if (options.agentType === 'codex') {
        env.CODEX_HOME = profileDir;
      } else {
        env.HOME = profileDir;
      }
    }

    const shell = process.platform === 'darwin' ? '/bin/zsh' : (process.env.SHELL || '/bin/bash');
    const cols = options.cols || 80;
    const rows = options.rows || 24;

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env
    });

    const session = {
      id,
      ptyProcess,
      history: [],
      maxHistory: 500,
      status: 'idle', // 'idle' | 'working' | 'needs_input'
      statusTimer: null,
      subscribers: new Set(),
      metadata: {
        agentType: options.agentType || 'zsh',
        command: options.command || '',
        title: options.title || 'Terminal',
        cwd,
        profile: options.profile || 'default',
        createdAt: new Date().toISOString()
      }
    };

    ptyProcess.onData((data) => {
      // Store in history
      session.history.push(data);
      if (session.history.length > session.maxHistory) {
        session.history.shift();
      }

      // Mark as working
      this.updateStatus(session, 'working');

      // Forward to subscribers
      for (const ws of session.subscribers) {
        if (ws.readyState === 1) { // OPEN
          ws.send(JSON.stringify({ type: 'output', data }));
        }
      }

      // Debounce status check to detect when command completes or pauses for input
      clearTimeout(session.statusTimer);
      session.statusTimer = setTimeout(() => {
        this.detectStatus(session);
      }, 1200);
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
      this.updateStatus(session, 'idle');
      for (const ws of session.subscribers) {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'exit', exitCode, signal }));
        }
      }
      this.sessions.delete(id);
    });

    this.sessions.set(id, session);

    // If an initial command was provided (e.g. 'claude', 'codex'), send it
    if (options.command) {
      setTimeout(() => {
        ptyProcess.write(`${options.command}\n`);
      }, 600);
    }

    return session;
  }

  detectStatus(session) {
    // Analyze recent output to see if agent is prompting user or returned to prompt
    const recent = session.history.slice(-10).join('');
    const clean = recent.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim();

    // Check for interactive prompts
    const needsInputRegex = /(\[y\/n\]|\(y\/n\)|allow|approve|permit|choice|confirm|press enter|\?\s*$|>\s*$|input:)/i;
    // Check for shell prompt ending
    const shellPromptRegex = /([%#$]|\(base\))\s*$/;

    if (needsInputRegex.test(clean) && !shellPromptRegex.test(clean)) {
      this.updateStatus(session, 'needs_input');
    } else {
      this.updateStatus(session, 'idle');
    }
  }

  updateStatus(session, newStatus) {
    if (session.status !== newStatus) {
      session.status = newStatus;
      for (const ws of session.subscribers) {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'status', status: newStatus }));
        }
      }
    }
  }

  subscribe(id, ws) {
    const session = this.sessions.get(id);
    if (!session) return false;

    session.subscribers.add(ws);

    // Send history to new subscriber
    if (session.history.length > 0) {
      const fullHistory = session.history.join('');
      ws.send(JSON.stringify({ type: 'history', data: fullHistory }));
    }

    // Send current status
    ws.send(JSON.stringify({ type: 'status', status: session.status }));

    return true;
  }

  unsubscribe(id, ws) {
    const session = this.sessions.get(id);
    if (session) {
      session.subscribers.delete(ws);
    }
  }

  write(id, data) {
    const session = this.sessions.get(id);
    if (session && session.ptyProcess) {
      session.ptyProcess.write(data);
      return true;
    }
    return false;
  }

  resize(id, cols, rows) {
    const session = this.sessions.get(id);
    if (session && session.ptyProcess) {
      try {
        session.ptyProcess.resize(Math.max(10, cols), Math.max(5, rows));
        return true;
      } catch (err) {
        console.error(`[PTY] Resize error on ${id}:`, err.message);
      }
    }
    return false;
  }

  kill(id) {
    const session = this.sessions.get(id);
    if (session) {
      try {
        session.ptyProcess.kill();
      } catch {}
      this.sessions.delete(id);
      return true;
    }
    return false;
  }

  getHistory(id, maxLines = 100) {
    const session = this.sessions.get(id);
    if (!session) return '';
    const full = session.history.join('');
    const clean = full.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    const lines = clean.split('\n');
    return lines.slice(-maxLines).join('\n');
  }

  getAllSessions() {
    return Array.from(this.sessions.values()).map(s => ({
      id: s.id,
      status: s.status,
      metadata: s.metadata
    }));
  }
}

export const ptyManager = new PtyManager();
