import fs from 'fs';
import path from 'path';
import os from 'os';
import pty from 'node-pty';

const DELO_DIR = path.join(os.homedir(), '.delospace');
const CONFIG_FILE = path.join(DELO_DIR, 'quota-alarm.json');

if (!fs.existsSync(DELO_DIR)) {
  fs.mkdirSync(DELO_DIR, { recursive: true });
}

const DEFAULT_SETTINGS = {
  enabled: false,
  targetTime: '09:00',
  leadHours: 5,
  repeat: 'daily', // 'once' | 'daily'
  providers: ['claude', 'codex'],
  lastTriggered: null,
  history: []
};

class QuotaResetter {
  constructor() {
    this.settings = this.load();
    this.interval = null;
    this.startWatcher();
  }

  load() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('[QuotaResetter] Failed to read config:', e.message);
    }
    return { ...DEFAULT_SETTINGS };
  }

  save(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (e) {
      console.error('[QuotaResetter] Failed to write config:', e.message);
    }
    return this.settings;
  }

  getSettings() {
    return this.settings;
  }

  /**
   * Calculates the trigger time given targetTime (HH:MM) and leadHours (e.g. 5)
   * Example: target 09:00 - 5h = 04:00
   */
  getWarmupTime() {
    const [tH, tM] = (this.settings.targetTime || '09:00').split(':').map(Number);
    const lead = Number(this.settings.leadHours) || 5;

    let wH = tH - lead;
    while (wH < 0) wH += 24;
    return `${String(wH).padStart(2, '0')}:${String(tM).padStart(2, '0')}`;
  }

  /**
   * Spawns a lightweight command for each selected provider to ping the API
   * with an ultra-cheap model (e.g. Haiku) to start the provider's rolling reset window.
   */
  async triggerWarmup(providersOverride = null) {
    const providers = providersOverride || this.settings.providers || ['claude'];
    const results = [];
    const timestamp = new Date().toISOString();

    console.log(`[QuotaResetter] Initiating warmup ping for: ${providers.join(', ')}`);

    for (const provider of providers) {
      const res = await this.pingProvider(provider);
      results.push({ provider, ...res });
    }

    const logEntry = {
      timestamp,
      results,
      status: results.every(r => r.success) ? 'success' : 'partial'
    };

    const history = [logEntry, ...(this.settings.history || [])].slice(0, 30);
    this.save({
      lastTriggered: timestamp,
      history
    });

    return logEntry;
  }

  pingProvider(provider) {
    return new Promise((resolve) => {
      const shell = process.platform === 'darwin' ? '/bin/zsh' : '/bin/bash';
      let cmd = '';

      switch (provider) {
        case 'claude':
          // Ping claude with a cheap prompt to haiku model to initiate the 5-hour rolling timer
          cmd = `claude -p "hi (dont answer)" --model claude-3-5-haiku-20241022 || claude -p "hi" 2>/dev/null\n`;
          break;
        case 'codex':
        case 'openai':
          // Ping codex or openai CLI
          cmd = `codex "hi" 2>/dev/null || openai api chat.completions.create -m gpt-4o-mini -g user "hi" 2>/dev/null\n`;
          break;
        case 'gemini':
          cmd = `gemini "hi" 2>/dev/null\n`;
          break;
        case 'kimi':
          cmd = `kimi --prompt "hi" 2>/dev/null || kimi "hi" 2>/dev/null\n`;
          break;
        case 'deepcode':
          cmd = `deepcode "hi" 2>/dev/null || deepcode check 2>/dev/null\n`;
          break;
        case 'aider':
          cmd = `aider --message "hi" --model haiku --no-git 2>/dev/null\n`;
          break;
        default:
          cmd = `echo "ping ${provider}"\n`;
      }

      try {
        const ptyProc = pty.spawn(shell, ['-l'], {
          name: 'xterm-256color',
          cols: 80,
          rows: 24,
          cwd: process.cwd(),
          env: process.env
        });

        let output = '';
        ptyProc.onData((data) => {
          output += data;
        });

        // Send command after short spawn pause
        setTimeout(() => {
          try {
            ptyProc.write(cmd);
          } catch (_) {}
        }, 300);

        // Allow 3.5 seconds to establish connection and register API usage, then terminate
        setTimeout(() => {
          try {
            ptyProc.kill('SIGKILL');
          } catch (_) {}
          resolve({ success: true, message: `Ping sent to ${provider}` });
        }, 3500);

      } catch (err) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  startWatcher() {
    if (this.interval) clearInterval(this.interval);

    this.interval = setInterval(() => {
      if (!this.settings.enabled) return;

      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const warmupTime = this.getWarmupTime();

      if (currentHHMM === warmupTime) {
        // Prevent firing multiple times in the same minute
        const last = this.settings.lastTriggered ? new Date(this.settings.lastTriggered) : null;
        if (!last || (now.getTime() - last.getTime() > 90000)) {
          this.triggerWarmup();

          if (this.settings.repeat === 'once') {
            this.save({ enabled: false });
          }
        }
      }
    }, 25000); // Check every 25 seconds
  }
}

export const quotaResetter = new QuotaResetter();
