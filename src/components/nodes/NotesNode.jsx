import React, { useState } from 'react';
import { FileText, Eye, Edit3, X, Maximize2, Minimize2 } from 'lucide-react';

export default function NotesNode({ node, onUpdate, onClose, isMaximized, onToggleMaximize }) {
  const [content, setContent] = useState(node.data?.content || `# Project Plan & Notes\n\n- [ ] Run test suite\n- [ ] Check security permissions\n- [ ] Optimize bundle size`);
  const [isEditing, setIsEditing] = useState(false);

  const handleContentChange = (newVal) => {
    setContent(newVal);
    onUpdate({
      ...node,
      data: { ...node.data, content: newVal }
    });
  };

  // Simple Markdown renderer with checklists
  const renderMarkdown = (text) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-lg font-bold text-[#F1E9DD] my-2">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-base font-semibold text-[#F1E9DD] my-1.5">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-semibold text-[#CDC2B3] my-1">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
        const checked = line.startsWith('- [x] ');
        const label = line.replace(/- \[[ x]\] /, '');
        return (
          <label key={idx} className="flex items-center gap-2 my-1 cursor-pointer text-[#CDC2B3] hover:text-[#F1E9DD]">
            <input 
              type="checkbox" 
              checked={checked} 
              onChange={() => {
                const lines = content.split('\n');
                lines[idx] = checked ? `- [ ] ${label}` : `- [x] ${label}`;
                handleContentChange(lines.join('\n'));
              }}
              className="rounded bg-[#0B0908] border-[rgba(241,233,221,0.2)] text-[#FF8038] focus:ring-0" 
            />
            <span className={checked ? "line-through text-[#8B7E72]" : ""}>{label}</span>
          </label>
        );
      }
      if (line.startsWith('- ')) {
        return <li key={idx} className="ml-4 list-disc text-[#CDC2B3] my-0.5">{line.replace('- ', '')}</li>;
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-[#CDC2B3] my-1 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-full w-full sym-glass rounded-xl overflow-hidden shadow-2xl border border-[rgba(241,233,221,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[rgba(20,17,14,0.85)] border-b border-[rgba(241,233,221,0.08)]">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
            <FileText size={13} />
          </span>
          <span className="font-medium text-[13px] text-[#F1E9DD]">
            {node.title || 'Markdown Notes'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#CDC2B3] hover:text-[#F1E9DD] transition flex items-center gap-1 text-[11px]"
            title={isEditing ? "Switch to Preview" : "Switch to Edit"}
          >
            {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
            <span>{isEditing ? 'Preview' : 'Edit'}</span>
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
            title="Close Note"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 p-4 bg-[#0B0908] overflow-y-auto overscroll-contain">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full h-full bg-transparent text-[#F1E9DD] font-mono text-[13px] resize-none focus:outline-none leading-relaxed overflow-y-auto overscroll-contain"
            placeholder="Write markdown notes or checklists with - [ ] task…"
          />
        ) : (
          <div className="prose prose-invert max-w-none text-[13px]">
            {renderMarkdown(content)}
          </div>
        )}
      </div>
    </div>
  );
}
