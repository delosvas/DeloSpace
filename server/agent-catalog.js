import { execSync } from 'child_process';
import os from 'os';
import path from 'path';

function findBinary(name) {
  try {
    const res = execSync(`which ${name} 2>/dev/null`, {
      encoding: 'utf-8',
      env: process.env
    }).trim();
    return res || null;
  } catch {
    return null;
  }
}

export function getAgentCatalog() {
  const agents = [
    {
      id: 'claude',
      name: 'Claude Code',
      binary: 'claude',
      installed: !!findBinary('claude'),
      path: findBinary('claude'),
      description: 'Anthropic’s agentic coding assistant for terminal workflows',
      color: '#D97706',
      badgeBg: 'rgba(217, 119, 6, 0.15)',
      badgeBorder: 'rgba(217, 119, 6, 0.4)',
      defaultCommand: 'claude',
      profileEnvKey: 'CLAUDE_CONFIG_DIR',
      defaultProfileDir: path.join(os.homedir(), '.claude')
    },
    {
      id: 'codex',
      name: 'OpenAI Codex',
      binary: 'codex',
      installed: !!findBinary('codex'),
      path: findBinary('codex'),
      description: 'OpenAI’s code generation and autonomous coding agent CLI',
      color: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeBorder: 'rgba(16, 185, 129, 0.4)',
      defaultCommand: 'codex',
      profileEnvKey: 'CODEX_HOME',
      defaultProfileDir: path.join(os.homedir(), '.codex')
    },
    {
      id: 'gemini',
      name: 'Gemini CLI',
      binary: 'gemini',
      installed: !!findBinary('gemini'),
      path: findBinary('gemini'),
      description: 'Google Gemini developer command-line assistant',
      color: '#3B82F6',
      badgeBg: 'rgba(59, 130, 246, 0.15)',
      badgeBorder: 'rgba(59, 130, 246, 0.4)',
      defaultCommand: 'gemini',
      profileEnvKey: 'GEMINI_HOME',
      defaultProfileDir: path.join(os.homedir(), '.gemini')
    },
    {
      id: 'opencode',
      name: 'OpenCode',
      binary: 'opencode',
      installed: !!findBinary('opencode'),
      path: findBinary('opencode'),
      description: 'Open source terminal AI coding assistant',
      color: '#8B5CF6',
      badgeBg: 'rgba(139, 92, 246, 0.15)',
      badgeBorder: 'rgba(139, 92, 246, 0.4)',
      defaultCommand: 'opencode',
      profileEnvKey: 'OPENCODE_HOME',
      defaultProfileDir: path.join(os.homedir(), '.opencode')
    },
    {
      id: 'kimi',
      name: 'Kimi CLI',
      binary: 'kimi',
      installed: !!findBinary('kimi'),
      path: findBinary('kimi'),
      description: 'Moonshot AI terminal agent',
      color: '#06B6D4',
      badgeBg: 'rgba(6, 182, 212, 0.15)',
      badgeBorder: 'rgba(6, 182, 212, 0.4)',
      defaultCommand: 'kimi',
      profileEnvKey: 'KIMI_HOME',
      defaultProfileDir: path.join(os.homedir(), '.kimi')
    },
    {
      id: 'deepcode',
      name: 'DeepCode CLI',
      binary: 'deepcode',
      installed: !!findBinary('deepcode'),
      path: findBinary('deepcode'),
      description: 'DeepCode terminal assistant',
      color: '#EC4899',
      badgeBg: 'rgba(236, 72, 153, 0.15)',
      badgeBorder: 'rgba(236, 72, 153, 0.4)',
      defaultCommand: 'deepcode',
      profileEnvKey: 'DEEPCODE_HOME',
      defaultProfileDir: path.join(os.homedir(), '.deepcode')
    },
    {
      id: 'aider',
      name: 'Aider',
      binary: 'aider',
      installed: !!findBinary('aider'),
      path: findBinary('aider'),
      description: 'AI pair programming in your terminal',
      color: '#EC4899',
      badgeBg: 'rgba(236, 72, 153, 0.15)',
      badgeBorder: 'rgba(236, 72, 153, 0.4)',
      defaultCommand: 'aider',
      profileEnvKey: 'AIDER_HOME',
      defaultProfileDir: path.join(os.homedir(), '.aider')
    },
    {
      id: 'grok',
      name: 'Grok CLI',
      binary: 'grok',
      installed: !!findBinary('grok'),
      path: findBinary('grok'),
      description: 'xAI terminal coding assistant',
      color: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeBorder: 'rgba(245, 158, 11, 0.4)',
      defaultCommand: 'grok',
      profileEnvKey: 'GROK_HOME',
      defaultProfileDir: path.join(os.homedir(), '.grok')
    },
    {
      id: 'zsh',
      name: 'macOS Zsh Shell',
      binary: '/bin/zsh',
      installed: true,
      path: '/bin/zsh',
      description: 'Direct native macOS interactive shell',
      color: '#FF8038',
      badgeBg: 'rgba(255, 128, 56, 0.15)',
      badgeBorder: 'rgba(255, 128, 56, 0.4)',
      defaultCommand: '',
      profileEnvKey: null,
      defaultProfileDir: null
    }
  ];

  return agents;
}
