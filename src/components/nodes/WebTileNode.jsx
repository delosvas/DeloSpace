import React, { useState } from 'react';
import { Globe, RotateCw, ExternalLink, Smartphone, Tablet, Monitor, X, Maximize2, Minimize2 } from 'lucide-react';

export default function WebTileNode({ node, onUpdate, onClose, isMaximized, onToggleMaximize }) {
  const [url, setUrl] = useState(node.data?.url || 'about:blank');
  const [inputUrl, setInputUrl] = useState(url);
  const [device, setDevice] = useState(node.data?.device || 'desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNavigate = (e) => {
    e.preventDefault();
    let formatted = inputUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `http://${formatted}`;
    }
    setUrl(formatted);
    setInputUrl(formatted);
    onUpdate({
      ...node,
      data: { ...node.data, url: formatted, device }
    });
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getFrameWidth = () => {
    if (device === 'mobile') return '375px';
    if (device === 'tablet') return '768px';
    return '100%';
  };

  return (
    <div className="flex flex-col h-full w-full sym-glass rounded-xl overflow-hidden shadow-2xl border border-[rgba(241,233,221,0.12)]">
      {/* Node Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[rgba(20,17,14,0.85)] border-b border-[rgba(241,233,221,0.08)]">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
            <Globe size={13} />
          </span>
          <span className="font-medium text-[13px] text-[#F1E9DD]">
            {node.title || 'Live Web Tile'}
          </span>
        </div>

        {/* Device Viewport Selector */}
        <div className="flex items-center gap-1 bg-[#14110E] p-0.5 rounded-lg border border-[rgba(241,233,221,0.08)]">
          <button 
            onClick={() => setDevice('desktop')}
            className={`p-1 rounded ${device === 'desktop' ? 'bg-[#FF8038]/20 text-[#FF8038]' : 'text-[#8B7E72] hover:text-[#CDC2B3]'}`}
            title="Desktop View"
          >
            <Monitor size={13} />
          </button>
          <button 
            onClick={() => setDevice('tablet')}
            className={`p-1 rounded ${device === 'tablet' ? 'bg-[#FF8038]/20 text-[#FF8038]' : 'text-[#8B7E72] hover:text-[#CDC2B3]'}`}
            title="Tablet View (768px)"
          >
            <Tablet size={13} />
          </button>
          <button 
            onClick={() => setDevice('mobile')}
            className={`p-1 rounded ${device === 'mobile' ? 'bg-[#FF8038]/20 text-[#FF8038]' : 'text-[#8B7E72] hover:text-[#CDC2B3]'}`}
            title="Mobile View (375px)"
          >
            <Smartphone size={13} />
          </button>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#8B7E72] hover:text-[#CDC2B3] transition"
            title="Open in new browser tab"
          >
            <ExternalLink size={13} />
          </a>
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
            title="Close Tile"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* URL Address Bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#14110E] border-b border-[rgba(241,233,221,0.06)]">
        <button 
          onClick={handleRefresh}
          className="p-1 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#8B7E72] hover:text-[#CDC2B3] transition"
          title="Reload Preview"
        >
          <RotateCw size={13} />
        </button>
        <form onSubmit={handleNavigate} className="flex-1">
          <input 
            type="text" 
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full bg-[#0B0908] border border-[rgba(241,233,221,0.1)] rounded px-2.5 py-1 text-[12px] text-[#CDC2B3] font-mono focus:outline-none focus:border-[#FF8038]"
          />
        </form>
      </div>

      {/* Frame Container */}
      <div className="flex-1 min-h-0 w-full bg-[#050403] overflow-auto flex justify-center items-stretch p-0 overscroll-contain">
        <div 
          style={{ width: getFrameWidth() }} 
          className="h-full bg-white transition-all duration-300 relative"
        >
          <iframe 
            key={refreshKey}
            src={url}
            title={node.title}
            className="w-full h-full border-none"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}
