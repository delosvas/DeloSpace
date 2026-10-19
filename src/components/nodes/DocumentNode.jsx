import React, { useState } from 'react';
import { BookOpen, Printer, Edit3, Eye, X, Maximize2, Minimize2 } from 'lucide-react';

const SAMPLE_DOC = `# Project Architecture Specification
## Executive Summary
This document outlines the distributed agent architecture, pseudo-terminal lifecycle management, and spatial memory canvas for the Symvibe agent command post.

### 1. Pseudo-Terminal Isolation
Every agent is spawned within an isolated Unix PTY on macOS \`/bin/zsh\`. The agent inherits native terminal escape capabilities, allowing full cursor interaction and prompt management.

### 2. Multi-Account Profile Management
Independent configuration folders (e.g. \`CLAUDE_CONFIG_DIR\` and \`CODEX_HOME\`) prevent account collision, allowing enterprise and personal accounts to coexist on a single canvas board.

### 3. Verification & Autonomous Loops
Automated loops trigger verification runs on schedule or on idle, monitoring console output until target acceptance goals are satisfied.
`;

export default function DocumentNode({ node, onUpdate, onClose, isMaximized, onToggleMaximize }) {
  const [content, setContent] = useState(node.data?.content || SAMPLE_DOC);
  const [isEditing, setIsEditing] = useState(false);

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${node.title || 'Document'}</title>
          <style>
            body { font-family: -apple-system, system-ui, sans-serif; line-height: 1.6; padding: 40px; color: #111; }
            h1 { font-size: 24px; border-bottom: 2px solid #ddd; padding-bottom: 8px; margin-top: 0; }
            h2 { font-size: 18px; margin-top: 24px; }
            h3 { font-size: 15px; margin-top: 18px; }
            p { font-size: 14px; margin: 10px 0; }
            code { background: #f4f4f4; padding: 2px 5px; border-radius: 4px; font-family: monospace; }
            @media print {
              body { padding: 0; }
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <div>${content.replace(/# (.*)/g, '<h1>$1</h1>').replace(/## (.*)/g, '<h2>$1</h2>').replace(/### (.*)/g, '<h3>$1</h3>').replace(/\n/g, '<br/>')}</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleContentChange = (newVal) => {
    setContent(newVal);
    onUpdate({
      ...node,
      data: { ...node.data, content: newVal }
    });
  };

  return (
    <div className="flex flex-col h-full w-full sym-glass rounded-xl overflow-hidden shadow-2xl border border-[rgba(241,233,221,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[rgba(20,17,14,0.85)] border-b border-[rgba(241,233,221,0.08)]">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[#EC4899]/15 text-[#EC4899] border border-[#EC4899]/30">
            <BookOpen size={13} />
          </span>
          <span className="font-medium text-[13px] text-[#F1E9DD]">
            Document Studio · {node.title || 'Spec Sheet'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#CDC2B3] hover:text-[#F1E9DD] transition flex items-center gap-1 text-[11px]"
            title={isEditing ? "Switch to Paginated View" : "Edit Document"}
          >
            {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
            <span>{isEditing ? 'Page' : 'Edit'}</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#CDC2B3] hover:text-[#F1E9DD] transition flex items-center gap-1 text-[11px]"
            title="Export Paginated PDF"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">Export PDF</span>
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
            title="Close Document"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 bg-[#0B0908] overflow-y-auto overscroll-contain p-4 flex justify-center">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full h-full bg-[#14110E] border border-[rgba(241,233,221,0.1)] rounded-lg p-4 font-mono text-[13px] text-[#F1E9DD] leading-relaxed resize-none focus:outline-none focus:border-[#FF8038] overflow-y-auto overscroll-contain"
          />
        ) : (
          <div className="w-full max-w-2xl bg-[#14110E] p-8 rounded-xl border border-[rgba(241,233,221,0.08)] shadow-lg text-[#F1E9DD] space-y-3 font-sans">
            {content.split('\n').map((line, idx) => {
              if (line.startsWith('# ')) return <h1 key={idx} className="text-xl font-bold text-[#F1E9DD] border-b border-[rgba(241,233,221,0.1)] pb-2">{line.replace('# ', '')}</h1>;
              if (line.startsWith('## ')) return <h2 key={idx} className="text-base font-semibold text-[#FF8038] pt-2">{line.replace('## ', '')}</h2>;
              if (line.startsWith('### ')) return <h3 key={idx} className="text-sm font-semibold text-[#CDC2B3] pt-1">{line.replace('### ', '')}</h3>;
              if (!line.trim()) return <div key={idx} className="h-2" />;
              return <p key={idx} className="text-[13px] text-[#CDC2B3] leading-relaxed">{line}</p>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
