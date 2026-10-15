import React, { useState } from 'react';
import { 
  BarChart2, 
  X, 
  Coins, 
  Clock, 
  Zap, 
  Cpu, 
  TrendingUp, 
  Download,
  Terminal,
  Layers,
  Sparkles
} from 'lucide-react';

export default function UsageDrawer({
  isOpen,
  onClose,
  terminals = []
}) {
  if (!isOpen) return null;

  // Compute simulated/tracked metrics based on active terminals
  const agentUsage = terminals.map(t => {
    // Estimations based on agent type
    const isClaude = t.agentType === 'claude';
    const isCodex = t.agentType === 'codex';
    const isGemini = t.agentType === 'gemini';

    const inputTokens = isClaude ? 48200 : isCodex ? 34100 : isGemini ? 29500 : 8500;
    const outputTokens = isClaude ? 12400 : isCodex ? 9800 : isGemini ? 7200 : 2100;
    const rateInput = isClaude ? 0.003 : isCodex ? 0.0025 : isGemini ? 0.0001 : 0;
    const rateOutput = isClaude ? 0.015 : isCodex ? 0.01 : isGemini ? 0.0004 : 0;

    const cost = ((inputTokens / 1000) * rateInput) + ((outputTokens / 1000) * rateOutput);

    return {
      id: t.id,
      title: t.title,
      agentType: t.agentType,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost: cost.toFixed(3),
      status: t.status,
      sessionMinutes: 42
    };
  });

  const totalTokens = agentUsage.reduce((acc, curr) => acc + curr.totalTokens, 0);
  const totalCost = agentUsage.reduce((acc, curr) => acc + parseFloat(curr.cost), 0).toFixed(2);
  const totalMinutes = agentUsage.reduce((acc, curr) => acc + curr.sessionMinutes, 0);

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(agentUsage, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `symvibe-usage-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 sym-glass border-l border-[rgba(241,233,221,0.12)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-[rgba(241,233,221,0.08)] bg-[rgba(20,17,14,0.9)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BarChart2 size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#F1E9DD]">Usage & Token Analytics</h3>
            <p className="text-[11px] text-[#8B7E72]">Live workspace cost & throughput</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[rgba(241,233,221,0.1)] text-[#8B7E72] hover:text-[#F1E9DD] transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="p-4 grid grid-cols-2 gap-2.5 border-b border-[rgba(241,233,221,0.06)] bg-[#100D0B]/60">
        <div className="p-3 rounded-xl bg-[#14110E] border border-[rgba(241,233,221,0.06)]">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8B7E72] mb-1">
            <Coins size={12} className="text-[#FF8038]" />
            <span>Estimated Cost</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#F1E9DD]">
            ${totalCost}
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            Local PTY Free Tier
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#14110E] border border-[rgba(241,233,221,0.06)]">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8B7E72] mb-1">
            <Zap size={12} className="text-amber-400" />
            <span>Total Tokens</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#F1E9DD]">
            {(totalTokens / 1000).toFixed(1)}k
          </div>
          <div className="text-[10px] text-[#8B7E72] mt-0.5">
            In + Out across {terminals.length} consoles
          </div>
        </div>
      </div>

      {/* Per Console List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#8B7E72] flex items-center justify-between">
          <span>Active Agent Consoles</span>
          <span>Tokens / Cost</span>
        </div>

        {agentUsage.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#8B7E72] font-mono">
            No active terminal nodes on canvas
          </div>
        ) : (
          agentUsage.map(agent => (
            <div
              key={agent.id}
              className="p-3 rounded-xl bg-[#14110E] border border-[rgba(241,233,221,0.06)] space-y-2 hover:border-[rgba(241,233,221,0.14)] transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal size={13} className="text-[#FF8038]" />
                  <span className="text-xs font-semibold text-[#F1E9DD] truncate max-w-[150px]">
                    {agent.title}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-emerald-400">
                  ${agent.cost}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#1F1A16] h-1.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-[#FF8038] h-full"
                  style={{ width: `${Math.min(100, (agent.inputTokens / (agent.totalTokens || 1)) * 100)}%` }}
                  title="Input Tokens"
                />
                <div 
                  className="bg-amber-400 h-full"
                  style={{ width: `${Math.min(100, (agent.outputTokens / (agent.totalTokens || 1)) * 100)}%` }}
                  title="Output Tokens"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-[#8B7E72]">
                <span>In: {(agent.inputTokens / 1000).toFixed(1)}k</span>
                <span>Out: {(agent.outputTokens / 1000).toFixed(1)}k</span>
                <span className="capitalize">{agent.agentType}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Export */}
      <div className="p-4 border-t border-[rgba(241,233,221,0.08)] bg-[rgba(20,17,14,0.9)] flex items-center justify-between">
        <span className="text-[11px] font-mono text-[#8B7E72]">
          Updated live
        </span>
        <button
          onClick={handleExportData}
          className="sym-btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 text-[#CDC2B3] hover:text-[#F1E9DD]"
        >
          <Download size={13} />
          <span>Export JSON</span>
        </button>
      </div>
    </div>
  );
}
