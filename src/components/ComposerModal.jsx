import React, { useState } from 'react';
import { Layers, Send, X, CheckSquare, Square, Sparkles } from 'lucide-react';
import { broadcastPrompt } from '../services/api';

const PRESET_DIRECTIVES = [
  { label: 'Run Tests', text: 'Run the test suite, analyze any failed assertions, and report findings.' },
  { label: 'Check Lints & Types', text: 'Run linter and TypeScript compiler checks, and fix any detected warnings.' },
  { label: 'Architecture Review', text: 'Review the project structure against best practices and list potential performance bottlenecks.' },
  { label: 'Git Diff Review', text: 'Inspect `git diff`, summarize the changes made, and check for any accidental regressions.' }
];

export default function ComposerModal({ 
  isOpen, 
  onClose, 
  terminals = [] 
}) {
  const [selectedIds, setSelectedIds] = useState(terminals.map(t => t.id));
  const [promptText, setPromptText] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(terminals.map(t => t.id));
  const deselectAll = () => setSelectedIds([]);

  const handleBroadcast = async (e) => {
    e?.preventDefault();
    if (!promptText.trim() || selectedIds.length === 0) return;

    setIsSending(true);
    try {
      await broadcastPrompt(selectedIds, promptText);
      setPromptText('');
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl sym-glass rounded-2xl overflow-hidden border border-[rgba(241,233,221,0.15)] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[rgba(20,17,14,0.9)] border-b border-[rgba(241,233,221,0.1)]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-[#FF8038]/20 text-[#FF8038] border border-[#FF8038]/40">
              <Layers size={16} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#F1E9DD]">
                Fleet Composer · Broadcast
              </h2>
              <p className="text-[12px] text-[#8B7E72]">
                Stage tasks and dispatch prompts to multiple coding agents simultaneously.
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
          {/* Target Consoles Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-medium text-[#CDC2B3]">
                Select Target Consoles ({selectedIds.length} / {terminals.length})
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <button onClick={selectAll} className="text-[#FF8038] hover:underline">Select All</button>
                <span className="text-[#8B7E72]">·</span>
                <button onClick={deselectAll} className="text-[#8B7E72] hover:text-[#CDC2B3]">Deselect</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto p-2 bg-[#14110E] rounded-xl border border-[rgba(241,233,221,0.08)]">
              {terminals.map(term => {
                const isSelected = selectedIds.includes(term.id);
                return (
                  <button
                    key={term.id}
                    onClick={() => toggleSelect(term.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-[12px] transition border ${
                      isSelected 
                        ? 'bg-[#1F1A16] border-[#FF8038]/40 text-[#F1E9DD]' 
                        : 'bg-transparent border-transparent text-[#8B7E72] hover:bg-[#1F1A16]/50'
                    }`}
                  >
                    {isSelected ? <CheckSquare size={14} className="text-[#FF8038]" /> : <Square size={14} />}
                    <span className="truncate">{term.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <span className="text-[11px] font-mono uppercase text-[#8B7E72] block mb-1.5">
              Quick Directives
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_DIRECTIVES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setPromptText(preset.text)}
                  className="px-2.5 py-1 rounded-md bg-[rgba(241,233,221,0.05)] hover:bg-[rgba(241,233,221,0.1)] text-[#CDC2B3] hover:text-[#F1E9DD] border border-[rgba(241,233,221,0.08)] text-[12px] transition flex items-center gap-1.5"
                >
                  <Sparkles size={11} className="text-[#FF8038]" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Area */}
          <div>
            <label className="block text-[12px] font-medium text-[#CDC2B3] mb-1.5">
              Broadcast Instruction
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={4}
              placeholder="Type command to send to all selected agents..."
              className="w-full bg-[#0B0908] border border-[rgba(241,233,221,0.12)] rounded-lg p-3 text-[13px] text-[#F1E9DD] placeholder-[#8B7E72] focus:outline-none focus:border-[#FF8038]"
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
            disabled={!promptText.trim() || selectedIds.length === 0 || isSending}
            onClick={handleBroadcast}
            className="sym-btn-primary px-4 py-2 rounded-lg text-[13px] flex items-center gap-2 disabled:opacity-40"
          >
            <Send size={14} />
            <span>Broadcast to {selectedIds.length} Agents</span>
          </button>
        </div>
      </div>
    </div>
  );
}
