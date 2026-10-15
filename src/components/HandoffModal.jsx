import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, X, Sparkles, Send } from 'lucide-react';
import { getTerminalHistory, writeTerminal } from '../services/api';

export default function HandoffModal({ 
  isOpen, 
  onClose, 
  sourceNode, 
  availableTerminals = [] 
}) {
  const [targetId, setTargetId] = useState('');
  const [historyText, setHistoryText] = useState('');
  const [taskDirective, setTaskDirective] = useState('');
  const [loading, setLoading] = useState(false);

  const targetTerminals = availableTerminals.filter(t => t.id !== sourceNode?.id);

  useEffect(() => {
    if (isOpen && sourceNode) {
      if (targetTerminals.length > 0 && !targetId) {
        setTargetId(targetTerminals[0].id);
      }
      setLoading(true);
      getTerminalHistory(sourceNode.id, 40).then(hist => {
        // Strip out noisy blank lines or ANSI
        const lines = hist.split('\n').filter(l => l.trim().length > 0).slice(-25);
        const excerpt = lines.join('\n');
        setHistoryText(excerpt);
        setTaskDirective('Review the progress from the previous agent above, continue the implementation, and run verification tests.');
        setLoading(false);
      });
    }
  }, [isOpen, sourceNode]);

  if (!isOpen || !sourceNode) return null;

  const handleDispatchHandoff = async () => {
    if (!targetId) return;

    const synthesizedPrompt = `### [State Handoff from ${sourceNode.title}]\nHere is the recent context and output from the previous session:\n\`\`\`\n${historyText.slice(-1000)}\n\`\`\`\n\nDirective: ${taskDirective}`;

    await writeTerminal(targetId, `${synthesizedPrompt}\n`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl sym-glass rounded-2xl overflow-hidden border border-[rgba(241,233,221,0.15)] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[rgba(20,17,14,0.9)] border-b border-[rgba(241,233,221,0.1)]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-[#FF8038]/20 text-[#FF8038] border border-[#FF8038]/40">
              <ArrowRightLeft size={16} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#F1E9DD]">
                Agent State Handoff
              </h2>
              <p className="text-[12px] text-[#8B7E72]">
                Transfer context, findings, and tasks from one agent to another seamlessly.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-[#8B7E72] hover:text-[#F1E9DD] hover:bg-[rgba(241,233,221,0.1)] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Source & Target Mapping */}
          <div className="grid grid-cols-2 gap-4 p-3.5 bg-[#14110E] rounded-xl border border-[rgba(241,233,221,0.08)]">
            <div>
              <span className="text-[11px] font-mono uppercase text-[#8B7E72] block mb-1">
                From (Source Agent)
              </span>
              <div className="font-medium text-[13px] text-[#F1E9DD] truncate">
                {sourceNode.title} ({sourceNode.agentType})
              </div>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-[#8B7E72] block mb-1">
                To (Target Agent)
              </span>
              <select 
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-[#0B0908] border border-[rgba(241,233,221,0.15)] rounded-lg px-2.5 py-1.5 text-[13px] text-[#F1E9DD] focus:outline-none focus:border-[#FF8038]"
              >
                {targetTerminals.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.agentType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Context Excerpt */}
          <div>
            <label className="block text-[12px] font-medium text-[#CDC2B3] mb-1.5 flex items-center justify-between">
              <span>Captured Session Context</span>
              <span className="text-[11px] text-[#8B7E72]">Recent console buffer</span>
            </label>
            <textarea
              value={historyText}
              onChange={(e) => setHistoryText(e.target.value)}
              rows={6}
              className="w-full bg-[#0B0908] border border-[rgba(241,233,221,0.1)] rounded-lg p-3 font-mono text-[12px] text-[#CDC2B3] focus:outline-none focus:border-[#FF8038]"
              placeholder={loading ? "Extracting session context…" : "Context excerpt…"}
            />
          </div>

          {/* Directive */}
          <div>
            <label className="block text-[12px] font-medium text-[#CDC2B3] mb-1.5">
              Instruction for Target Agent
            </label>
            <input
              type="text"
              value={taskDirective}
              onChange={(e) => setTaskDirective(e.target.value)}
              className="w-full bg-[#0B0908] border border-[rgba(241,233,221,0.1)] rounded-lg px-3 py-2 text-[13px] text-[#F1E9DD] focus:outline-none focus:border-[#FF8038]"
              placeholder="e.g. Inspect the diff, verify with test suite, and refactor..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 bg-[rgba(20,17,14,0.9)] border-t border-[rgba(241,233,221,0.08)]">
          <button 
            type="button" 
            onClick={onClose}
            className="sym-btn-ghost px-4 py-2 rounded-lg text-[13px]"
          >
            Cancel
          </button>
          <button 
            type="button"
            disabled={!targetId || loading}
            onClick={handleDispatchHandoff}
            className="sym-btn-primary px-4 py-2 rounded-lg text-[13px] flex items-center gap-2 disabled:opacity-40"
          >
            <Send size={14} />
            <span>Dispatch Handoff</span>
          </button>
        </div>
      </div>
    </div>
  );
}
