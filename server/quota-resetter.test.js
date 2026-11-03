// Run: node --test server/quota-resetter.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

process.env.HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'delo-quota-'));
const { quotaResetter: q } = await import('./quota-resetter.js');
clearInterval(q.interval);

let fired = 0;
q.triggerWarmup = () => { fired++; };
const at = (d, hhmm) => { const [h, m] = hhmm.split(':').map(Number); const t = new Date(d); t.setHours(h, m, 0, 0); return t; };
const day = new Date(2026, 10, 3);

test('fires once per day, including late (throttled) ticks, never on save', () => {
  q.saveUserSettings({ enabled: true, targetTime: '14:30', leadHours: 5, repeat: 'daily', providers: ['claude'] });
  q.save({ lastAlarmDate: null });

  assert.equal(q.checkDue(at(day, '09:29')), false);       // before warmup (09:30)
  assert.equal(q.checkDue(at(day, '09:47')), true);        // tick delayed 17 min still fires
  assert.equal(q.checkDue(at(day, '09:48')), false);       // no double fire
  assert.equal(fired, 1);

  const next = new Date(day); next.setDate(next.getDate() + 1);
  assert.equal(q.checkDue(at(next, '11:00')), false);      // >1h overdue: skipped
  const third = new Date(day); third.setDate(third.getDate() + 2);
  assert.equal(q.checkDue(at(third, '09:30')), true);      // next day fires again
  assert.equal(fired, 2);
});

test('repeat once disables after firing', () => {
  q.save({ enabled: true, repeat: 'once', lastAlarmDate: null });
  assert.equal(q.checkDue(at(day, '09:30')), true);
  assert.equal(q.settings.enabled, false);
});

test('lead time crossing midnight', () => {
  q.save({ enabled: true, repeat: 'daily', targetTime: '02:00', leadHours: 5, lastAlarmDate: null });
  assert.equal(q.getWarmupTime(), '21:00');
  assert.equal(q.checkDue(at(day, '21:10')), true);
});
