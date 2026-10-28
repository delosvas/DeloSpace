import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Check, 
  SlidersHorizontal, 
  Terminal as TerminalIcon,
  Sparkles,
  Layers
} from 'lucide-react';

export const DEFAULT_AGENT_TERMINALS = [
  {
    id: 'claude',
    name: 'Claude Code',
    provider: 'Anthropic',
    command: 'claude',
    color: '#D97706',
    visible: true,
    isCustom: false
  },
  {
    id: 'codex',
    name: 'OpenAI Codex',
    provider: 'OpenAI',
    command: 'codex',
    color: '#10B981',
    visible: true,
    isCustom: false
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    provider: 'Google',
    command: 'gemini',
    color: '#3B82F6',
    visible: true,
    isCustom: false
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    provider: 'Community',
    command: 'opencode',
    color: '#8B5CF6',
    visible: true,
    isCustom: false
  },
  {
    id: 'kimi',
    name: 'Kimi CLI',
    provider: 'Moonshot AI',
    command: 'kimi',
    color: '#06B6D4',
    visible: true,
    isCustom: false
  },
  {
    id: 'deepcode',
    name: 'DeepCode CLI',
    provider: 'DeepCode',
    command: 'deepcode',
    color: '#EC4899',
    visible: true,
    isCustom: false
  },
  {
    id: 'zsh',
    name: 'Direct zsh Shell',
    provider: 'Native PTY',
    command: '',
    color: '#FF8038',
    visible: true,
    isCustom: false
  }
];

export function getStoredAgentTerminals() {
  try {
    const raw = localStorage.getItem('delospace_agent_terminals_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure new presets (kimi, deepcode) exist in list if not already present
        const existingIds = new Set(parsed.map(a => a.id));
        const missingDefaults = DEFAULT_AGENT_TERMINALS.filter(d => !existingIds.has(d.id));
        return [...parsed, ...missingDefaults];
      }
    }
  } catch (err) {
    console.warn('Failed to parse agent terminals config:', err);
  }
  return DEFAULT_AGENT_TERMINALS;
}

export function saveStoredAgentTerminals(agents) {
  try {
    localStorage.setItem('delospace_agent_terminals_config', JSON.stringify(agents));
  } catch (err) {
    console.error('Failed to save agent terminals config:', err);
  }
}

const PRESET_COLORS = [
  '#FF8038', '#10B981', '#3B82F6', '#06B6D4', '#8B5CF6', '#EC4899', '#D97706', '#EAB308'
];

export default function AgentConfigModal({
  isOpen,
  onClose,
  onAgentsUpdated
}) {
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'create'
  const [agents, setAgents] = useState(getStoredAgentTerminals);

  // Form state for creating custom agent
  const [customName, setCustomName] = useState('');
  const [customProvider, setCustomProvider] = useState('');
  const [customCommand, setCustomCommand] = useState('');
  const [customColor, setCustomColor] = useState('#06B6D4');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setAgents(getStoredAgentTerminals());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleVisibility = (id) => {
    const updated = agents.map(a => a.id === id ? { ...a, visible: !a.visible } : a);
    setAgents(updated);
    saveStoredAgentTerminals(updated);
    onAgentsUpdated?.(updated);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...agents];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setAgents(updated);
    saveStoredAgentTerminals(updated);
    onAgentsUpdated?.(updated);
  };

  const handleMoveDown = (index) => {
    if (index === agents.length - 1) return;
    const updated = [...agents];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setAgents(updated);
    saveStoredAgentTerminals(updated);
    onAgentsUpdated?.(updated);
  };

  const handleDeleteCustom = (id) => {
    const updated = agents.filter(a => a.id !== id);
    setAgents(updated);
    saveStoredAgentTerminals(updated);
    onAgentsUpdated?.(updated);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset agent terminals to default list and order?')) {
      setAgents(DEFAULT_AGENT_TERMINALS);
      saveStoredAgentTerminals(DEFAULT_AGENT_TERMINALS);
      onAgentsUpdated?.(DEFAULT_AGENT_TERMINALS);
      setFeedback({ type: 'success', message: 'Restored default agents' });
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleCreateCustom = (e) => {
    e.preventDefault();
    if (!customName.trim()) {
      setFeedback({ type: 'error', message: 'Agent name is required' });
      return;
    }
    if (!customCommand.trim()) {
      setFeedback({ type: 'error', message: 'Terminal command is required' });
      return;
    }

    const newAgent = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      provider: customProvider.trim() || 'Custom',
      command: customCommand.trim(),
      color: customColor,
      visible: true,
      isCustom: true
    };

    const updated = [...agents, newAgent];
    setAgents(updated);
    saveStoredAgentTerminals(updated);
    onAgentsUpdated?.(updated);

    // Reset form
    setCustomName('');
    setCustomProvider('');
    setCustomCommand('');
    setCustomColor('#06B6D4');
    setFeedback({ type: 'success', message: `Created "${newAgent.name}" successfully!` });
    setActiveTab('manage');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div 
        className="w-full max-w-xl bg-[#14110E] border border-[rgba(241,233,221,0.14)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(241,233,221,0.08)] bg-[#1A1612]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF8038]/15 text-[#FF8038] border border-[#FF8038]/30">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#F1E9DD]">Customize Agent Terminals</h2>
              <p className="text-[11px] text-[#8B7E72]">Choose dropdown visibility, display order, or add custom CLI agents</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B7E72] hover:text-[#F1E9DD] hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[rgba(241,233,221,0.08)] bg-[#0F0D0B] px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'manage'
                ? 'border-[#FF8038] text-[#FF8038]'
                : 'border-transparent text-[#8B7E72] hover:text-[#CDC2B3]'
            }`}
          >
            <Layers size={13} />
            <span>Active Dropdown & Order ({agents.filter(a => a.visible).length}/{agents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-[#FF8038] text-[#FF8038]'
                : 'border-transparent text-[#8B7E72] hover:text-[#CDC2B3]'
            }`}
          >
            <Plus size={13} />
            <span>Create Custom Agent</span>
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className={`px-5 py-2 text-xs flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border-b border-emerald-500/20' : 'bg-rose-500/15 text-rose-300 border-b border-rose-500/20'
          }`}>
            <Check size={14} />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'manage' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 text-[11px] text-[#8B7E72]">
                <span>Reorder using arrows or toggle checkboxes to show/hide in the Add Node menu:</span>
                <button
                  onClick={handleResetDefaults}
                  className="hover:text-[#FF8038] flex items-center gap-1 transition"
                  title="Reset to defaults"
                >
                  <RotateCcw size={11} />
                  <span>Reset defaults</span>
                </button>
              </div>

              {agents.map((agent, index) => (
                <div 
                  key={agent.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                    agent.visible 
                      ? 'bg-[#191511] border-[rgba(241,233,221,0.1)] text-[#F1E9DD]' 
                      : 'bg-[#12100E] border-[rgba(241,233,221,0.04)] text-[#8B7E72] opacity-60'
                  }`}
                >
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none text-[#CDC2B3] transition"
                      title="Move up"
                    >
                      <ArrowUp size={11} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === agents.length - 1}
                      className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none text-[#CDC2B3] transition"
                      title="Move down"
                    >
                      <ArrowDown size={11} />
                    </button>
                  </div>

                  {/* Visibility Checkbox */}
                  <input
                    type="checkbox"
                    checked={agent.visible}
                    onChange={() => handleToggleVisibility(agent.id)}
                    className="w-4 h-4 rounded accent-[#FF8038] cursor-pointer"
                    title={agent.visible ? 'Visible in dropdown' : 'Hidden from dropdown'}
                  />

                  {/* Agent Info */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: agent.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs truncate">{agent.name}</span>
                        {agent.isCustom && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#FF8038]/20 text-[#FF8038] font-mono border border-[#FF8038]/30">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#8B7E72] flex items-center gap-2">
                        <span>{agent.provider}</span>
                        <span>•</span>
                        <code className="text-[#CDC2B3] bg-black/40 px-1 rounded font-mono text-[9px]">
                          {agent.command || 'zsh'}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Delete button if custom */}
                  {agent.isCustom && (
                    <button
                      onClick={() => handleDeleteCustom(agent.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-[#8B7E72] hover:text-rose-400 transition"
                      title="Delete custom agent"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Create Custom Agent Tab */
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#CDC2B3] mb-1.5">
                  Agent Display Name <span className="text-[#FF8038]">*</span>
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Cursor CLI, Mistral Agent, Qwen"
                  className="w-full bg-[#0B0908] border border-[rgba(241,233,221,0.12)] rounded-lg px-3 py-2 text-xs text-[#F1E9DD] placeholder-[#8B7E72] focus:outline-none focus:border-[#FF8038]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CDC2B3] mb-1.5">
                  Provider Name <span className="text-[#8B7E72] text-[10px] font-normal">(displayed on the right)</span>
                </label>
                <input
                  type="text"
                  value={customProvider}
                  onChange={(e) => setCustomProvider(e.target.value)}
                  placeholder="e.g. OpenAI, Anthropic, Local Ollama, Moonshot"
                  className="w-full bg-[#0B0908] border border-[rgba(241,233,221,0.12)] rounded-lg px-3 py-2 text-xs text-[#F1E9DD] placeholder-[#8B7E72] focus:outline-none focus:border-[#FF8038]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CDC2B3] mb-1.5">
                  Terminal Command to Run <span className="text-[#FF8038]">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-[#0B0908] border border-[rgba(241,233,221,0.12)] rounded-lg text-[#8B7E72]">
                    <TerminalIcon size={14} />
                  </span>
                  <input
                    type="text"
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    placeholder="e.g. codex, kimi, aider --model haiku, ollama run llama3"
                    className="flex-1 bg-[#0B0908] border border-[rgba(241,233,221,0.12)] rounded-lg px-3 py-2 text-xs text-[#F1E9DD] font-mono placeholder-[#8B7E72] focus:outline-none focus:border-[#FF8038]"
                  />
                </div>
                <p className="mt-1 text-[10px] text-[#8B7E72]">
                  This command is executed automatically in the native macOS PTY when you click the node.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CDC2B3] mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCustomColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        customColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sym-btn-primary py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add to Dropdown</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-[rgba(241,233,221,0.08)] bg-[#1A1612]">
          <button
            onClick={onClose}
            className="sym-btn-primary px-4 py-1.5 rounded-lg text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
