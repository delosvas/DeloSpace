import React, { useState } from 'react';
import { 
  LayoutGrid, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Layers, 
  Settings2,
  FolderOpen,
  Monitor,
  Move,
  Maximize2
} from 'lucide-react';

const GROUP_COLORS = [
  { id: '#A855F7', label: 'Purple' },
  { id: '#FF8038', label: 'Orange' },
  { id: '#10B981', label: 'Emerald' },
  { id: '#3B82F6', label: 'Blue' },
  { id: '#EC4899', label: 'Pink' }
];

export default function GroupNode({
  node,
  allNodes = [],
  onUpdate,
  onClose,
  zoom = 1
}) {
  const [title, setTitle] = useState(node.title || 'Subspace Group');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const color = node.data?.color || '#A855F7';
  const isCollapsed = node.data?.collapsed || false;
  const groupType = node.data?.groupType || 'fitted'; // 'fitted' | 'free'

  // Member nodes can be determined either by node.data.memberNodeIds or n.groupId
  const memberNodes = allNodes.filter(n => 
    n.id !== node.id && (n.groupId === node.id || (node.data?.memberNodeIds || []).includes(n.id))
  );

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    onUpdate?.({
      ...node,
      title
    });
  };

  const handleToggleCollapse = () => {
    onUpdate?.({
      ...node,
      data: {
        ...(node.data || {}),
        collapsed: !isCollapsed
      }
    });
  };

  const handleChangeColor = (newColor) => {
    onUpdate?.({
      ...node,
      data: {
        ...(node.data || {}),
        color: newColor
      }
    });
  };

  return (
    <div 
      style={{
        borderColor: `${color}40`,
        backgroundColor: `${color}06`
      }}
      className="flex flex-col h-full w-full rounded-2xl border-2 border-dashed shadow-xl backdrop-blur-sm overflow-hidden select-none transition-colors duration-200"
    >
      {/* Subspace Header */}
      <div 
        style={{ backgroundColor: `${color}18`, borderBottomColor: `${color}30` }}
        className="flex items-center justify-between px-4 py-2.5 border-b"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div 
            style={{ backgroundColor: `${color}30`, color: color }}
            className="p-1 rounded-lg"
            title={groupType === 'fitted' ? 'Fitted Subspace Screen (Smart Snap & Auto-Scale)' : 'Free Subspace (Freeform Container)'}
          >
            {groupType === 'fitted' ? <Monitor size={15} /> : <Move size={15} />}
          </div>

          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              className="bg-[#0B0908] border border-[rgba(241,233,221,0.2)] rounded px-2 py-0.5 text-xs text-[#F1E9DD] focus:outline-none"
            />
          ) : (
            <span 
              onDoubleClick={() => setIsEditingTitle(true)}
              className="font-semibold text-xs text-[#F1E9DD] truncate cursor-pointer hover:underline"
              title="Double-click to rename subspace"
            >
              {title}
            </span>
          )}

          <span 
            style={{ backgroundColor: `${color}25`, color: color }}
            className="px-2 py-0.2 rounded-full text-[10px] font-mono font-medium"
          >
            {groupType === 'fitted' ? 'Fitted Screen' : 'Freeform'} · {memberNodes.length} {memberNodes.length === 1 ? 'node' : 'nodes'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {/* Color Switcher */}
          <div className="flex items-center gap-1 mr-1">
            {GROUP_COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => handleChangeColor(c.id)}
                style={{ backgroundColor: c.id }}
                className={`w-3 h-3 rounded-full hover:scale-125 transition ${color === c.id ? 'ring-1 ring-white' : 'opacity-60'}`}
                title={c.label}
              />
            ))}
          </div>

          <button
            onClick={handleToggleCollapse}
            className="p-1 rounded text-[#8B7E72] hover:text-[#CDC2B3] hover:bg-white/5 transition"
            title={isCollapsed ? "Expand Subspace" : "Collapse Subspace"}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          <button
            onClick={() => onClose?.(node.id)}
            className="p-1 rounded text-[#8B7E72] hover:text-rose-400 hover:bg-rose-500/10 transition"
            title="Delete Subspace"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Subspace Area / Snap Matrix */}
      <div className="flex-1 p-3 flex flex-col relative overflow-hidden">
        {/* Subtle dot matrix grid */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {isCollapsed ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-xs text-[#CDC2B3] font-medium mb-1">
              Subspace Minimized ({memberNodes.length} nodes grouped)
            </span>
            <span className="text-[11px] text-[#8B7E72]">
              Drag this card to move all grouped nodes together across the canvas.
            </span>
          </div>
        ) : memberNodes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-[rgba(241,233,221,0.06)] rounded-xl m-2">
            {groupType === 'fitted' ? (
              <>
                <Monitor size={28} style={{ color }} className="opacity-40 mb-2" />
                <span className="text-xs text-[#CDC2B3] font-medium">
                  Fitted Virtual Screen Ready
                </span>
                <p className="text-[11px] text-[#8B7E72] mt-1 max-w-[320px]">
                  Drag any terminal or node near the <strong>sides for 1/2 split</strong> or <strong>corners for 1/4 quadrant</strong>. Resizing this screen auto-scales all docked nodes proportionally!
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-[#8B7E72] opacity-75">
                  <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5">1/2 Left</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5">1/2 Right</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5">1/4 Corners</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5">Full</span>
                </div>
              </>
            ) : (
              <>
                <FolderOpen size={26} style={{ color }} className="opacity-40 mb-2" />
                <span className="text-xs text-[#CDC2B3] font-medium">
                  Freeform Subspace Ready
                </span>
                <p className="text-[11px] text-[#8B7E72] mt-1 max-w-[300px]">
                  Drop any nodes inside to group them. Nodes keep their custom sizes, and moving this subspace moves all of them together.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-end p-2 pointer-events-none">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8B7E72] bg-[#14110E]/80 px-2.5 py-1 rounded-md self-start border border-[rgba(241,233,221,0.05)]">
              <Layers size={11} style={{ color }} />
              <span>
                {groupType === 'fitted' ? 'Fitted Screen' : 'Free Subspace'} · {memberNodes.length} active docked
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
