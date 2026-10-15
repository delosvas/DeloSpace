import React from 'react';
import { Radar, X, Crosshair, ShieldAlert, Cpu } from 'lucide-react';
import StatusBadge from './common/StatusBadge';
import { signalTerminal } from '../services/api';

export default function MissionMapDrawer({ 
  isOpen, 
  onClose, 
  terminals = [], 
  onFocusNode 
}) {
  if (!isOpen) return null;

  const workingCount = terminals.filter(t => t.status === 'working').length;
  const needsInputCount = terminals.filter(t => t.status === 'needs_input').length;
  const idleCount = terminals.filter(t => t.status !== 'working' && t.status !== 'needs_input').length;

  return (
    <div className="fixed top-14 right-0 bottom-0 w-80 sym-glass z-40 border-l border-[rgba(241,233,221,0.12)] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 bg-[rgba(20,17,14,0.95)] border-b border-[rgba(241,233,221,0.08)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#FF8038]/15 text-[#FF8038] border border-[#FF8038]/30">
            <Radar size={16} />
          </span>
          <div>
            <h2 className="font-semibold text-sm text-[#F1E9DD]">Mission Map</h2>
            <p className="text-[11px] text-[#8B7E72]">Live Agent Fleet Telemetry</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded text-[#8B7E72] hover:text-[#F1E9DD]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-[#14110E] border-b border-[rgba(241,233,221,0.06)] text-center">
        <div className="p-2 rounded bg-[#1F1A16] border border-[rgba(241,233,221,0.06)]">
          <div className="text-base font-bold text-emerald-400 font-mono">{workingCount}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#8B7E72]">Working</div>
        </div>
        <div className={`p-2 rounded bg-[#1F1A16] border ${needsInputCount > 0 ? 'border-amber-500/40 bg-amber-500/10' : 'border-[rgba(241,233,221,0.06)]'}`}>
          <div className="text-base font-bold text-amber-400 font-mono">{needsInputCount}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#8B7E72]">Needs You</div>
        </div>
        <div className="p-2 rounded bg-[#1F1A16] border border-[rgba(241,233,221,0.06)]">
          <div className="text-base font-bold text-[#CDC2B3] font-mono">{idleCount}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#8B7E72]">Idle</div>
        </div>
      </div>

      {/* Roster List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#8B7E72] px-1">
          Active Consoles ({terminals.length})
        </div>

        {terminals.map(term => (
          <div 
            key={term.id}
            className={`p-3 rounded-xl border transition ${
              term.status === 'needs_input'
                ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_14px_rgba(245,158,11,0.2)]'
                : 'bg-[#14110E] border-[rgba(241,233,221,0.08)] hover:border-[rgba(241,233,221,0.18)]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-[13px] text-[#F1E9DD] truncate max-w-[150px]">
                {term.title}
              </span>
              <StatusBadge status={term.status} />
            </div>

            <div className="text-[11px] font-mono text-[#8B7E72] truncate mb-2.5">
              Type: {term.agentType || 'zsh'} · {term.profile || 'default'}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[rgba(241,233,221,0.06)] text-[11px]">
              <button 
                onClick={() => onFocusNode(term.id)}
                className="flex items-center gap-1 text-[#FF8038] hover:underline"
              >
                <Crosshair size={12} />
                <span>Jump to Node</span>
              </button>
              <button 
                onClick={() => signalTerminal(term.id, 'SIGINT')}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300"
                title="Interrupt (Ctrl+C)"
              >
                <ShieldAlert size={12} />
                <span>Interrupt</span>
              </button>
            </div>
          </div>
        ))}

        {terminals.length === 0 && (
          <div className="text-center p-8 text-[#8B7E72] text-[12px] italic">
            No agent terminals active on this board.
          </div>
        )}
      </div>
    </div>
  );
}
