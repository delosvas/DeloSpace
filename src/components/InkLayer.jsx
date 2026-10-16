import React, { useRef, useState, useEffect } from 'react';
import { 
  PenTool, 
  Highlighter, 
  Eraser, 
  Trash2, 
  X, 
  Check, 
  Palette,
  Undo2
} from 'lucide-react';

const COLORS = [
  { name: 'Orange', hex: '#FF8038' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'White', hex: '#F1E9DD' }
];

export default function InkLayer({
  isActive,
  onClose,
  strokes = [],
  onUpdateStrokes,
  zoom = 1,
  panX = 0,
  panY = 0
}) {
  const [currentTool, setCurrentTool] = useState('pen'); // 'pen', 'highlighter', 'eraser'
  const [currentColor, setCurrentColor] = useState('#FF8038');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [currentStroke, setCurrentStroke] = useState(null);

  const isDrawingRef = useRef(false);
  const svgRef = useRef(null);

  // Convert screen coordinates to canvas space with sub-pixel precision
  const getCanvasCoords = (clientX, clientY) => {
    if (svgRef.current) {
      try {
        const svg = svgRef.current;
        const ctm = svg.getScreenCTM();
        if (ctm) {
          const pt = svg.createSVGPoint();
          pt.x = clientX;
          pt.y = clientY;
          const transformed = pt.matrixTransform(ctm.inverse());
          return { x: transformed.x, y: transformed.y };
        }
      } catch (err) {
        // Fallback to rect-based calculation below
      }
    }

    const rect = svgRef.current?.getBoundingClientRect();
    const ox = rect ? rect.left : 0;
    const oy = rect ? rect.top : 56;
    return {
      x: (clientX - ox) / zoom,
      y: (clientY - oy) / zoom
    };
  };

  const handlePointerDown = (e) => {
    if (!isActive) return;
    if (e.target.closest('.ink-toolbar')) return;

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch (_) {}

    isDrawingRef.current = true;
    const pt = getCanvasCoords(e.clientX, e.clientY);

    if (currentTool === 'eraser') {
      // Find and erase stroke closest to pointer
      const updated = strokes.filter(s => {
        return !s.points.some(p => Math.hypot(p.x - pt.x, p.y - pt.y) < 20 / zoom);
      });
      onUpdateStrokes(updated);
      return;
    }

    setCurrentStroke({
      id: `stroke-${Date.now()}`,
      tool: currentTool,
      color: currentTool === 'highlighter' ? `${currentColor}88` : currentColor,
      width: currentTool === 'highlighter' ? strokeWidth * 4 : strokeWidth,
      points: [pt]
    });
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current || !isActive) return;
    const pt = getCanvasCoords(e.clientX, e.clientY);

    if (currentTool === 'eraser') {
      const updated = strokes.filter(s => {
        return !s.points.some(p => Math.hypot(p.x - pt.x, p.y - pt.y) < 20 / zoom);
      });
      if (updated.length !== strokes.length) {
        onUpdateStrokes(updated);
      }
      return;
    }

    if (currentStroke) {
      setCurrentStroke(prev => ({
        ...prev,
        points: [...prev.points, pt]
      }));
    }
  };

  const handlePointerUp = (e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    try {
      e?.currentTarget?.releasePointerCapture?.(e?.pointerId);
    } catch (_) {}

    if (currentStroke && currentStroke.points.length > 1) {
      onUpdateStrokes([...strokes, currentStroke]);
    }
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    onUpdateStrokes(strokes.slice(0, -1));
  };

  const handleClear = () => {
    if (window.confirm('Clear all drawings and annotations on this board?')) {
      onUpdateStrokes([]);
    }
  };

  // Convert points array to SVG path string
  const renderPathD = (points) => {
    if (!points || points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  return (
    <>
      {/* Interactive SVG Ink Layer */}
      <svg
        ref={svgRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`absolute inset-0 w-full h-full z-30 ${
          isActive 
            ? currentTool === 'eraser' 
              ? 'cursor-cell pointer-events-auto' 
              : 'cursor-crosshair pointer-events-auto' 
            : 'pointer-events-none'
        }`}
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: 'top left',
          overflow: 'visible'
        }}
      >
        {/* Render Committed Strokes */}
        {strokes.map((s) => (
          <path
            key={s.id}
            d={renderPathD(s.points)}
            stroke={s.color}
            strokeWidth={s.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}

        {/* Render Current In-Progress Stroke */}
        {currentStroke && (
          <path
            d={renderPathD(currentStroke.points)}
            stroke={currentStroke.color}
            strokeWidth={currentStroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>

      {/* Floating Ink Toolbar (Only visible when drawing mode is active) */}
      {isActive && (
        <div className="ink-toolbar fixed top-18 left-1/2 -translate-x-1/2 z-50 sym-glass rounded-2xl p-2 border border-[rgba(241,233,221,0.15)] shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          {/* Tool selector */}
          <div className="flex items-center gap-1 bg-[#14110E] p-1 rounded-xl border border-[rgba(241,233,221,0.06)]">
            <button
              onClick={() => setCurrentTool('pen')}
              className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition ${
                currentTool === 'pen'
                  ? 'bg-[#1F1A16] text-[#FF8038] shadow-sm'
                  : 'text-[#8B7E72] hover:text-[#CDC2B3]'
              }`}
              title="Pen Tool (draw lines & annotations)"
            >
              <PenTool size={14} />
              <span className="font-medium text-[11px]">Pen</span>
            </button>

            <button
              onClick={() => setCurrentTool('highlighter')}
              className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition ${
                currentTool === 'highlighter'
                  ? 'bg-[#1F1A16] text-[#FF8038] shadow-sm'
                  : 'text-[#8B7E72] hover:text-[#CDC2B3]'
              }`}
              title="Highlighter (semi-transparent highlight)"
            >
              <Highlighter size={14} />
              <span className="font-medium text-[11px]">Highlight</span>
            </button>

            <button
              onClick={() => setCurrentTool('eraser')}
              className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition ${
                currentTool === 'eraser'
                  ? 'bg-[#1F1A16] text-rose-400 shadow-sm'
                  : 'text-[#8B7E72] hover:text-[#CDC2B3]'
              }`}
              title="Eraser (click strokes to erase)"
            >
              <Eraser size={14} />
              <span className="font-medium text-[11px]">Eraser</span>
            </button>
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-1.5 px-2">
            {COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => setCurrentColor(c.hex)}
                className={`w-5 h-5 rounded-full transition transform hover:scale-110 flex items-center justify-center ${
                  currentColor === c.hex ? 'ring-2 ring-white/60 scale-105' : ''
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>

          {/* Width slider */}
          <div className="flex items-center gap-2 px-2 border-l border-r border-[rgba(241,233,221,0.08)]">
            <span className="text-[10px] font-mono text-[#8B7E72]">Size</span>
            <input
              type="range"
              min="2"
              max="12"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-16 accent-[#FF8038] cursor-pointer"
            />
          </div>

          {/* Actions: Undo, Clear, Exit */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              className="p-2 rounded-lg text-[#8B7E72] hover:text-[#F1E9DD] hover:bg-[#1F1A16] transition"
              title="Undo stroke"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={handleClear}
              className="p-2 rounded-lg text-[#8B7E72] hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Clear all strokes"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg bg-[#1F1A16] hover:bg-[#2A231E] text-[#F1E9DD] text-xs font-medium flex items-center gap-1 ml-1"
              title="Done Drawing"
            >
              <Check size={12} className="text-[#10B981]" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
