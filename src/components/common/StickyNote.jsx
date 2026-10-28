import React, { useState, useRef, useEffect } from 'react';
import { X, MoreVertical } from 'lucide-react';

const COLOR_MAP = {
  yellow: { bg: '#FEF08A', border: '#FDE047', text: '#713F12', tape: 'rgba(254, 240, 138, 0.6)' },
  pink: { bg: '#FBCFE8', border: '#F472B6', text: '#831843', tape: 'rgba(251, 207, 232, 0.6)' },
  green: { bg: '#BBF7D0', border: '#4ADE80', text: '#14532D', tape: 'rgba(187, 247, 208, 0.6)' },
  blue: { bg: '#BAE6FD', border: '#38BDF8', text: '#0C4A6E', tape: 'rgba(186, 230, 253, 0.6)' },
  orange: { bg: '#FED7AA', border: '#FB923C', text: '#7C2D12', tape: 'rgba(254, 215, 170, 0.6)' }
};

export default function StickyNote({
  note,
  nodeId,
  zoom = 1,
  onUpdateText,
  onDelete,
  onContextMenu
}) {
  const [text, setText] = useState(note.text || '');
  const [isEditing, setIsEditing] = useState(note.isEditing || false);
  const colorScheme = COLOR_MAP[note.color] || COLOR_MAP.yellow;
  const textareaRef = useRef(null);

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

  return (
    <div
      style={{
        left: `${note.relX || 20}px`,
        top: `${note.relY || 20}px`,
        backgroundColor: colorScheme.bg,
        borderColor: colorScheme.border
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, nodeId, note.id);
      }}
      className="absolute z-30 w-44 rounded-lg shadow-xl border p-2 flex flex-col font-sans transition-transform duration-100 hover:scale-[1.02] select-none"
    >
      {/* Tape style bar at top */}
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-black/10 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1">
          <span 
            className="w-8 h-2 rounded-sm"
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

      {/* Note Content */}
      <div 
        onClick={() => setIsEditing(true)}
        className="flex-1 min-h-[50px] cursor-text"
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Type note…"
            style={{ color: colorScheme.text }}
            className="w-full h-full bg-transparent resize-none text-[11px] font-sans font-medium leading-relaxed focus:outline-none placeholder-black/40"
          />
        ) : (
          <p 
            style={{ color: colorScheme.text }}
            className="text-[11px] font-sans font-medium whitespace-pre-wrap break-words leading-relaxed"
          >
            {text || <span className="opacity-40 italic">Empty sticky note…</span>}
          </p>
        )}
      </div>
    </div>
  );
}
