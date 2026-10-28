import React, { useState, useRef, useEffect } from 'react';
import { X, MoreVertical, Edit2, Trash2, Palette, Minus, Plus } from 'lucide-react';

const COLOR_MAP = {
  yellow: { bg: '#FEF08A', border: '#FDE047', text: '#713F12', tape: 'rgba(254, 240, 138, 0.7)' },
  pink: { bg: '#FBCFE8', border: '#F472B6', text: '#831843', tape: 'rgba(251, 207, 232, 0.7)' },
  green: { bg: '#BBF7D0', border: '#4ADE80', text: '#14532D', tape: 'rgba(187, 247, 208, 0.7)' },
  blue: { bg: '#BAE6FD', border: '#38BDF8', text: '#0C4A6E', tape: 'rgba(186, 230, 253, 0.7)' },
  orange: { bg: '#FED7AA', border: '#FB923C', text: '#7C2D12', tape: 'rgba(254, 215, 170, 0.7)' }
};

const FONT_PRESETS = [
  { label: 'S', size: 10 },
  { label: 'M', size: 12 },
  { label: 'L', size: 15 },
  { label: 'XL', size: 18 }
];

export default function StickyNote({
  note,
  nodeId,
  nodeWidth = 600,
  nodeHeight = 450,
  zoom = 1,
  onUpdateText,
  onUpdatePosition,
  onUpdateDimensions,
  onUpdateFontSize,
  onChangeColor,
  onDelete,
  onContextMenu
}) {
  const [text, setText] = useState(note.text || '');
  const [isEditing, setIsEditing] = useState(note.isEditing || false);
  const [showOptions, setShowOptions] = useState(false);
  const colorScheme = COLOR_MAP[note.color] || COLOR_MAP.yellow;
  const textareaRef = useRef(null);
  const optionsRef = useRef(null);

  const width = note.width || 180;
  const height = note.height || 140;
  const fontSize = note.fontSize || 12;
  const lineHeight = Math.round(fontSize * 1.35);

  useEffect(() => {
    setText(note.text || '');
  }, [note.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Close options menu on outside click
  useEffect(() => {
    if (!showOptions) return;
    const handleOutsideClick = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick, true);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick, true);
    };
  }, [showOptions]);

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    onUpdateText?.(nodeId, note.id, val);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  // Drag tape header to move sticky note anywhere on the node
  const handleDragStart = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('.options-popover')) return;

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
      className="absolute z-30 rounded-xl shadow-xl border p-2 flex flex-col font-sans select-none overflow-visible group"
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
        <div className="flex items-center gap-0.5 relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(prev => !prev);
            }}
            className={`p-0.5 rounded transition ${
              showOptions 
                ? 'opacity-100 bg-black/15 text-black' 
                : 'opacity-40 hover:opacity-100 text-black/60 hover:text-black'
            }`}
            title="Note options & text size"
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

          {/* 3-Dots Options & Text Size Adjuster Popover */}
          {showOptions && (
            <div
              ref={optionsRef}
              onMouseDown={(e) => e.stopPropagation()}
              className="options-popover absolute top-6 right-0 z-50 w-48 bg-[#14110E]/95 backdrop-blur-xl border border-[rgba(241,233,221,0.18)] rounded-xl shadow-2xl p-2.5 text-[#F1E9DD] select-none animate-in fade-in zoom-in-95 duration-100 text-xs"
            >
              {/* Text Size Stepper & Presets */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8B7E72] mb-1">
                  <span>Text Size</span>
                  <span className="text-[#FF8038] font-bold">{fontSize}px</span>
                </div>
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = Math.max(9, fontSize - 1);
                      onUpdateFontSize?.(nodeId, note.id, next);
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 active:bg-white/20 text-[#CDC2B3] hover:text-white transition font-bold"
                    title="Decrease font size"
                  >
                    <Minus size={11} />
                  </button>

                  <div className="flex-1 flex justify-center gap-1">
                    {FONT_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateFontSize?.(nodeId, note.id, preset.size);
                        }}
                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition ${
                          fontSize === preset.size
                            ? 'bg-[#FF8038] text-white font-bold shadow-sm'
                            : 'hover:bg-white/10 text-[#A89A8C] hover:text-white'
                        }`}
                        title={`${preset.label} (${preset.size}px)`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = Math.min(32, fontSize + 1);
                      onUpdateFontSize?.(nodeId, note.id, next);
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 active:bg-white/20 text-[#CDC2B3] hover:text-white transition font-bold"
                    title="Increase font size"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              {/* Color Swatches */}
              <div className="mb-2">
                <span className="text-[10px] font-mono uppercase text-[#8B7E72] block mb-1 flex items-center gap-1">
                  <Palette size={10} /> Color
                </span>
                <div className="flex items-center justify-between px-0.5">
                  {Object.entries(COLOR_MAP).map(([colorKey, cfg]) => (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeColor?.(nodeId, note.id, colorKey);
                      }}
                      style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                      className={`w-5 h-5 rounded-full border transition hover:scale-110 shadow-sm ${
                        note.color === colorKey ? 'ring-2 ring-white ring-offset-1 ring-offset-[#14110E]' : ''
                      }`}
                      title={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-white/10 pt-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(false);
                    setIsEditing(true);
                  }}
                  className="w-full px-2 py-1 flex items-center gap-1.5 rounded hover:bg-white/10 text-left text-[#CDC2B3] hover:text-white transition text-[11px]"
                >
                  <Edit2 size={12} />
                  <span>Edit Note</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(false);
                    onDelete?.(nodeId, note.id);
                  }}
                  className="w-full px-2 py-1 flex items-center gap-1.5 rounded hover:bg-rose-500/20 text-left text-rose-400 hover:text-rose-300 transition text-[11px]"
                >
                  <Trash2 size={12} />
                  <span>Delete Note</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Note Content */}
      <div 
        onClick={() => setIsEditing(true)}
        className="flex-1 cursor-text overflow-y-auto overflow-x-hidden pr-0.5 flex flex-col"
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
            className="w-full h-full bg-transparent resize-none font-sans font-medium focus:outline-none placeholder-black/30"
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
            {text || <span className="opacity-40 italic font-normal">Empty sticky note…</span>}
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
