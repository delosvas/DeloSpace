import React, { useRef, useState, useEffect } from 'react';
import { 
  Maximize, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Scan
} from 'lucide-react';

export default function Minimap({ 
  nodes = [], 
  canvasState, 
  onNavigate,
  onResetZoom,
  onFitAll,
  onZoomIn,
  onZoomOut
}) {
  const { panX = 0, panY = 0, zoom = 1 } = canvasState || {};
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef(null);

  const MAP_WIDTH = 224;
  const MAP_HEIGHT = 140;
  const HEADER_HEIGHT = 28;
  const innerWidth = MAP_WIDTH;
  const innerHeight = MAP_HEIGHT - HEADER_HEIGHT;

  // 1. Calculate camera viewport in canvas coordinates
  const vpLeft = -panX / zoom;
  const vpTop = -panY / zoom;
  const vpRight = (window.innerWidth - panX) / zoom;
  const vpBottom = (window.innerHeight - panY) / zoom;

  // 2. Collect node boundaries
  const nodeLefts = nodes.map(n => n.x);
  const nodeRights = nodes.map(n => n.x + (n.width || 400));
  const nodeTops = nodes.map(n => n.y);
  const nodeBottoms = nodes.map(n => n.y + (n.height || 300));

  // 3. Dynamic bounding box including both all nodes AND current camera frustum
  const PADDING = 180;
  const minX = Math.min(vpLeft, ...(nodeLefts.length ? nodeLefts : [0])) - PADDING;
  const maxX = Math.max(vpRight, ...(nodeRights.length ? nodeRights : [2000])) + PADDING;
  const minY = Math.min(vpTop, ...(nodeTops.length ? nodeTops : [0])) - PADDING;
  const maxY = Math.max(vpBottom, ...(nodeBottoms.length ? nodeBottoms : [1400])) + PADDING;

  const totalW = Math.max(1, maxX - minX);
  const totalH = Math.max(1, maxY - minY);

  // Uniform scale to preserve correct aspect ratio without distortion
  const scale = Math.min(innerWidth / totalW, innerHeight / totalH);

  // Center the coordinate system in the inner canvas area
  const renderW = totalW * scale;
  const renderH = totalH * scale;
  const offsetX = (innerWidth - renderW) / 2;
  const offsetY = (innerHeight - renderH) / 2;

  // Canvas to Minimap coordinate conversion
  const toMapX = (cx) => offsetX + (cx - minX) * scale;
  const toMapY = (cy) => offsetY + (cy - minY) * scale;

  // Minimap pixel to Canvas coordinate conversion
  const toCanvasX = (mx) => minX + (mx - offsetX) / scale;
  const toCanvasY = (my) => minY + (my - offsetY) / scale;

  // Camera Frustum dimensions on minimap
  const cameraX = toMapX(vpLeft);
  const cameraY = toMapY(vpTop);
  const cameraW = Math.max(6, (window.innerWidth / zoom) * scale);
  const cameraH = Math.max(5, (window.innerHeight / zoom) * scale);

  // Navigate canvas center to clicked/dragged position
  const panToMinimapPoint = (clientX, clientY) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top - HEADER_HEIGHT;

    const targetCanvasX = toCanvasX(mx);
    const targetCanvasY = toCanvasY(my);

    onNavigate({
      panX: window.innerWidth / 2 - targetCanvasX * zoom,
      panY: window.innerHeight / 2 - targetCanvasY * zoom
    });
  };

  const handlePointerDown = (e) => {
    if (e.target.closest('.minimap-controls')) return;
    e.preventDefault();
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch (_) {}
    panToMinimapPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    panToMinimapPoint(e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  const getNodeColor = (node) => {
    if (node.type === 'terminal') {
      if (node.agentType === 'claude') return '#D97706';
      if (node.agentType === 'codex') return '#10B981';
      if (node.agentType === 'gemini') return '#3B82F6';
      if (node.agentType === 'opencode') return '#8B5CF6';
      if (node.agentType === 'kimi') return '#06B6D4';
      if (node.agentType === 'deepcode') return '#EC4899';
      return node.data?.color || '#FF8038';
    }
    if (node.type === 'group') return node.data?.color || '#A855F7';
    if (node.type === 'webtile') return '#3B82F6';
    if (node.type === 'kanban') return '#F59E0B';
    if (node.type === 'notes') return '#8B5CF6';
    if (node.type === 'git') return '#EF4444';
    if (node.type === 'code') return '#06B6D4';
    if (node.type === 'diagram') return '#EC4899';
    return '#CDC2B3';
  };

  return (
    <div 
      ref={mapRef}
      className="sym-glass rounded-2xl overflow-hidden border border-[rgba(241,233,221,0.14)] shadow-2xl backdrop-blur-xl bg-[#0D0B09]/95 select-none transition-all duration-200"
      style={{ width: MAP_WIDTH }}
    >
      {/* Header bar */}
      <div className="h-7 px-2.5 bg-[#14110E] border-b border-[rgba(241,233,221,0.08)] flex items-center justify-between text-[10px] font-mono">
        <div className="flex items-center gap-1.5 text-[#8B7E72]">
          <Scan size={11} className="text-[#FF8038]" />
          <span className="font-semibold tracking-wider uppercase text-[9px] text-[#CDC2B3]">Radar</span>
          <span className="text-[#FF8038] font-bold ml-1">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-1 minimap-controls">
          {onFitAll && (
            <button
              onClick={onFitAll}
              className="p-1 rounded text-[#8B7E72] hover:text-[#F1E9DD] hover:bg-[#1F1A16] transition"
              title="Fit all nodes"
            >
              <Maximize size={10} />
            </button>
          )}
          {onResetZoom && (
            <button
              onClick={onResetZoom}
              className="p-1 rounded text-[#8B7E72] hover:text-[#F1E9DD] hover:bg-[#1F1A16] transition"
              title="Reset 100%"
            >
              <RotateCcw size={10} />
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded text-[#8B7E72] hover:text-[#F1E9DD] hover:bg-[#1F1A16] transition"
            title={isCollapsed ? 'Expand Minimap' : 'Collapse Minimap'}
          >
            {isCollapsed ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* Minimap Content Area */}
      {!isCollapsed && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`relative overflow-hidden cursor-crosshair ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{ width: innerWidth, height: innerHeight }}
          title="Drag or click to navigate canvas"
        >
          {/* Subtle Radar Background Grid */}
          <div className="absolute inset-0 bg-[#0A0908] opacity-95">
            <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="minimap-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#F1E9DD" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#minimap-grid)" />
            </svg>
          </div>

          {/* Render Nodes */}
          {nodes.map((node) => {
            const nx = toMapX(node.x);
            const ny = toMapY(node.y);
            const nw = Math.max(5, (node.width || 400) * scale);
            const nh = Math.max(4, (node.height || 300) * scale);
            const color = getNodeColor(node);

            return (
              <div
                key={node.id}
                className="absolute rounded-[2px] transition-transform hover:scale-110 pointer-events-none"
                style={{
                  left: nx,
                  top: ny,
                  width: nw,
                  height: nh,
                  backgroundColor: color,
                  boxShadow: `0 0 4px ${color}55`,
                  border: `0.5px solid ${color}dd`,
                  opacity: 0.85
                }}
                title={node.title || node.type}
              >
                {/* Tiny node header bar for clarity */}
                <div 
                  className="w-full h-1 bg-white/20 rounded-t-[1px]" 
                />
              </div>
            );
          })}

          {/* Dynamic Reactive Camera Viewport Frustum */}
          <div
            className="absolute rounded-sm transition-shadow pointer-events-none"
            style={{
              left: cameraX,
              top: cameraY,
              width: cameraW,
              height: cameraH,
              border: '1.5px solid rgba(255, 128, 56, 0.95)',
              backgroundColor: 'rgba(255, 128, 56, 0.12)',
              boxShadow: '0 0 8px rgba(255, 128, 56, 0.4), inset 0 0 4px rgba(255, 128, 56, 0.2)'
            }}
          >
            {/* Viewport Corner Brackets for High-Tech HUD Look */}
            <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-white" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 border-t border-r border-white" />
            <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 border-b border-l border-white" />
            <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-b border-r border-white" />
          </div>

          {/* Center Crosshair Marker */}
          <div 
            className="absolute w-1 h-1 bg-[#FF8038] rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 opacity-70"
            style={{
              left: cameraX + cameraW / 2,
              top: cameraY + cameraH / 2
            }}
          />
        </div>
      )}
    </div>
  );
}
