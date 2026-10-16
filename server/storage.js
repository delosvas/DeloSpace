import fs from 'fs';
import path from 'path';
import os from 'os';

const DELO_DIR = path.join(os.homedir(), '.delospace');
const OLD_DIR = path.join(os.homedir(), '.symvibe');
const DATA_FILE = path.join(DELO_DIR, 'workspaces.json');
const MEMORY_FILE = path.join(DELO_DIR, 'memory.json');

// Ensure directory exists & migrate from old directory if present
if (!fs.existsSync(DELO_DIR)) {
  fs.mkdirSync(DELO_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE) && fs.existsSync(path.join(OLD_DIR, 'workspaces.json'))) {
  try {
    fs.copyFileSync(path.join(OLD_DIR, 'workspaces.json'), DATA_FILE);
  } catch (_) {}
}
if (!fs.existsSync(MEMORY_FILE) && fs.existsSync(path.join(OLD_DIR, 'memory.json'))) {
  try {
    fs.copyFileSync(path.join(OLD_DIR, 'memory.json'), MEMORY_FILE);
  } catch (_) {}
}

const defaultWorkspaces = [
  {
    id: 'ws-main',
    name: 'Main Mission',
    cwd: process.cwd(),
    nodes: [
      {
        id: 'node-claude-1',
        type: 'terminal',
        title: 'Claude Code · Architecture',
        agentType: 'claude',
        command: 'claude',
        cwd: process.cwd(),
        profile: 'default',
        x: 60,
        y: 80,
        width: 680,
        height: 520,
        status: 'idle'
      },
      {
        id: 'node-codex-1',
        type: 'terminal',
        title: 'Codex · Implementation',
        agentType: 'codex',
        command: 'codex',
        cwd: process.cwd(),
        profile: 'default',
        x: 780,
        y: 80,
        width: 680,
        height: 520,
        status: 'idle'
      },
      {
        id: 'node-kanban-1',
        type: 'kanban',
        title: 'Sprint Board',
        x: 60,
        y: 630,
        width: 680,
        height: 440,
        data: {
          columns: [
            { id: 'todo', title: 'To Do', items: ['Define agent tool schemas', 'Build state handoff pipeline'] },
            { id: 'inprogress', title: 'In Progress', items: ['Run Claude & Codex side-by-side'] },
            { id: 'done', title: 'Done', items: ['Spawn real macOS PTY consoles', 'Infinite canvas navigation'] }
          ]
        }
      },
      {
        id: 'node-notes-1',
        type: 'notes',
        title: 'Project Instructions & Context',
        x: 780,
        y: 630,
        width: 680,
        height: 440,
        data: {
          content: `# Mission Objectives\n\n- Coordinate multi-agent tasks between **Claude Code** and **Codex**.\n- Use the **Handoff** button to summarize one agent's progress and pass the prompt to the other.\n- Keep track of git status and live web previews directly on this board.\n\n### Rules\n1. Always verify tests before committing.\n2. Keep agent prompts modular.\n3. Check status indicators: 🟢 Working, 🟡 Needs Input, ⚪ Idle.`
        }
      },
      {
        id: 'node-web-1',
        type: 'webtile',
        title: 'Local Preview',
        x: 1500,
        y: 80,
        width: 640,
        height: 990,
        data: {
          url: 'about:blank',
          device: 'desktop'
        }
      }
    ],
    canvas: {
      panX: 0,
      panY: 0,
      zoom: 0.85
    }
  }
];

export function loadWorkspaces() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.error('[Storage] Error reading workspaces:', err.message);
  }
  return defaultWorkspaces;
}

export function saveWorkspaces(workspaces) {
  try {
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(workspaces, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
    return true;
  } catch (err) {
    console.error('[Storage] Error saving workspaces:', err.message);
    return false;
  }
}

export function loadProjectMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('[Storage] Error reading memory:', err.message);
  }
  return [
    {
      id: 'mem-1',
      title: 'Coding Guidelines',
      content: 'Maintain clean architecture, write self-documenting code, and add comprehensive comments for complex state flows.',
      tags: ['standards', 'architecture']
    },
    {
      id: 'mem-2',
      title: 'Git Commit Conventions',
      content: 'Use conventional commits: feat:, fix:, docs:, refactor:, test:.',
      tags: ['git', 'conventions']
    }
  ];
}

export function saveProjectMemory(memoryItems) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memoryItems, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Storage] Error saving memory:', err.message);
    return false;
  }
}
