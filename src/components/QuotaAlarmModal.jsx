import React, { useState, useEffect } from 'react';
import { 
  AlarmClock, 
  Clock, 
  Zap, 
  Check, 
  X, 
  RotateCcw, 
  ShieldCheck, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { fetchQuotaAlarm, saveQuotaAlarm, triggerQuotaPingNow } from '../services/api';

const AVAILABLE_PROVIDERS = [
  { id: 'claude', name: 'Claude Code', desc: 'Anthropic 5h rolling window (Haiku warmup)', color: '#FF8038' },
  { id: 'codex', name: 'Codex / OpenAI', desc: 'OpenAI rate limit reset window (gpt-4o-mini)', color: '#10B981' },
  { id: 'gemini', name: 'Gemini CLI', desc: 'Google Gemini quota window (Flash warmup)', color: '#3B82F6' },
  { id: 'kimi', name: 'Kimi CLI', desc: 'Moonshot AI rolling reset window', color: '#06B6D4' },
  { id: 'deepcode', name: 'DeepCode CLI', desc: 'DeepCode rate limit window', color: '#EC4899' },
  { id: 'aider', name: 'Aider', desc: 'Aider session rate limit reset', color: '#8B5CF6' }
];

export default function QuotaAlarmModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    enabled: false,
    targetTime: '09:00',
    leadHours: 5,
    repeat: 'daily',
    providers: ['claude', 'codex'],
    lastTriggered: null,
    history: []
  });

  const [warmupTime, setWarmupTime] = useState('04:00');
  const [isTriggering, setIsTriggering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadData = async () => {
    try {
      const res = await fetchQuotaAlarm();
      if (res.success && res.settings) {
        setSettings(res.settings);
        setWarmupTime(res.warmupTime || '04:00');
      }
    } catch (err) {
      console.warn('Failed to fetch quota alarm settings:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleProvider = (id) => {
    const exists = settings.providers.includes(id);
    const updated = exists 
      ? settings.providers.filter(p => p !== id) 
      : [...settings.providers, id];
    setSettings(prev => ({ ...prev, providers: updated }));
  };

  const calculateWarmupPreview = (targetTime, leadHours) => {
    const [tH, tM] = (targetTime || '09:00').split(':').map(Number);
    const lead = Number(leadHours) || 5;
    let wH = tH - lead;
    while (wH < 0) wH += 24;
    return `${String(wH).padStart(2, '0')}:${String(tM).padStart(2, '0')}`;
  };

  const handleTargetTimeChange = (val) => {
    setSettings(prev => ({ ...prev, targetTime: val }));
    setWarmupTime(calculateWarmupPreview(val, settings.leadHours));
  };

  const handleLeadHoursChange = (val) => {
    const num = Math.max(1, Math.min(12, Number(val)));
    setSettings(prev => ({ ...prev, leadHours: num }));
    setWarmupTime(calculateWarmupPreview(settings.targetTime, num));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveQuotaAlarm(settings);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Alarm settings saved successfully!' });
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerNow = async () => {
    if (settings.providers.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'Please select at least one provider to ping.' });
      return;
    }
    setIsTriggering(true);
    setFeedbackMsg(null);
    try {
      const res = await triggerQuotaPingNow(settings.providers);
      if (res.success) {
        setFeedbackMsg({ 
          type: 'success', 
          text: `Warmup ping sent! Reset timer initiated for ${settings.providers.join(', ')}.` 
        });
        loadData();
      } else {
        setFeedbackMsg({ type: 'error', text: 'Warmup trigger failed.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: `Failed: ${err.message}` });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl sym-glass border border-[rgba(241,233,221,0.15)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(241,233,221,0.1)] bg-[rgba(20,17,14,0.9)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FF8038]/15 border border-[#FF8038]/30 text-[#FF8038]">
              <AlarmClock size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#F1E9DD] flex items-center gap-2">
                Quota Resetter Alarm
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#FF8038]/15 text-[#FF8038] border border-[#FF8038]/30">
                  Rate-Limit Warmup
                </span>
              </h2>
              <p className="text-xs text-[#8B7E72] mt-0.5">
                Automatically initiates provider 5-hour rolling reset timers in advance.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B7E72] hover:text-[#F1E9DD] hover:bg-white/5 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Feedback banner */}
          {feedbackMsg && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}>
              {feedbackMsg.type === 'success' ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Master Enable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#14110E] border border-[rgba(241,233,221,0.08)]">
            <div>
              <span className="text-sm font-medium text-[#F1E9DD] block">
                Automatic Warmup Alarm
              </span>
              <span className="text-xs text-[#8B7E72]">
                If DeloSpace is open, automatically pings providers 5 hours prior to reset target.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#25201B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF8038]"></div>
            </label>
          </div>

          {/* Time & Schedule Config */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Target Reset Time */}
            <div className="p-3.5 rounded-xl bg-[#14110E] border border-[rgba(241,233,221,0.08)]">
              <label className="text-xs text-[#8B7E72] block mb-1.5 flex items-center gap-1.5">
                <Clock size={12} className="text-[#FF8038]" />
                Target Reset Time
              </label>
              <input
                type="time"
                value={settings.targetTime}
                onChange={(e) => handleTargetTimeChange(e.target.value)}
                className="w-full bg-[#0B0908] border border-[rgba(241,233,221,0.12)] rounded-lg px-2.5 py-1.5 text-sm font-mono text-[#F1E9DD] focus:outline-none focus:border-[#FF8038]"
              />
              <span className="text-[10px] text-[#8B7E72] block mt-1">When you want full quota ready</span>
            </div>

            {/* Lead Time Hours */}
            <div className="p-3.5 rounded-xl bg-[#14110E] border border-[rgba(241,233,221,0.08)]">
              <label className="text-xs text-[#8B7E72] block mb-1.5 flex items-center gap-1.5">
                <RotateCcw size={12} className="text-[#3B82F6]" />
                Lead Time (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={settings.leadHours}
                onChange={(e) => handleLeadHoursChange(e.target.value)}
                className="w-full bg-[#0B0908] border border-[rgba(241,233,221,0.12)] rounded-lg px-2.5 py-1.5 text-sm font-mono text-[#F1E9DD] focus:outline-none focus:border-[#3B82F6]"
              />
              <span className="text-[10px] text-[#8B7E72] block mt-1">Default 5h for Claude/Codex</span>
            </div>

            {/* Recurrence */}
            <div className="p-3.5 rounded-xl bg-[#14110E] border border-[rgba(241,233,221,0.08)]">
              <label className="text-xs text-[#8B7E72] block mb-1.5 flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#10B981]" />
                Recurrence
              </label>
              <select
                value={settings.repeat}
                onChange={(e) => setSettings(prev => ({ ...prev, repeat: e.target.value }))}
                className="w-full bg-[#0B0908] border border-[rgba(241,233,221,0.12)] rounded-lg px-2.5 py-1.5 text-sm font-mono text-[#F1E9DD] focus:outline-none focus:border-[#10B981]"
              >
                <option value="daily">Every Day</option>
                <option value="once">Once</option>
              </select>
              <span className="text-[10px] text-[#8B7E72] block mt-1">Alarm repeats automatically</span>
            </div>
          </div>

          {/* Schedule Summary Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <div>
                <span className="text-xs font-semibold text-amber-200">
                  Calculated Warmup Time: {warmupTime}
                </span>
                <p className="text-[11px] text-amber-300/80">
                  A tiny ping sends at <strong className="text-amber-100">{warmupTime}</strong> so your 5h window resets by <strong className="text-amber-100">{settings.targetTime}</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={handleTriggerNow}
              disabled={isTriggering}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FF8038] hover:bg-[#FF8038]/90 text-white shadow-md flex items-center gap-1.5 disabled:opacity-50 transition"
              title="Send a warmup message right now to initiate reset window"
            >
              <Zap size={13} className={isTriggering ? 'animate-bounce' : ''} />
              <span>{isTriggering ? 'Pinging…' : 'Ping Now'}</span>
            </button>
          </div>

          {/* Providers to Ping */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#8B7E72] block mb-2.5">
              Select AI Providers to Warm Up
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_PROVIDERS.map(p => {
                const selected = settings.providers.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProvider(p.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      selected 
                        ? 'bg-[#1F1A16] border-[#FF8038]/50 shadow-sm' 
                        : 'bg-[#14110E] border-[rgba(241,233,221,0.08)] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-medium text-[#F1E9DD] block flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </span>
                      <span className="text-[10px] text-[#8B7E72]">{p.desc}</span>
                    </div>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                      selected ? 'bg-[#FF8038] border-[#FF8038] text-white' : 'border-[rgba(241,233,221,0.2)]'
                    }`}>
                      {selected && <Check size={11} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trigger History */}
          {settings.history && settings.history.length > 0 && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8B7E72] block mb-2">
                Recent Warmup History
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {settings.history.slice(0, 5).map((h, i) => (
                  <div key={i} className="text-[11px] p-2 rounded-lg bg-[#14110E] border border-[rgba(241,233,221,0.06)] flex items-center justify-between font-mono text-[#CDC2B3]">
                    <span>{new Date(h.timestamp).toLocaleString()}</span>
                    <span className="text-emerald-400">Pings sent ({h.results?.length || 0})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[rgba(241,233,221,0.1)] bg-[rgba(20,17,14,0.95)] flex items-center justify-between">
          <span className="text-xs text-[#8B7E72]">
            {settings.enabled ? `Alarm Active · Fires at ${warmupTime}` : 'Alarm Paused'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#CDC2B3] hover:text-[#F1E9DD] hover:bg-white/5 transition"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="sym-btn-primary px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <Check size={13} />
              <span>{isSaving ? 'Saving…' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
