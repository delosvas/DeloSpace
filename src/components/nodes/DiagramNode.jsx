import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { GitGraph, Download, Edit3, Eye, X, Maximize2, Minimize2 } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#0B0908',
    primaryColor: '#1F1A16',
    primaryTextColor: '#F1E9DD',
    primaryBorderColor: '#FF8038',
    lineColor: '#FF8038',
    secondaryColor: '#14110E',
    tertiaryColor: '#28221D'
  }
});

const DEFAULT_DIAGRAM = `graph TD
    User["Developer (Mac)"] -->|Voice & Commands| Symvibe["Symvibe Visual Board"]
    Symvibe -->|forkpty| Claude["Claude Code CLI"]
    Symvibe -->|forkpty| Codex["OpenAI Codex CLI"]
    Symvibe -->|forkpty| Gemini["Gemini CLI"]
    Claude -->|Handoff Brief| Codex
    Codex -->|Automated Loop| Tests["Test Suite (PASS)"]
    Tests -->|Status Check| MissionMap["Mission Map Telemetry"]
`;

export default function DiagramNode({ node, onUpdate, onClose, isMaximized, onToggleMaximize }) {
  const [code, setCode] = useState(node.data?.code || DEFAULT_DIAGRAM);
  const [isEditing, setIsEditing] = useState(false);
  const [svgHtml, setSvgHtml] = useState('');
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  const renderDiagram = async (chartCode) => {
    try {
      setError(null);
      const id = `mermaid-${node.id.replace(/[^a-zA-Z0-9]/g, '')}`;
      const { svg } = await mermaid.render(id, chartCode);
      setSvgHtml(svg);
    } catch (err) {
      setError(err.message || 'Syntax error in Mermaid diagram');
    }
  };

  useEffect(() => {
    renderDiagram(code);
  }, [code]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    onUpdate({
      ...node,
      data: { ...node.data, code: newCode }
    });
  };

  const handleExportSvg = () => {
    const blob = new Blob([svgHtml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${node.title || 'diagram'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full w-full sym-glass rounded-xl overflow-hidden shadow-2xl border border-[rgba(241,233,221,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[rgba(20,17,14,0.85)] border-b border-[rgba(241,233,221,0.08)]">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
            <GitGraph size={13} />
          </span>
          <span className="font-medium text-[13px] text-[#F1E9DD]">
            Diagram Studio · {node.title || 'Architecture Map'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#CDC2B3] hover:text-[#F1E9DD] transition flex items-center gap-1 text-[11px]"
            title={isEditing ? "View Diagram" : "Edit Diagram Syntax"}
          >
            {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
            <span>{isEditing ? 'View' : 'Edit'}</span>
          </button>
          <button
            onClick={handleExportSvg}
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#8B7E72] hover:text-[#CDC2B3] transition"
            title="Export as SVG"
          >
            <Download size={13} />
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
            title="Close Diagram"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 bg-[#0B0908] overflow-auto p-4 flex flex-col justify-center items-center overscroll-contain">
        {isEditing ? (
          <textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="w-full h-full bg-[#14110E] border border-[rgba(241,233,221,0.1)] rounded-lg p-3 font-mono text-[12px] text-[#F1E9DD] resize-none focus:outline-none focus:border-[#FF8038] overflow-auto overscroll-contain"
            placeholder="Write mermaid graph syntax..."
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {error ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-mono">
                {error}
              </div>
            ) : (
              <div 
                ref={containerRef}
                dangerouslySetInnerHTML={{ __html: svgHtml }}
                className="w-full h-full flex items-center justify-center select-none"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
