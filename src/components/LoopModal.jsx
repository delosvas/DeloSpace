import React, { useState, useEffect } from 'react';
import { 
  Infinity as InfinityIcon, 
  Play, 
  Square, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Clock, 
  Zap, 
  Target,
  Sparkles,
  Layers
} from 'lucide-react';

export default function LoopModal({
  isOpen,
  onClose,
  terminals = [],
  activeLoops = [],
  onStartLoop,
  onStopLoop
}) {
  const [selectedTerminalId, setSelectedTerminalId] = useState(terminals[0]?.id || '');
  const [directive, setDirective] = useState('npm test && claude "analyze any failure and fix it"');
  const [triggerType, setTriggerType] = useState('on_idle'); // 'on_idle', 'interval', 'regex'
  const [intervalSec, setIntervalSec] = useState(30);
  const [stopCondition, setStopCondition] = useState('tests passed');
  const [maxIterations, setMaxIterations] = useState(10);

  useEffect(() => {
    if (!selectedTerminalId && terminals.length > 0) {
      setSelectedTerminalId(terminals[0].id);
    }
  }, [terminals, selectedTerminalId]);

  if (!isOpen) return null;

  const handleStart = (e) => {
    e.preventDefault();
    if (!selectedTerminalId || !directive.trim()) return;

    onStartLoop({
      id: `loop-${Date.now()}`,
      terminalId: selectedTerminalId,
      directive: directive.trim(),
      triggerType,
      intervalSec: Number(intervalSec),
      stopCondition: stopCondition.trim(),
      maxIterations: Number(maxIterations),
      currentIteration: 0,
      status: 'running',
      createdAt: new Date().toISOString()
    });

    onClose();
  };

  const PRESET_LOOPS = [
    {
      title: 'Continuous Test & Auto-Repair',
      directive: 'npm test || claude "read the failing test stack trace, inspect code, and patch it"',
      trigger: 'on_idle',
      stop: 'passing',
      max: 8
    },
    {
      title: 'Git Health & Dependency Watchdog',
      directive: 'git status --porcelain && npm run lint',
      trigger: 'interval',
      interval: 60,
      stop: '',
      max: 20
    },
    {
      title: 'Codex Benchmark & Optimization Loop',
      directive: 'codex "refactor the bottleneck function for performance and verify with benchmarks"',
      trigger: 'on_idle',
      stop: '100% throughput achieved',
      max: 5
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl sym-glass rounded-2xl border border-[rgba(241,233,221,0.15)] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(241,233,221,0.08)] bg-[rgba(20,17,14,0.85)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-orange-500/40 flex items-center justify-center text-[#FF8038]">
              <InfinityIcon size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#F1E9DD] flex items-center gap-2">
                Autonomous Agent Loops
                <span className="text-[10px] font-mono uppercase bg-[#FF8038]/20 text-[#FF8038] px-2 py-0.5 rounded-full border border-[#FF8038]/30">
                  DeloSpace Engine
                </span>
              </h3>
              <p className="text-xs text-[#8B7E72]">
                Continuous autonomous test-and-repair loops with intelligent stop conditions
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[rgba(241,233,221,0.1)] text-[#8B7E72] hover:text-[#F1E9DD] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Tabs / Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Active Running Loops */}
          {activeLoops.length > 0 && (
            <div className="space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#FF8038] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                Active Loops ({activeLoops.length})
              </div>
              <div className="space-y-2">
                {activeLoops.map(loop => {
                  const term = terminals.find(t => t.id === loop.terminalId);
                  return (
                    <div 
                      key={loop.id}
                      className="p-3.5 rounded-xl bg-[#14110E] border border-[rgba(241,233,221,0.08)] flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#F1E9DD]">
                            {term?.title || 'Terminal'}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F1A16] text-[#CDC2B3]">
                            Iter {loop.currentIteration} / {loop.maxIterations}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {loop.status}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-[#8B7E72] truncate max-w-md">
                          {loop.directive}
                        </div>
                      </div>
                      <button
                        onClick={() => onStopLoop(loop.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition"
                      >
                        <Square size={12} />
                        <span>Halt Loop</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8B7E72]">
              Preset Autonomous Recipes
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_LOOPS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDirective(p.directive);
                    setTriggerType(p.trigger);
                    if (p.interval) setIntervalSec(p.interval);
                    if (p.stop) setStopCondition(p.stop);
                    if (p.max) setMaxIterations(p.max);
                  }}
                  className="text-left p-2.5 rounded-xl bg-[#14110E] hover:bg-[#1C1814] border border-[rgba(241,233,221,0.06)] hover:border-[#FF8038]/30 transition group"
                >
                  <div className="text-xs font-semibold text-[#F1E9DD] group-hover:text-[#FF8038] mb-1">
                    {p.title}
                  </div>
                  <div className="text-[11px] font-mono text-[#8B7E72] truncate">
                    {p.directive}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleStart} className="space-y-4">
            {/* Target Agent Terminal */}
            <div>
              <label className="block text-xs font-medium text-[#CDC2B3] mb-1.5">
                Target Agent Console
              </label>
              <select
                value={selectedTerminalId}
                onChange={(e) => setSelectedTerminalId(e.target.value)}
                className="w-full bg-[#14110E] border border-[rgba(241,233,221,0.12)] rounded-lg px-3 py-2 text-sm text-[#F1E9DD] focus:outline-none focus:border-[#FF8038]"
              >
                {terminals.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.title} ({term.agentType}) — {term.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Directive / Command to loop */}
            <div>
              <label className="block text-xs font-medium text-[#CDC2B3] mb-1.5 flex items-center justify-between">
                <span>Autonomous Directive (Executed on each cycle)</span>
                <span className="text-[11px] font-mono text-[#8B7E72]">Shell / Agent CLI</span>
              </label>
              <textarea
                value={directive}
                onChange={(e) => setDirective(e.target.value)}
                rows={3}
                placeholder="e.g. pytest && claude 'resolve failures'"
                className="w-full bg-[#14110E] border border-[rgba(241,233,221,0.12)] rounded-lg px-3 py-2 text-xs font-mono text-[#F1E9DD] placeholder-[#8B7E72] focus:outline-none focus:border-[#FF8038]"
              />
            </div>

            {/* Trigger Mode */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#CDC2B3] mb-1.5">
                  Cycle Trigger
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTriggerType('on_idle')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                      triggerType === 'on_idle'
                        ? 'bg-[#FF8038]/20 border-[#FF8038] text-[#F1E9DD]'
                        : 'bg-[#14110E] border-[rgba(241,233,221,0.08)] text-[#8B7E72] hover:text-[#CDC2B3]'
                    }`}
                  >
                    On Agent Idle
                  </button>
                  <button
                    type="button"
                    onClick={() => setTriggerType('interval')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                      triggerType === 'interval'
                        ? 'bg-[#FF8038]/20 border-[#FF8038] text-[#F1E9DD]'
                        : 'bg-[#14110E] border-[rgba(241,233,221,0.08)] text-[#8B7E72] hover:text-[#CDC2B3]'
                    }`}
                  >
                    Timer Interval
                  </button>
                </div>
              </div>

              {triggerType === 'interval' ? (
                <div>
                  <label className="block text-xs font-medium text-[#CDC2B3] mb-1.5">
                    Interval (Seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(e.target.value)}
                    className="w-full bg-[#14110E] border border-[rgba(241,233,221,0.12)] rounded-lg px-3 py-2 text-sm text-[#F1E9DD] focus:outline-none focus:border-[#FF8038]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-[#CDC2B3] mb-1.5">
                    Max Iterations (Safety Limit)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(e.target.value)}
                    className="w-full bg-[#14110E] border border-[rgba(241,233,221,0.12)] rounded-lg px-3 py-2 text-sm text-[#F1E9DD] focus:outline-none focus:border-[#FF8038]"
                  />
                </div>
              )}
            </div>

            {/* Termination Goal Condition */}
            <div>
              <label className="block text-xs font-medium text-[#CDC2B3] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Target size={13} className="text-emerald-400" />
                  <span>Success Stop Condition (Regex or Substring)</span>
                </span>
                <span className="text-[11px] font-mono text-[#8B7E72]">Stops automatically upon match</span>
              </label>
              <input
                type="text"
                value={stopCondition}
                onChange={(e) => setStopCondition(e.target.value)}
                placeholder="e.g. 'all tests passed', '0 errors', 'Done in'"
                className="w-full bg-[#14110E] border border-[rgba(241,233,221,0.12)] rounded-lg px-3 py-2 text-xs font-mono text-[#F1E9DD] placeholder-[#8B7E72] focus:outline-none focus:border-[#FF8038]"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[rgba(241,233,221,0.08)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#8B7E72] hover:text-[#F1E9DD] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedTerminalId || !directive.trim()}
                className="sym-btn-primary px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#FF8038]/20 disabled:opacity-40"
              >
                <Play size={13} />
                <span>Launch Autonomous Loop</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
