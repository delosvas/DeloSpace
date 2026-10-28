import React, { useEffect, useRef } from 'react';
import { 
  RotateCcw, 
  StickyNote as StickyIcon, 
  Copy, 
  Maximize2, 
  Minimize2, 
  X, 
  Plus, 
  LayoutGrid, 
  FileText, 
  Columns3, 
  AlarmClock, 
  ZoomIn, 
  Maximize,
  Edit2,
  Trash2,
  Palette,
  Monitor,
  Move
} from 'lucide-react';

const STICKY_COLORS = [
  { id: 'yellow', bg: '#FEF08A', border: '#FDE047', label: 'Yellow' },
  { id: 'pink', bg: '#FBCFE8', border: '#F472B6', label: 'Pink' },
  { id: 'green', bg: '#BBF7D0', border: '#4ADE80', label: 'Green' },
  { id: 'blue', bg: '#BAE6FD', border: '#38BDF8', label: 'Blue' },
  { id: 'orange', bg: '#FED7AA', border: '#FB923C', label: 'Orange' }
];

export default function ContextMenu({
  contextMenu,
  onClose,
  onRefreshNode,
  onAddStickyNote,
  onDuplicateNode,
  onToggleMaximize,
  onCloseNode,
  onAddSubspace,
  onAddTerminal,
  onAddNotes,
  onAddKanban,
  onOpenQuotaAlarm,
  onResetZoom,
  onFitAll,
  onEditSticky,
  onChangeStickyColor,
  onDeleteSticky
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleOutsideClick, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!contextMenu || !contextMenu.isOpen) return null;

  const { x, y, targetType, targetNodeId, targetStickyId, relativeCoords, isMaximized } = contextMenu;

  // Keep menu within screen boundaries
  const menuWidth = 220;
  const menuHeight = targetType === 'node' ? 240 : targetType === 'sticky' ? 180 : 260;
  const clampedX = Math.min(x, window.innerWidth - menuWidth - 10);
  const clampedY = Math.min(y, window.innerHeight - menuHeight - 10);

  return (
    <div
      ref={menuRef}
      style={{ left: `${clampedX}px`, top: `${clampedY}px` }}
      className="fixed z-50 min-w-[210px] bg-[#14110E]/95 backdrop-blur-xl border border-[rgba(241,233,221,0.15)] rounded-xl shadow-2xl py-1.5 text-xs text-[#F1E9DD] animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {/* NODE CONTEXT MENU */}
      {targetType === 'node' && (
        <div className="space-y-0.5">
          <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-[#8B7E72] border-b border-[rgba(241,233,221,0.06)] mb-1">
            Node Actions
          </div>

          <button
            onClick={() => { onRefreshNode?.(targetNodeId); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-[#F1E9DD] hover:text-white transition"
          >
            <RotateCcw size={13} className="text-[#10B981]" />
            <span>Refresh / Reconnect Node</span>
          </button>

          <button
            onClick={() => { onAddStickyNote?.(targetNodeId, relativeCoords.x, relativeCoords.y); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-[#F1E9DD] hover:text-white transition"
          >
            <StickyIcon size={13} className="text-yellow-400" />
            <span>Add Sticky Note Here</span>
          </button>

          {onDuplicateNode && (
            <button
              onClick={() => { onDuplicateNode?.(targetNodeId); onClose(); }}
              className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-[#CDC2B3] hover:text-white transition"
            >
              <Copy size={13} />
              <span>Duplicate Node</span>
            </button>
          )}

          {onToggleMaximize && (
            <button
              onClick={() => { onToggleMaximize?.(targetNodeId); onClose(); }}
              className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-[#CDC2B3] hover:text-white transition"
            >
              {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span>{isMaximized ? 'Restore View' : 'Maximize Node'}</span>
            </button>
          )}

          <div className="h-px bg-[rgba(241,233,221,0.08)] my-1" />

          <button
            onClick={() => { onCloseNode?.(targetNodeId); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 flex items-center gap-2 text-left transition"
          >
            <X size={13} />
            <span>Close Node</span>
          </button>
        </div>
      )}

      {/* STICKY NOTE CONTEXT MENU */}
      {targetType === 'sticky' && (
        <div className="space-y-0.5">
          <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-[#8B7E72] border-b border-[rgba(241,233,221,0.06)] mb-1">
            Sticky Note
          </div>

          <button
            onClick={() => { onEditSticky?.(targetStickyId); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-[#F1E9DD] hover:text-white transition"
          >
            <Edit2 size={13} />
            <span>Edit Note</span>
          </button>

          {/* Color Palette */}
          <div className="px-3 py-2 border-t border-b border-[rgba(241,233,221,0.08)] my-1">
            <span className="text-[10px] text-[#8B7E72] block mb-1.5 flex items-center gap-1">
              <Palette size={11} /> Color:
            </span>
            <div className="flex items-center gap-2">
              {STICKY_COLORS.map(col => (
                <button
                  key={col.id}
                  onClick={() => { onChangeStickyColor?.(targetNodeId, targetStickyId, col.id); onClose(); }}
                  style={{ backgroundColor: col.bg, borderColor: col.border }}
                  className="w-5 h-5 rounded-full border hover:scale-110 transition shadow-sm"
                  title={col.label}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => { onDeleteSticky?.(targetNodeId, targetStickyId); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 flex items-center gap-2 text-left transition"
          >
            <Trash2 size={13} />
            <span>Delete Note</span>
          </button>
        </div>
      )}

      {/* CANVAS BACKGROUND CONTEXT MENU */}
      {targetType === 'canvas' && (
        <div className="space-y-0.5">
          <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-[#8B7E72] border-b border-[rgba(241,233,221,0.06)] mb-1">
            Add to Canvas
          </div>

          <button
            onClick={() => { onAddTerminal?.('claude'); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-[#F1E9DD] hover:text-white transition"
          >
            <Plus size={13} className="text-[#FF8038]" />
            <span>Add Claude Terminal</span>
          </button>

          <button
            onClick={() => { onAddTerminal?.('codex'); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-[#F1E9DD] hover:text-white transition"
          >
            <Plus size={13} className="text-[#10B981]" />
            <span>Add Codex Terminal</span>
          </button>

          <button
            onClick={() => { onAddSubspace?.('fitted'); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-[#F1E9DD] hover:text-white transition"
          >
            <Monitor size={13} className="text-[#A855F7]" />
            <span>New Fitted Subspace (Screen)</span>
          </button>

          <button
            onClick={() => { onAddSubspace?.('free'); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-[#F1E9DD] hover:text-white transition"
          >
            <Move size={13} className="text-[#FF8038]" />
            <span>New Free Subspace (Group)</span>
          </button>

          <button
            onClick={() => { onAddNotes?.(); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-[#CDC2B3] hover:text-white transition"
          >
            <FileText size={13} />
            <span>New Markdown Notes</span>
          </button>

          <button
            onClick={() => { onAddKanban?.(); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-[#CDC2B3] hover:text-white transition"
          >
            <Columns3 size={13} />
            <span>New Kanban Board</span>
          </button>

          <div className="h-px bg-[rgba(241,233,221,0.08)] my-1" />

          <button
            onClick={() => { onOpenQuotaAlarm?.(); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-amber-300 hover:text-amber-200 transition"
          >
            <AlarmClock size={13} />
            <span>Quota Resetter Alarm…</span>
          </button>

          <div className="h-px bg-[rgba(241,233,221,0.08)] my-1" />

          <button
            onClick={() => { onResetZoom?.(); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-[#8B7E72] hover:text-[#CDC2B3] transition"
          >
            <ZoomIn size={13} />
            <span>Reset Zoom (100%)</span>
          </button>

          <button
            onClick={() => { onFitAll?.(); onClose(); }}
            className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-left text-[#8B7E72] hover:text-[#CDC2B3] transition"
          >
            <Maximize size={13} />
            <span>Fit All Nodes</span>
          </button>
        </div>
      )}
    </div>
  );
}
