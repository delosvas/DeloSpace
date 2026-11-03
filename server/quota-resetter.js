import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';

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
  lastAlarmDate: null, // local YYYY-MM-DD of the last scheduled occurrence handled
  history: []
};

// A tick delayed by App Nap / a locked screen still fires if it lands within this window
const LATE_GRACE_MS = 60 * 60 * 1000;
const PING_TIMEOUT_MS = 3 * 60 * 1000;

const localDateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
    const timestamp = new Date().toISOString();

    console.log(`[QuotaResetter] Initiating warmup ping for: ${providers.join(', ')}`);

    const results = await Promise.all(providers.map(p => this.pingProvider(p)));

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
    // Plain prompts, no 2>/dev/null: failures must show up in history
    const commands = {
      claude: `claude -p "hi" --model haiku`,
      codex: `codex exec --skip-git-repo-check "hi"`,
      openai: `codex exec --skip-git-repo-check "hi"`,
      gemini: `gemini -p "hi"`,
      kimi: `kimi --prompt "hi" || kimi "hi"`,
      deepcode: `deepcode "hi" || deepcode check`,
      aider: `aider --message "hi" --model haiku --no-git --yes-always`
    };
    const cmd = commands[provider] || `echo "ping ${provider}"`;
    const shell = process.platform === 'darwin' ? '/bin/zsh' : '/bin/bash';

    return new Promise((resolve) => {
      // -lic loads the user's PATH even when the app was launched from Finder; wait for the CLI to finish
      const child = execFile(shell, ['-lic', cmd], {
        cwd: os.tmpdir(),
        env: process.env,
        timeout: PING_TIMEOUT_MS,
        killSignal: 'SIGKILL',
        maxBuffer: 4 * 1024 * 1024
      }, (err, stdout, stderr) => {
        const tail = `${stdout}\n${stderr}`.trim().split('\n').slice(-4).join('\n').slice(-500);
        if (err) {
          const why = err.killed ? `timed out after ${PING_TIMEOUT_MS / 1000}s` : `exit ${err.code}`;
          console.warn(`[QuotaResetter] ${provider} ping failed (${why}):`, tail);
          resolve({ provider, success: false, error: `${why}: ${tail}` });
        } else {
          resolve({ provider, success: true, message: `Ping sent to ${provider}` });
        }
      });
      child.stdin?.end();
    });
  }

  /**
   * Fires once per day for the most recent warmup occurrence if it's due and
   * at most LATE_GRACE_MS overdue, so throttled/late ticks don't skip the day.
   */
  checkDue(now = new Date()) {
    if (!this.settings.enabled) return false;
    const due = this.lastOccurrence(now);
    if (now - due > LATE_GRACE_MS) return false;
    if (this.settings.lastAlarmDate === localDateKey(due)) return false;

    // Mark before the async pings so the next tick can't double-fire
    this.save({ lastAlarmDate: localDateKey(due), ...(this.settings.repeat === 'once' ? { enabled: false } : {}) });
    this.triggerWarmup();
    return true;
  }

  /** User-facing settings update; occurrences already past count as handled so saving never fires instantly. */
  saveUserSettings(input) {
    const { enabled, targetTime, leadHours, repeat, providers } = input;
    this.save({ enabled, targetTime, leadHours, repeat, providers });
    return this.save({ lastAlarmDate: localDateKey(this.lastOccurrence()) });
  }

  /** Most recent warmup time at or before `now`. */
  lastOccurrence(now = new Date()) {
    const [wH, wM] = this.getWarmupTime().split(':').map(Number);
    const due = new Date(now);
    due.setHours(wH, wM, 0, 0);
    if (due > now) due.setDate(due.getDate() - 1);
    return due;
  }

  startWatcher() {
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.checkDue(), 20000);
  }
}

export const quotaResetter = new QuotaResetter();
