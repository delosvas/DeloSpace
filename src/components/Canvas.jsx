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
import GroupNode from './nodes/GroupNode';
import ContextMenu from './common/ContextMenu';
import StickyNote from './common/StickyNote';
import InkLayer from './InkLayer';
import Minimap from './Minimap';

export const SUBSPACE_LAYOUT = {
  headerHeight: 44,
  padding: 10,
  gap: 8,
  minWidth: 520,
  minHeight: 380
};

export function calculateSlotRect(group, slot) {
  const { headerHeight, padding, gap } = SUBSPACE_LAYOUT;
  const usableX = group.x + padding;
  const usableY = group.y + headerHeight + padding;
  const usableW = Math.max(260, group.width - padding * 2);
  const usableH = Math.max(200, group.height - headerHeight - padding * 2);

  const halfW = Math.max(120, Math.round((usableW - gap) / 2));
  const halfH = Math.max(90, Math.round((usableH - gap) / 2));

  switch (slot) {
    case 'left-half':
      return {
        x: usableX,
        y: usableY,
        width: halfW,
        height: usableH,
        label: 'Left Half (1/2)'
      };
    case 'right-half':
      return {
        x: usableX + halfW + gap,
        y: usableY,
        width: halfW,
        height: usableH,
        label: 'Right Half (1/2)'
      };
    case 'top-left-quarter':
      return {
        x: usableX,
        y: usableY,
        width: halfW,
        height: halfH,
        label: 'Top-Left (1/4)'
      };
    case 'top-right-quarter':
      return {
        x: usableX + halfW + gap,
        y: usableY,
        width: halfW,
        height: halfH,
        label: 'Top-Right (1/4)'
      };
    case 'bottom-left-quarter':
      return {
        x: usableX,
        y: usableY + halfH + gap,
        width: halfW,
        height: halfH,
        label: 'Bottom-Left (1/4)'
      };
    case 'bottom-right-quarter':
      return {
        x: usableX + halfW + gap,
        y: usableY + halfH + gap,
        width: halfW,
        height: halfH,
        label: 'Bottom-Right (1/4)'
      };
    case 'full':
    default:
      return {
        x: usableX,
        y: usableY,
        width: usableW,
        height: usableH,
        label: 'Full Screen'
      };
  }
}

export function getSubspaceSnapSlot(group, cursorX, cursorY) {
  if (
    cursorX < group.x ||
    cursorX > group.x + group.width ||
    cursorY < group.y ||
    cursorY > group.y + group.height
  ) {
    return null;
  }

  const normX = (cursorX - group.x) / group.width;
  const normY = (cursorY - group.y) / group.height;

  // Top edge middle zone (20% to 80% horizontal, top 22%) -> Full screen
  if (normY < 0.22 && normX >= 0.2 && normX <= 0.8) {
    return 'full';
  }

  if (normX < 0.5) {
    if (normY < 0.35) return 'top-left-quarter';
    if (normY > 0.65) return 'bottom-left-quarter';
    return 'left-half';
  } else {
    if (normY < 0.35) return 'top-right-quarter';
    if (normY > 0.65) return 'bottom-right-quarter';
    return 'right-half';
  }
}

export default function Canvas({
  workspace,
  onCloseNode,
  onUpdateNode,
  onUpdateNodesBatch,
  onUpdateCanvas,
  onUpdateStrokes,
  onHandoff,
  focusedNodeId,
  onClearFocus,
  isDrawingActive = false,
  onCloseDrawing,
  onAddSubspace,
  onAddNode,
  onOpenQuotaAlarm
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

  // Live ghost snap preview for Fitted Subspaces
  const [snapPreview, setSnapPreview] = useState(null);
  const snapPreviewRef = useRef(null);
  useEffect(() => {
    snapPreviewRef.current = snapPreview;
  }, [snapPreview]);

  // Universal Context Menu state
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    targetType: null,
    targetNodeId: null,
    targetStickyId: null,
    relativeCoords: null,
    isMaximized: false
  });

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

    // If scrolling over any canvas node, do NOT zoom the canvas unless the user is
    // performing a trackpad pinch-to-zoom gesture (ctrlKey or metaKey).
    // This allows node contents (markdown notes, code editor, kanban cards, terminal, docs)
    // to scroll natively without hijacking the view.
    const isOverNode = !!e.target.closest('.canvas-node');
    if (isOverNode && !e.ctrlKey && !e.metaKey) {
      return;
    }

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

    if (e.buttons === 0) {
      handleMouseUp();
      return;
    }

    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
    } else if (draggingNodeId) {
      const newX = Math.round((e.clientX - panX) / zoom - dragOffset.x);
      const newY = Math.round((e.clientY - panY) / zoom - dragOffset.y);
      const cursorX = (e.clientX - panX) / zoom;
      const cursorY = (e.clientY - panY) / zoom;

      const targetNode = workspace.nodes.find(n => n.id === draggingNodeId);
      if (targetNode?.type === 'group') {
        const deltaX = newX - targetNode.x;
        const deltaY = newY - targetNode.y;

        const memberNodes = workspace.nodes.filter(n => 
          n.id !== targetNode.id && (n.groupId === targetNode.id || (targetNode.data?.memberNodeIds || []).includes(n.id))
        );

        if (memberNodes.length > 0) {
          const updates = [
            { id: targetNode.id, x: newX, y: newY },
            ...memberNodes.map(m => ({
              id: m.id,
              x: m.x + deltaX,
              y: m.y + deltaY
            }))
          ];
          if (onUpdateNodesBatch) {
            onUpdateNodesBatch(updates);
          } else {
            updates.forEach(u => onUpdateNode?.(u));
          }
        } else {
          onUpdateNode?.({ id: draggingNodeId, x: newX, y: newY });
        }
        setSnapPreview(null);
      } else {
        onUpdateNode?.({
          id: draggingNodeId,
          x: newX,
          y: newY
        });

        // Detect snap preview over any fitted subspace
        const fittedGroups = workspace.nodes.filter(n => 
          n.type === 'group' && n.data?.groupType === 'fitted' && n.id !== draggingNodeId
        );

        let activeSnap = null;
        for (const fg of fittedGroups) {
          const slot = getSubspaceSnapSlot(fg, cursorX, cursorY);
          if (slot) {
            const rect = calculateSlotRect(fg, slot);
            activeSnap = {
              groupId: fg.id,
              slot,
              rect,
              color: fg.data?.color || '#A855F7'
            };
            break;
          }
        }
        setSnapPreview(activeSnap);
      }
    } else if (resizingNodeId) {
      const deltaX = (e.clientX - resizeStart.mouseX) / zoom;
      const deltaY = (e.clientY - resizeStart.mouseY) / zoom;

      const targetNode = workspace.nodes.find(n => n.id === resizingNodeId);
      const isGroup = targetNode?.type === 'group';
      const minW = isGroup ? SUBSPACE_LAYOUT.minWidth : 380;
      const minH = isGroup ? SUBSPACE_LAYOUT.minHeight : 260;

      const newW = Math.max(minW, resizeStart.w + deltaX);
      const newH = Math.max(minH, resizeStart.h + deltaY);

      if (isGroup && targetNode.data?.groupType === 'fitted') {
        const updatedGroup = {
          ...targetNode,
          width: Math.round(newW),
          height: Math.round(newH)
        };

        const memberNodes = workspace.nodes.filter(n => n.id !== targetNode.id && n.groupId === targetNode.id);
        const updates = [{
          id: resizingNodeId,
          width: Math.round(newW),
          height: Math.round(newH)
        }];

        memberNodes.forEach(m => {
          if (m.snapSlot) {
            const slotRect = calculateSlotRect(updatedGroup, m.snapSlot);
            updates.push({
              id: m.id,
              x: slotRect.x,
              y: slotRect.y,
              width: slotRect.width,
              height: slotRect.height
            });
          }
        });

        if (onUpdateNodesBatch) {
          onUpdateNodesBatch(updates);
        } else {
          updates.forEach(u => onUpdateNode?.(u));
        }
      } else {
        onUpdateNode?.({
          id: resizingNodeId,
          width: Math.round(newW),
          height: Math.round(newH)
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (draggingNodeId) {
      const draggedNode = workspace.nodes.find(n => n.id === draggingNodeId);
      const activeSnap = snapPreviewRef.current;

      if (draggedNode && draggedNode.type !== 'group') {
        if (activeSnap) {
          // Snapped into fitted subspace slot!
          onUpdateNode?.({
            id: draggedNode.id,
            x: activeSnap.rect.x,
            y: activeSnap.rect.y,
            width: activeSnap.rect.width,
            height: activeSnap.rect.height,
            groupId: activeSnap.groupId,
            snapSlot: activeSnap.slot
          });
        } else {
          const centerX = draggedNode.x + draggedNode.width / 2;
          const centerY = draggedNode.y + draggedNode.height / 2;

          const groupNodes = workspace.nodes.filter(n => n.type === 'group' && n.id !== draggedNode.id);
          const targetGroup = groupNodes.find(g => 
            centerX >= g.x && centerX <= g.x + g.width &&
            centerY >= g.y && centerY <= g.y + g.height
          );

          if (targetGroup) {
            if (targetGroup.data?.groupType === 'free') {
              if (draggedNode.groupId !== targetGroup.id) {
                onUpdateNode?.({
                  id: draggedNode.id,
                  groupId: targetGroup.id,
                  snapSlot: null
                });
              }
            }
          } else if (draggedNode.groupId) {
            // Dragged outside all groups -> Undock!
            onUpdateNode?.({
              id: draggedNode.id,
              groupId: null,
              snapSlot: null
            });
          }
        }
      }
    }

    setSnapPreview(null);
    setIsPanning(false);
    setDraggingNodeId(null);
    setResizingNodeId(null);
  };

  // Global window listeners so mouse release is NEVER missed even outside the window or over iframes
  useEffect(() => {
    if (!isPanning && !draggingNodeId && !resizingNodeId) return;

    const handleWindowMouseMove = (e) => {
      if (e.buttons === 0) {
        handleMouseUp();
        return;
      }
      handleMouseMove(e);
    };

    const handleWindowMouseUp = () => {
      handleMouseUp();
    };

    const handleWindowBlur = () => {
      handleMouseUp();
    };

    window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isPanning, draggingNodeId, resizingNodeId, panStart, dragOffset, resizeStart, zoom, panX, panY, onUpdateNode]);

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

  // Sticky Notes CRUD
  const handleAddStickyNote = (nodeId, relativeCoords) => {
    const node = workspace.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const newSticky = {
      id: `sticky-${Date.now()}`,
      text: '',
      color: 'yellow',
      relX: Math.max(10, Math.min(node.width - 170, relativeCoords?.relX || 30)),
      relY: Math.max(10, Math.min(node.height - 100, relativeCoords?.relY || 30)),
      isEditing: true
    };
    const stickyNotes = [...(node.stickyNotes || []), newSticky];
    onUpdateNode?.({ id: nodeId, stickyNotes });
  };

  const handleUpdateStickyText = (nodeId, stickyId, text) => {
    const node = workspace.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const stickyNotes = (node.stickyNotes || []).map(s => s.id === stickyId ? { ...s, text } : s);
    onUpdateNode?.({ id: nodeId, stickyNotes });
  };

  const handleChangeStickyColor = (nodeId, stickyId, color) => {
    const node = workspace.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const stickyNotes = (node.stickyNotes || []).map(s => s.id === stickyId ? { ...s, color } : s);
    onUpdateNode?.({ id: nodeId, stickyNotes });
  };

  const handleDeleteSticky = (nodeId, stickyId) => {
    const node = workspace.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const stickyNotes = (node.stickyNotes || []).filter(s => s.id !== stickyId);
    onUpdateNode?.({ id: nodeId, stickyNotes });
  };

  const handleEditSticky = (nodeId, stickyId) => {
    const node = workspace.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const stickyNotes = (node.stickyNotes || []).map(s => s.id === stickyId ? { ...s, isEditing: true } : s);
    onUpdateNode?.({ id: nodeId, stickyNotes });
  };

  // Context Menu Event Handlers
  const handleNodeContextMenu = (nodeId, e) => {
    e.preventDefault();
    e.stopPropagation();
    const node = workspace.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const relX = Math.round((e.clientX - panX) / zoom - node.x);
    const relY = Math.round((e.clientY - panY) / zoom - node.y);

    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      targetType: 'node',
      targetNodeId: nodeId,
      relativeCoords: { relX, relY },
      isMaximized: maximizedNodeId === nodeId
    });
  };

  const handleStickyContextMenu = (e, nodeId, stickyId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      targetType: 'sticky',
      targetNodeId: nodeId,
      targetStickyId: stickyId
    });
  };

  const handleCanvasContextMenu = (e) => {
    if (e.target === containerRef.current || e.target.classList.contains('canvas-bg')) {
      e.preventDefault();
      setContextMenu({
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
        targetType: 'canvas'
      });
    }
  };

  const handleRefreshNode = (nodeId) => {
    onUpdateNode?.({
      id: nodeId,
      refreshTrigger: Date.now()
    });
  };

  const handleDuplicateNode = (nodeId) => {
    const node = workspace.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const { id, ...rest } = node;
    onAddNode?.(node.type, {
      ...rest,
      title: `${node.title} (Copy)`,
      x: node.x + 40,
      y: node.y + 40
    });
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
            zoom={isMax ? 1 : zoom}
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
      case 'group':
        return (
          <GroupNode 
            node={node}
            allNodes={workspace.nodes}
            onUpdate={handleChildNodeUpdate}
            onClose={handleCloseNode}
            zoom={isMax ? 1 : zoom}
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
      onContextMenu={handleCanvasContextMenu}
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
        {/* Fitted Subspace Live Ghost Snap Preview Overlay */}
        {snapPreview && (
          <div
            style={{
              transform: `translate(${snapPreview.rect.x}px, ${snapPreview.rect.y}px)`,
              width: `${snapPreview.rect.width}px`,
              height: `${snapPreview.rect.height}px`,
              borderColor: snapPreview.color || '#A855F7',
              backgroundColor: `${snapPreview.color || '#A855F7'}15`,
              boxShadow: `0 0 30px ${snapPreview.color || '#A855F7'}35`
            }}
            className="absolute rounded-2xl border-2 border-dashed pointer-events-none z-30 transition-all duration-75 flex items-center justify-center animate-in fade-in zoom-in-95 backdrop-blur-[2px]"
          >
            <div 
              style={{
                backgroundColor: '#0E0C0Aee',
                borderColor: `${snapPreview.color || '#A855F7'}70`,
                color: snapPreview.color || '#A855F7'
              }}
              className="px-3.5 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-2 text-xs font-semibold font-mono tracking-wide"
            >
              <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: snapPreview.color || '#A855F7' }} />
              <span>Snap: {snapPreview.rect.label}</span>
            </div>
          </div>
        )}

        {/* Render group nodes first so they appear below individual cards */}
        {[...workspace.nodes].sort((a, b) => {
          if (a.type === 'group' && b.type !== 'group') return -1;
          if (a.type !== 'group' && b.type === 'group') return 1;
          return 0;
        }).map(node => {
          const isMax = maximizedNodeId === node.id;
          if (isMax) return null; // rendered in fullscreen overlay below

          return (
            <div
              key={node.id}
              data-node-id={node.id}
              style={{
                transform: `translate(${node.x}px, ${node.y}px)`,
                width: `${node.width}px`,
                height: `${node.height}px`
              }}
              onContextMenu={(e) => handleNodeContextMenu(node.id, e)}
              className="canvas-node absolute pointer-events-auto group transition-shadow duration-200"
            >
              {/* Drag handle header overlay */}
              <div 
                onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                className="absolute top-0 left-0 right-28 h-8 cursor-grab active:cursor-grabbing z-20"
                title="Drag to reposition node"
              />

              {/* Node Content */}
              {renderNodeComponent(node, false)}

              {/* Attached Sticky Notes */}
              {node.stickyNotes?.map(note => (
                <StickyNote
                  key={note.id}
                  note={note}
                  nodeId={node.id}
                  zoom={zoom}
                  onUpdateText={handleUpdateStickyText}
                  onDelete={handleDeleteSticky}
                  onContextMenu={handleStickyContextMenu}
                />
              ))}

              {/* Resize Handle on bottom right (disabled if docked in Fitted Subspace) */}
              {(!node.groupId || !node.snapSlot) && (
                <div 
                  onMouseDown={(e) => handleNodeResizeStart(node.id, e)}
                  className="absolute -bottom-1 -right-1 w-4 h-4 cursor-se-resize z-20 flex items-center justify-center opacity-40 group-hover:opacity-100 transition"
                  title="Drag to resize"
                >
                  <div className="w-2 h-2 border-r-2 border-b-2 border-[#FF8038]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Maximized Node Overlay */}
      {maximizedNodeId && (() => {
        const node = workspace.nodes.find(n => n.id === maximizedNodeId);
        if (!node) return null;
        return (
          <div className="canvas-node absolute inset-4 z-40 animate-in fade-in zoom-in-95 duration-200">
            {renderNodeComponent(node, true)}
          </div>
        );
      })()}

      {/* Universal Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onRefreshNode={handleRefreshNode}
        onAddStickyNote={handleAddStickyNote}
        onDuplicateNode={handleDuplicateNode}
        onToggleMaximize={(id) => setMaximizedNodeId(maximizedNodeId === id ? null : id)}
        onCloseNode={handleCloseNode}
        onAddSubspace={onAddSubspace}
        onAddTerminal={(agentType, meta) => onAddNode?.('terminal', { agentType, ...meta })}
        onAddNotes={() => onAddNode?.('notes', { title: 'Quick Notes' })}
        onAddKanban={() => onAddNode?.('kanban', { title: 'Board' })}
        onOpenQuotaAlarm={onOpenQuotaAlarm}
        onResetZoom={handleResetZoom}
        onFitAll={handleFitAll}
        onEditSticky={handleEditSticky}
        onChangeStickyColor={handleChangeStickyColor}
        onDeleteSticky={handleDeleteSticky}
      />

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

      {/* Fullscreen transparent shield during any drag/pan action so iframes and child elements never steal mouseup events */}
      {(isPanning || draggingNodeId || resizingNodeId) && (
        <div 
          className="fixed inset-0 z-50 cursor-grabbing select-none"
          style={{ pointerEvents: 'auto' }}
          onMouseUp={handleMouseUp}
        />
      )}
    </div>
  );
}
