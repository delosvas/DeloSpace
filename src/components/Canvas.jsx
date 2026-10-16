import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';
import TerminalNode from './nodes/TerminalNode';
import WebTileNode from './nodes/WebTileNode';
import KanbanNode from './nodes/KanbanNode';
import NotesNode from './nodes/NotesNode';
import GitNode from './nodes/GitNode';
import CodeNode from './nodes/CodeNode';
import DiagramNode from './nodes/DiagramNode';
import DocumentNode from './nodes/DocumentNode';
import MarkdownVaultNode from './nodes/MarkdownVaultNode';
import InkLayer from './InkLayer';
import Minimap from './Minimap';

export default function Canvas({
  workspace,
  onCloseNode,
  onUpdateNode,
  onUpdateCanvas,
  onUpdateStrokes,
  onHandoff,
  focusedNodeId,
  onClearFocus,
  isDrawingActive = false,
  onCloseDrawing
}) {
  const containerRef = useRef(null);
  const [panX, setPanX] = useState(workspace.canvas?.panX || 0);
  const [panY, setPanY] = useState(workspace.canvas?.panY || 0);
  const [zoom, setZoom] = useState(workspace.canvas?.zoom || 0.85);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [resizingNodeId, setResizingNodeId] = useState(null);
  const [resizeStart, setResizeStart] = useState({ w: 0, h: 0, mouseX: 0, mouseY: 0 });

  const [maximizedNodeId, setMaximizedNodeId] = useState(null);

  // Sync canvas pan/zoom back to workspace canvas property ONLY (never touches nodes!)
  useEffect(() => {
    onUpdateCanvas?.({ panX, panY, zoom });
  }, [panX, panY, zoom]);

  // Handle focus jumping from Mission Map
  useEffect(() => {
    if (focusedNodeId) {
      const node = workspace.nodes.find(n => n.id === focusedNodeId);
      if (node) {
        const targetX = -node.x + window.innerWidth / (2 * zoom) - node.width / 2;
        const targetY = -node.y + window.innerHeight / (2 * zoom) - node.height / 2;
        setPanX(targetX);
        setPanY(targetY);
        onClearFocus();
      }
    }
  }, [focusedNodeId]);

  // Wheel zoom anchored at cursor
  const handleWheel = (e) => {
    if (maximizedNodeId || isDrawingActive) return;
    e.preventDefault();

    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(2.5, Math.max(0.2, zoom * zoomFactor));

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Anchor calculation
    const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom);

    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  };

  // Background Pan Start
  const handleMouseDown = (e) => {
    if (maximizedNodeId || isDrawingActive) return;
    if (e.target === containerRef.current || e.target.classList.contains('canvas-bg')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleMouseMove = (e) => {
    if (isDrawingActive) return;

    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
    } else if (draggingNodeId) {
      const newX = (e.clientX - panX) / zoom - dragOffset.x;
      const newY = (e.clientY - panY) / zoom - dragOffset.y;

      onUpdateNode?.({
        id: draggingNodeId,
        x: Math.round(newX),
        y: Math.round(newY)
      });
    } else if (resizingNodeId) {
      const deltaX = (e.clientX - resizeStart.mouseX) / zoom;
      const deltaY = (e.clientY - resizeStart.mouseY) / zoom;

      const newW = Math.max(380, resizeStart.w + deltaX);
      const newH = Math.max(260, resizeStart.h + deltaY);
      onUpdateNode?.({
        id: resizingNodeId,
        width: Math.round(newW),
        height: Math.round(newH)
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setResizingNodeId(null);
  };

  // Node Drag Handler (from header)
  const handleNodeDragStart = (nodeId, e) => {
    if (maximizedNodeId || isDrawingActive) return;
    e.stopPropagation();
    const node = workspace.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: (e.clientX - panX) / zoom - node.x,
      y: (e.clientY - panY) / zoom - node.y
    });
  };

  // Node Resize Handler
  const handleNodeResizeStart = (nodeId, e) => {
    if (maximizedNodeId || isDrawingActive) return;
    e.stopPropagation();
    const node = workspace.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setResizingNodeId(nodeId);
    setResizeStart({
      w: node.width,
      h: node.height,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
  };

  // Shield child node updates: child components (Terminal, Notes, Kanban, etc.)
  // only update their internal data/status and MUST NEVER overwrite their canvas coordinates!
  const handleChildNodeUpdate = (childUpdate) => {
    if (!childUpdate || !childUpdate.id) return;
    const { x, y, width, height, ...safeUpdate } = childUpdate;
    onUpdateNode?.(safeUpdate);
  };

  const handleCloseNode = (nodeId) => {
    onCloseNode?.(nodeId);
  };

  const handleFitAll = () => {
    if (workspace.nodes.length === 0) return;
    const minX = Math.min(...workspace.nodes.map(n => n.x));
    const maxX = Math.max(...workspace.nodes.map(n => n.x + n.width));
    const minY = Math.min(...workspace.nodes.map(n => n.y));
    const maxY = Math.max(...workspace.nodes.map(n => n.y + n.height));

    const contentW = maxX - minX + 160;
    const contentH = maxY - minY + 160;

    const fitZoom = Math.min(
      (window.innerWidth - 100) / contentW,
      (window.innerHeight - 140) / contentH,
      1.1
    );

    const safeZoom = Math.max(0.3, fitZoom);
    setZoom(safeZoom);
    setPanX((window.innerWidth - contentW * safeZoom) / 2 - minX * safeZoom + 80 * safeZoom);
    setPanY((window.innerHeight - contentH * safeZoom) / 2 - minY * safeZoom + 80 * safeZoom);
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPanX(40);
    setPanY(40);
  };

  const renderNodeComponent = (node, isMax) => {
    switch (node.type) {
      case 'terminal':
        return (
          <TerminalNode 
            node={node}
            onUpdate={handleChildNodeUpdate}
            onClose={handleCloseNode}
            onHandoff={onHandoff}
            isMaximized={isMax}
            onToggleMaximize={() => setMaximizedNodeId(isMax ? null : node.id)}
          />
        );
      case 'webtile':
        return (
          <WebTileNode 
            node={node}
            onUpdate={handleChildNodeUpdate}
            onClose={handleCloseNode}
            isMaximized={isMax}
            onToggleMaximize={() => setMaximizedNodeId(isMax ? null : node.id)}
          />
        );
      case 'kanban':
        return (
          <KanbanNode 
            node={node}
            onUpdate={handleChildNodeUpdate}
            onClose={handleCloseNode}
            isMaximized={isMax}
            onToggleMaximize={() => setMaximizedNodeId(isMax ? null : node.id)}
          />
        );
      case 'notes':
        return (
          <NotesNode 
            node={node}
            onUpdate={handleChildNodeUpdate}
            onClose={handleCloseNode}
            isMaximized={isMax}
            onToggleMaximize={() => setMaximizedNodeId(isMax ? null : node.id)}
          />
        );
      case 'git':
        return (
          <GitNode 
            node={node}
            onClose={handleCloseNode}
            isMaximized={isMax}
            onToggleMaximize={() => setMaximizedNodeId(isMax ? null : node.id)}
          />
        );
      case 'code':
        return (
          <CodeNode 
            node={node}
            onUpdate={handleChildNodeUpdate}
            onClose={handleCloseNode}
            isMaximized={isMax}
            onToggleMaximize={() => setMaximizedNodeId(isMax ? null : node.id)}
          />
        );
      case 'diagram':
        return (
          <DiagramNode 
            node={node}
            onUpdate={handleChildNodeUpdate}
            onClose={handleCloseNode}
            isMaximized={isMax}
            onToggleMaximize={() => setMaximizedNodeId(isMax ? null : node.id)}
          />
        );
      case 'document':
        return (
          <DocumentNode 
            node={node}
            onUpdate={handleChildNodeUpdate}
            onClose={handleCloseNode}
            isMaximized={isMax}
            onToggleMaximize={() => setMaximizedNodeId(isMax ? null : node.id)}
          />
        );
      case 'vault':
        return (
          <MarkdownVaultNode 
            node={node}
            onUpdate={handleChildNodeUpdate}
            onClose={handleCloseNode}
            isMaximized={isMax}
            onToggleMaximize={() => setMaximizedNodeId(isMax ? null : node.id)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-[calc(100vh-3.5rem)] overflow-hidden dot-grid select-none ${
        isDrawingActive ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Background click target */}
      <div className="absolute inset-0 canvas-bg pointer-events-auto" />

      {/* Freehand Canvas Markup & Drawing Layer */}
      <InkLayer 
        isActive={isDrawingActive}
        onClose={onCloseDrawing}
        strokes={workspace.strokes || []}
        onUpdateStrokes={(newStrokes) => {
          onUpdateStrokes?.(newStrokes);
        }}
        zoom={zoom}
        panX={panX}
        panY={panY}
      />

      {/* Infinite Canvas Space */}
      <div 
        className="absolute origin-top-left pointer-events-none"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`
        }}
      >
        {workspace.nodes.map(node => {
          const isMax = maximizedNodeId === node.id;
          if (isMax) return null; // rendered in fullscreen overlay below

          return (
            <div
              key={node.id}
              style={{
                transform: `translate(${node.x}px, ${node.y}px)`,
                width: `${node.width}px`,
                height: `${node.height}px`
              }}
              className="absolute pointer-events-auto group transition-shadow duration-200"
            >
              {/* Drag handle header overlay */}
              <div 
                onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                className="absolute top-0 left-0 right-28 h-8 cursor-grab active:cursor-grabbing z-20"
                title="Drag to reposition node"
              />

              {/* Node Content */}
              {renderNodeComponent(node, false)}

              {/* Resize Handle on bottom right */}
              <div 
                onMouseDown={(e) => handleNodeResizeStart(node.id, e)}
                className="absolute -bottom-1 -right-1 w-4 h-4 cursor-se-resize z-20 flex items-center justify-center opacity-40 group-hover:opacity-100 transition"
                title="Drag to resize"
              >
                <div className="w-2 h-2 border-r-2 border-b-2 border-[#FF8038]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Maximized Node Overlay */}
      {maximizedNodeId && (() => {
        const node = workspace.nodes.find(n => n.id === maximizedNodeId);
        if (!node) return null;
        return (
          <div className="absolute inset-4 z-40 animate-in fade-in zoom-in-95 duration-200">
            {renderNodeComponent(node, true)}
          </div>
        );
      })()}

      {/* Bottom Floating Canvas Controls */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2">
        <div className="sym-glass rounded-xl p-1 flex items-center gap-1 shadow-lg border border-[rgba(241,233,221,0.1)]">
          <button
            onClick={() => setZoom(prev => Math.max(0.2, prev * 0.9))}
            className="p-1.5 rounded-lg hover:bg-[#1F1A16] text-[#CDC2B3] hover:text-[#F1E9DD] transition"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 text-[12px] font-mono font-medium text-[#F1E9DD] hover:bg-[#1F1A16] rounded-md transition"
            title="Reset Zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={() => setZoom(prev => Math.min(2.5, prev * 1.1))}
            className="p-1.5 rounded-lg hover:bg-[#1F1A16] text-[#CDC2B3] hover:text-[#F1E9DD] transition"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>

          <div className="w-px h-4 bg-[rgba(241,233,221,0.1)] mx-0.5" />

          <button
            onClick={handleFitAll}
            className="p-1.5 rounded-lg hover:bg-[#1F1A16] text-[#CDC2B3] hover:text-[#F1E9DD] transition"
            title="Fit all nodes into screen"
          >
            <Maximize size={15} />
          </button>
        </div>
      </div>

      {/* Bottom-Right Interactive Minimap */}
      <div className="absolute bottom-5 right-5 z-20">
        <Minimap 
          nodes={workspace.nodes}
          canvasState={{ panX, panY, zoom }}
          onNavigate={({ panX: newX, panY: newY }) => {
            setPanX(newX);
            setPanY(newY);
          }}
          onResetZoom={handleResetZoom}
          onFitAll={handleFitAll}
          onZoomIn={() => setZoom(prev => Math.min(2.5, prev * 1.1))}
          onZoomOut={() => setZoom(prev => Math.max(0.2, prev * 0.9))}
        />
      </div>
    </div>
  );
}
