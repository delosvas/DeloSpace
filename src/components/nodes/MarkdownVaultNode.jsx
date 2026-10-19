import React, { useState } from 'react';
import { Network, Plus, Trash2, FileText, Search, X, Maximize2, Minimize2 } from 'lucide-react';

const INITIAL_VAULT_NOTES = [
  { id: '1', title: 'Agent Architecture', content: 'Orchestrating [[Claude Code]] and [[Codex]] via local PTYs.' },
  { id: '2', title: 'Claude Code', content: 'Specialized for architecture planning and deep code review.' },
  { id: '3', title: 'Codex', content: 'Autonomous implementation and fast execution.' },
  { id: '4', title: 'Verification Loops', content: 'Run test cycles until [[Agent Architecture]] passes verification.' }
];

export default function MarkdownVaultNode({ node, onUpdate, onClose, isMaximized, onToggleMaximize }) {
  const [notes, setNotes] = useState(node.data?.notes || INITIAL_VAULT_NOTES);
  const [selectedNoteId, setSelectedNoteId] = useState(notes[0]?.id || '1');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'graph'

  const activeNote = notes.find(n => n.id === selectedNoteId) || notes[0];

  const updateNotes = (newNotes) => {
    setNotes(newNotes);
    onUpdate({
      ...node,
      data: { ...node.data, notes: newNotes }
    });
  };

  const handleNoteContentChange = (newContent) => {
    const updated = notes.map(n => n.id === selectedNoteId ? { ...n, content: newContent } : n);
    updateNotes(updated);
  };

  const handleAddNote = () => {
    const newNote = {
      id: `${Date.now()}`,
      title: `Note ${notes.length + 1}`,
      content: 'Write notes with [[Linked Note]] references...'
    };
    const updated = [...notes, newNote];
    updateNotes(updated);
    setSelectedNoteId(newNote.id);
  };

  const handleDeleteNote = (id) => {
    if (notes.length <= 1) return;
    const updated = notes.filter(n => n.id !== id);
    updateNotes(updated);
    if (selectedNoteId === id) setSelectedNoteId(updated[0].id);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full sym-glass rounded-xl overflow-hidden shadow-2xl border border-[rgba(241,233,221,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[rgba(20,17,14,0.85)] border-b border-[rgba(241,233,221,0.08)]">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30">
            <Network size={13} />
          </span>
          <span className="font-medium text-[13px] text-[#F1E9DD]">
            Markdown Vault Studio
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab(activeTab === 'editor' ? 'graph' : 'editor')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
              activeTab === 'graph' ? 'bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30' : 'text-[#CDC2B3] hover:text-[#F1E9DD]'
            }`}
          >
            <Network size={13} />
            <span>Link Graph</span>
          </button>
          <button 
            onClick={onToggleMaximize}
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#8B7E72] hover:text-[#CDC2B3] transition" 
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button 
            onClick={() => onClose(node.id)}
            className="p-1.5 rounded hover:bg-rose-500/20 text-[#8B7E72] hover:text-rose-400 transition" 
            title="Close Vault"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body Grid */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Vault Explorer */}
        <div className="w-56 bg-[#100D0B] border-r border-[rgba(241,233,221,0.08)] flex flex-col min-h-0">
          <div className="p-2 border-b border-[rgba(241,233,221,0.06)] flex items-center gap-1.5">
            <Search size={12} className="text-[#8B7E72]" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes…"
              className="w-full bg-transparent text-[11px] text-[#F1E9DD] placeholder-[#8B7E72] focus:outline-none"
            />
            <button 
              onClick={handleAddNote}
              className="p-1 rounded hover:bg-white/10 text-[#FF8038]"
              title="Add Note"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-1.5 space-y-0.5">
            {filteredNotes.map(n => (
              <div 
                key={n.id}
                onClick={() => setSelectedNoteId(n.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-[12px] group transition ${
                  selectedNoteId === n.id 
                    ? 'bg-[#1F1A16] text-[#FF8038] font-medium border border-[rgba(241,233,221,0.1)]' 
                    : 'text-[#CDC2B3] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <FileText size={13} className="flex-none opacity-60" />
                  <span className="truncate">{n.title}</span>
                </div>
                {notes.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(n.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Editor / Link Graph */}
        <div className="flex-1 min-h-0 flex flex-col bg-[#0B0908] overflow-hidden">
          {activeTab === 'editor' ? (
            <div className="flex-1 min-h-0 flex flex-col p-4">
              <input
                type="text"
                value={activeNote?.title || ''}
                onChange={(e) => {
                  const updated = notes.map(n => n.id === selectedNoteId ? { ...n, title: e.target.value } : n);
                  updateNotes(updated);
                }}
                className="bg-transparent font-bold text-base text-[#F1E9DD] border-b border-[rgba(241,233,221,0.1)] pb-2 mb-3 focus:outline-none"
                placeholder="Note Title"
              />
              <textarea
                value={activeNote?.content || ''}
                onChange={(e) => handleNoteContentChange(e.target.value)}
                placeholder="Write markdown with [[Wiki Links]]..."
                className="flex-1 min-h-0 bg-transparent text-[13px] font-mono text-[#CDC2B3] resize-none focus:outline-none leading-relaxed overflow-y-auto overscroll-contain"
              />
            </div>
          ) : (
            /* Interactive Link Graph View */
            <div className="flex-1 relative flex items-center justify-center p-4 bg-[#080706]">
              <svg className="w-full h-full">
                {/* Connecting lines between notes */}
                {notes.map((n, i) => {
                  const x1 = 120 + (i % 2) * 160;
                  const y1 = 80 + Math.floor(i / 2) * 120;
                  return notes.slice(i + 1).map((m, j) => {
                    const x2 = 120 + ((i + j + 1) % 2) * 160;
                    const y2 = 80 + Math.floor((i + j + 1) / 2) * 120;
                    return (
                      <line 
                        key={`${i}-${j}`} 
                        x1={x1} y1={y1} x2={x2} y2={y2} 
                        stroke="rgba(168, 85, 247, 0.25)" 
                        strokeWidth="1.5" 
                        strokeDasharray="4 4"
                      />
                    );
                  });
                })}

                {/* Nodes */}
                {notes.map((n, i) => {
                  const cx = 120 + (i % 2) * 160;
                  const cy = 80 + Math.floor(i / 2) * 120;
                  const isSelected = selectedNoteId === n.id;
                  return (
                    <g key={n.id} onClick={() => { setSelectedNoteId(n.id); setActiveTab('editor'); }} className="cursor-pointer group">
                      <circle 
                        cx={cx} cy={cy} r={isSelected ? 16 : 12} 
                        fill={isSelected ? '#A855F7' : '#1F1A16'} 
                        stroke="#A855F7" 
                        strokeWidth="2" 
                      />
                      <text 
                        x={cx} y={cy + 24} 
                        fill="#F1E9DD" 
                        fontSize="11" 
                        textAnchor="middle" 
                        fontFamily="sans-serif"
                      >
                        {n.title}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="absolute top-3 left-3 text-[11px] font-mono text-[#8B7E72] bg-[#14110E] px-2 py-1 rounded border border-[rgba(241,233,221,0.08)]">
                Obsidian Graph · Click node to open
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
