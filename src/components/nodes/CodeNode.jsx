import React, { useEffect, useState } from 'react';
import { Code2, Copy, Check, FileCode, X, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { fetchFileContent } from '../../services/api';

export default function CodeNode({ node, onUpdate, onClose, isMaximized, onToggleMaximize }) {
  const [content, setContent] = useState(node.data?.content || '');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(!node.data?.content);

  const filePath = node.data?.filePath || '';
  const fileName = filePath.split('/').pop() || node.title || 'code.js';

  const loadContent = async () => {
    if (!filePath) return;
    setLoading(true);
    try {
      const res = await fetchFileContent(filePath);
      if (res.success) {
        setContent(res.content);
        onUpdate({
          ...node,
          data: { ...node.data, content: res.content }
        });
      }
    } catch (err) {
      setContent(`// Error loading file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!node.data?.content && filePath) {
      loadContent();
    }
  }, [filePath]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = content.split('\n');

  return (
    <div className="flex flex-col h-full w-full sym-glass rounded-xl overflow-hidden shadow-2xl border border-[rgba(241,233,221,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[rgba(20,17,14,0.85)] border-b border-[rgba(241,233,221,0.08)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
            <FileCode size={13} />
          </span>
          <span className="font-mono text-[12px] font-medium text-[#F1E9DD] truncate max-w-[220px]" title={filePath}>
            {fileName}
          </span>
          <span className="text-[10px] font-mono text-[#8B7E72] bg-[#14110E] px-1.5 py-0.5 rounded">
            {lines.length} lines
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={loadContent}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#8B7E72] hover:text-[#CDC2B3] transition"
            title="Reload from disk"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#8B7E72] hover:text-[#CDC2B3] transition flex items-center gap-1 text-[11px]"
            title="Copy code to clipboard"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
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
            title="Close Code Node"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Code Viewer with Line Numbers */}
      <div className="flex-1 p-0 bg-[#0B0908] overflow-auto flex font-mono text-[12px] leading-relaxed">
        {loading ? (
          <div className="p-6 text-[#8B7E72] italic">Loading code file…</div>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="w-12 py-0.5 pr-3 text-right select-none text-[#8B7E72]/50 text-[11px] border-r border-[rgba(241,233,221,0.05)]">
                    {idx + 1}
                  </td>
                  <td className="py-0.5 pl-3 whitespace-pre text-[#CDC2B3] select-text">
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
