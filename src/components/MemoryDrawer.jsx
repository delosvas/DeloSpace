import React, { useState, useEffect } from 'react';
import { Bookmark, Plus, Trash2, Send, X, Sparkles } from 'lucide-react';
import { fetchProjectMemory, saveProjectMemory, writeTerminal } from '../services/api';

export default function MemoryDrawer({ 
  isOpen, 
  onClose, 
  terminals = [] 
}) {
  const [memoryItems, setMemoryItems] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedTerminalId, setSelectedTerminalId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjectMemory().then(items => {
        setMemoryItems(items);
      });
      if (terminals.length > 0 && !selectedTerminalId) {
        setSelectedTerminalId(terminals[0].id);
      }
    }
  }, [isOpen, terminals]);

  if (!isOpen) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newItem = {
      id: `mem-${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      tags: ['custom']
    };

    const updated = [...memoryItems, newItem];
    setMemoryItems(updated);
    await saveProjectMemory(updated);

    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const handleDelete = async (id) => {
    const updated = memoryItems.filter(m => m.id !== id);
    setMemoryItems(updated);
    await saveProjectMemory(updated);
  };

  const handlePushToTerminal = async (content) => {
    if (!selectedTerminalId) {
      alert('Please select an active terminal console to push memory context to.');
      return;
    }
    const formatted = `### [Project Memory Guideline Injected]\n${content}\n`;
    await writeTerminal(selectedTerminalId, formatted);
  };

  return (
    <div className="fixed top-14 right-0 bottom-0 w-88 sym-glass z-40 border-l border-[rgba(241,233,221,0.12)] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 bg-[rgba(20,17,14,0.95)] border-b border-[rgba(241,233,221,0.08)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
            <Bookmark size={16} />
          </span>
          <div>
            <h2 className="font-semibold text-sm text-[#F1E9DD]">Project Memory</h2>
            <p className="text-[11px] text-[#8B7E72]">Repo Guidelines & Shared State</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded text-[#8B7E72] hover:text-[#F1E9DD]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Target Console Selector for Push */}
      <div className="p-3 bg-[#14110E] border-b border-[rgba(241,233,221,0.06)]">
        <label className="block text-[11px] font-mono text-[#8B7E72] uppercase mb-1">
          Target Console for Injection
        </label>
        <select
          value={selectedTerminalId}
          onChange={(e) => setSelectedTerminalId(e.target.value)}
          className="w-full bg-[#0B0908] border border-[rgba(241,233,221,0.12)] rounded px-2.5 py-1 text-[12px] text-[#F1E9DD] focus:outline-none focus:border-[#FF8038]"
        >
          {terminals.map(t => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.agentType})
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {memoryItems.map(item => (
          <div 
            key={item.id}
            className="p-3 bg-[#14110E] border border-[rgba(241,233,221,0.08)] rounded-xl space-y-2 group hover:border-[rgba(241,233,221,0.18)] transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[13px] text-[#F1E9DD]">
                {item.title}
              </span>
              <button 
                onClick={() => handleDelete(item.id)}
                className="opacity-40 group-hover:opacity-100 hover:text-rose-400 p-0.5 transition"
                title="Delete memory item"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <p className="text-[12px] text-[#CDC2B3] leading-relaxed break-words font-mono bg-[#0B0908] p-2 rounded-lg border border-[rgba(241,233,221,0.04)]">
              {item.content}
            </p>

            <button
              onClick={() => handlePushToTerminal(item.content)}
              className="sym-btn-ghost w-full py-1 rounded-lg text-[11px] flex items-center justify-center gap-1.5"
            >
              <Send size={11} />
              <span>Push to Target Console</span>
            </button>
          </div>
        ))}

        {isAdding ? (
          <form onSubmit={handleAdd} className="p-3 bg-[#1F1A16] border border-[#FF8038]/30 rounded-xl space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title (e.g. API Schema Rule)"
              className="w-full bg-[#0B0908] border border-[rgba(241,233,221,0.12)] rounded px-2.5 py-1 text-[12px] text-[#F1E9DD]"
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              placeholder="Rule description or instruction..."
              className="w-full bg-[#0B0908] border border-[rgba(241,233,221,0.12)] rounded p-2 text-[12px] text-[#CDC2B3]"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-[11px] text-[#8B7E72] hover:text-[#CDC2B3]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="sym-btn-primary px-3 py-1 rounded text-[11px]"
              >
                Save Rule
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="sym-btn-ghost w-full py-2 rounded-xl text-[12px] flex items-center justify-center gap-2 border-dashed"
          >
            <Plus size={14} />
            <span>Add Memory Snippet</span>
          </button>
        )}
      </div>
    </div>
  );
}
