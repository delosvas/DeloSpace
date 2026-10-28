import React, { useState, useRef, useEffect } from 'react';
import { X, MoreVertical } from 'lucide-react';

const COLOR_MAP = {
  yellow: { bg: '#FEF08A', border: '#FDE047', text: '#713F12', tape: 'rgba(254, 240, 138, 0.7)' },
  pink: { bg: '#FBCFE8', border: '#F472B6', text: '#831843', tape: 'rgba(251, 207, 232, 0.7)' },
  green: { bg: '#BBF7D0', border: '#4ADE80', text: '#14532D', tape: 'rgba(187, 247, 208, 0.7)' },
  blue: { bg: '#BAE6FD', border: '#38BDF8', text: '#0C4A6E', tape: 'rgba(186, 230, 253, 0.7)' },
  orange: { bg: '#FED7AA', border: '#FB923C', text: '#7C2D12', tape: 'rgba(254, 215, 170, 0.7)' }
};

export default function StickyNote({
  note,
  nodeId,
  nodeWidth = 600,
  nodeHeight = 450,
  zoom = 1,
  onUpdateText,
  onUpdatePosition,
  onUpdateDimensions,
  onDelete,
  onContextMenu
}) {
  const [text, setText] = useState(note.text || '');
  const [isEditing, setIsEditing] = useState(note.isEditing || false);
  const colorScheme = COLOR_MAP[note.color] || COLOR_MAP.yellow;
  const textareaRef = useRef(null);

  const width = note.width || 180;
  const height = note.height || 140;

  useEffect(() => {
    setText(note.text || '');
  }, [note.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    onUpdateText?.(nodeId, note.id, val);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  // Dynamic font size based on sticky note dimensions and content length
  const calculateDynamicFontSize = () => {
    const dimensionFactor = Math.min(width / 14, height / 10);
    const textLen = (text || '').length;

    let size = Math.round(dimensionFactor);
    if (textLen > 180) {
      size = Math.max(10, size - 4);
    } else if (textLen > 90) {
      size = Math.max(10, size - 2);
    } else if (textLen < 25 && size > 12) {
      size = Math.min(26, size + 2);
    }

    return Math.max(10, Math.min(26, size));
  };

  const fontSize = calculateDynamicFontSize();
  const lineHeight = Math.round(fontSize * 1.35);

  // Drag tape header to move sticky note anywhere on the node
  const handleDragStart = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button')) return;

    e.preventDefault();
    e.stopPropagation();

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startRelX = note.relX || 20;
    const startRelY = note.relY || 20;

    const handleWindowMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      const dx = (moveEvent.clientX - startMouseX) / zoom;
      const dy = (moveEvent.clientY - startMouseY) / zoom;

      const maxRelX = Math.max(10, nodeWidth - width);
      const maxRelY = Math.max(10, nodeHeight - height);

      const newRelX = Math.max(0, Math.min(maxRelX, Math.round(startRelX + dx)));
      const newRelY = Math.max(0, Math.min(maxRelY, Math.round(startRelY + dy)));

      onUpdatePosition?.(nodeId, note.id, newRelX, newRelY);
    };

    const handleWindowMouseUp = () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  // Resize grip handle on bottom right
  const handleResizeStart = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startW = width;
    const startH = height;

    const handleWindowMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      const dx = (moveEvent.clientX - startMouseX) / zoom;
      const dy = (moveEvent.clientY - startMouseY) / zoom;

      const minW = 100;
      const minH = 75;
      const maxW = Math.max(minW, nodeWidth - (note.relX || 0));
      const maxH = Math.max(minH, nodeHeight - (note.relY || 0));

      const newW = Math.max(minW, Math.min(maxW, Math.round(startW + dx)));
      const newH = Math.max(minH, Math.min(maxH, Math.round(startH + dy)));

      onUpdateDimensions?.(nodeId, note.id, newW, newH);
    };

    const handleWindowMouseUp = () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  return (
    <div
      style={{
        left: `${note.relX || 20}px`,
        top: `${note.relY || 20}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: colorScheme.bg,
        borderColor: colorScheme.border
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, nodeId, note.id);
      }}
      className="absolute z-30 rounded-xl shadow-xl border p-2 flex flex-col font-sans select-none overflow-hidden group"
    >
      {/* Tape style bar at top (drag to reposition note) */}
      <div 
        onMouseDown={handleDragStart}
        className="flex items-center justify-between pb-1 mb-1 border-b border-black/10 cursor-grab active:cursor-grabbing select-none"
        title="Drag tape to move sticky note on node"
      >
        <div className="flex items-center gap-1">
          <span 
            className="w-9 h-2.5 rounded-sm shadow-sm"
            style={{ backgroundColor: colorScheme.tape }}
          />
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu?.(e, nodeId, note.id);
            }}
            className="opacity-40 hover:opacity-100 p-0.5 rounded text-black/60 hover:text-black transition"
            title="Note options"
          >
            <MoreVertical size={11} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(nodeId, note.id);
            }}
            className="opacity-40 hover:opacity-100 p-0.5 rounded text-black/60 hover:text-rose-600 transition"
            title="Delete note"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Note Content with dynamic auto-scaled font size */}
      <div 
        onClick={() => setIsEditing(true)}
        className="flex-1 cursor-text overflow-y-auto overflow-x-hidden pr-0.5"
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleBlur();
              }
            }}
            placeholder="Type note…"
            style={{ 
              color: colorScheme.text,
              fontSize: `${fontSize}px`,
              lineHeight: `${lineHeight}px`
            }}
            className="w-full h-full bg-transparent resize-none font-sans font-medium focus:outline-none placeholder-black/40"
          />
        ) : (
          <p 
            style={{ 
              color: colorScheme.text,
              fontSize: `${fontSize}px`,
              lineHeight: `${lineHeight}px`
            }}
            className="font-sans font-medium whitespace-pre-wrap break-words"
          >
            {text || <span className="opacity-40 italic">Empty sticky note…</span>}
          </p>
        )}
      </div>

      {/* Resize Grip Handle at bottom-right corner */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-30 hover:opacity-100 group-hover:opacity-75 transition z-10"
        title="Drag to resize sticky note"
      >
        <div className="w-2 h-2 border-r-2 border-b-2" style={{ borderColor: colorScheme.text }} />
      </div>
    </div>
  );
}
