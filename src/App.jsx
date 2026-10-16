import React, { useEffect, useState, useRef } from 'react';
import Navbar from './components/Navbar';
import Canvas from './components/Canvas';
import MissionMapDrawer from './components/MissionMapDrawer';
import MemoryDrawer from './components/MemoryDrawer';
import UsageDrawer from './components/UsageDrawer';
import ComposerModal from './components/ComposerModal';
import HandoffModal from './components/HandoffModal';
import LoopModal from './components/LoopModal';
import CodeStudioModal from './components/CodeStudioModal';
import FolderSelectModal from './components/FolderSelectModal';
import { fetchWorkspaces, saveWorkspaces, fetchAgents, broadcastInput } from './services/api';

export default function App() {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [installedAgents, setInstalledAgents] = useState([]);

  // Modals & Drawers
  const [showComposer, setShowComposer] = useState(false);
  const [showMissionMap, setShowMissionMap] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [showLoops, setShowLoops] = useState(false);
  const [showCodeStudio, setShowCodeStudio] = useState(false);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [isDrawingActive, setIsDrawingActive] = useState(false);

  const [handoffSourceNode, setHandoffSourceNode] = useState(null);
  const [focusedNodeId, setFocusedNodeId] = useState(null);

  // Autonomous Loops Management
  const [activeLoops, setActiveLoops] = useState([]);
  const loopTimersRef = useRef({});

  const saveTimerRef = useRef(null);

  // Initial load
  useEffect(() => {
    fetchWorkspaces().then(wsList => {
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        setActiveWorkspaceId(wsList[0].id);
      }
    });

    fetchAgents().then(agents => {
      setInstalledAgents(agents);
    });
  }, []);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  // Auto-save debouncer
  const handleUpdateActiveWorkspace = (updatedWs) => {
    const updatedList = workspaces.map(w => w.id === updatedWs.id ? updatedWs : w);
    setWorkspaces(updatedList);

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveWorkspaces(updatedList);
    }, 1500);
  };

  const handleAddWorkspace = () => {
    const defaultCwd = activeWorkspace?.cwd || '';
    const newWs = {
      id: `ws-${Date.now()}`,
      name: `Board ${workspaces.length + 1}`,
      cwd: defaultCwd,
      nodes: [
        {
          id: `term-${Date.now()}-1`,
          type: 'terminal',
          title: 'Claude Code',
          agentType: 'claude',
          command: 'claude',
          cwd: defaultCwd,
          profile: 'default',
          x: 60,
          y: 80,
          width: 680,
          height: 520,
          status: 'idle'
        },
        {
          id: `term-${Date.now()}-2`,
          type: 'terminal',
          title: 'OpenAI Codex',
          agentType: 'codex',
          command: 'codex',
          cwd: defaultCwd,
          profile: 'default',
          x: 780,
          y: 80,
          width: 680,
          height: 520,
          status: 'idle'
        }
      ],
      canvas: { panX: 0, panY: 0, zoom: 0.85 },
      strokes: []
    };

    const updated = [...workspaces, newWs];
    setWorkspaces(updated);
    setActiveWorkspaceId(newWs.id);
    saveWorkspaces(updated);
  };

  const handleAddNode = (type, meta = {}) => {
    if (!activeWorkspace) return;

    // Find a good spot offset from center
    const x = 100 + (activeWorkspace.nodes.length % 5) * 60;
    const y = 100 + (activeWorkspace.nodes.length % 4) * 50;

    let defaultWidth = 680;
    let defaultHeight = 500;

    if (type === 'webtile') {
      defaultWidth = 600;
      defaultHeight = 650;
    } else if (type === 'kanban') {
      defaultWidth = 640;
      defaultHeight = 440;
    } else if (type === 'notes') {
      defaultWidth = 500;
      defaultHeight = 400;
    } else if (type === 'git') {
      defaultWidth = 440;
      defaultHeight = 380;
    } else if (type === 'code') {
      defaultWidth = 650;
      defaultHeight = 520;
    } else if (type === 'diagram') {
      defaultWidth = 650;
      defaultHeight = 480;
    } else if (type === 'document') {
      defaultWidth = 620;
      defaultHeight = 580;
    } else if (type === 'vault') {
      defaultWidth = 760;
      defaultHeight = 520;
    }

    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      title: meta.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
      agentType: meta.agentType || 'zsh',
      command: meta.command !== undefined ? meta.command : '',
      cwd: activeWorkspace?.cwd || '',
      profile: 'default',
      x,
      y,
      width: defaultWidth,
      height: defaultHeight,
      status: 'idle',
      data: meta.data || {}
    };

    handleUpdateActiveWorkspace({
      ...activeWorkspace,
      nodes: [...activeWorkspace.nodes, newNode]
    });
  };

  const handleApplyLayoutPreset = (preset) => {
    if (!activeWorkspace || activeWorkspace.nodes.length === 0) return;

    const nodes = [...activeWorkspace.nodes];
    const cardW = 680;
    const cardH = 500;
    const gap = 30;

    if (preset === 'side-by-side') {
      nodes.forEach((n, idx) => {
        n.x = 60 + idx * (cardW + gap);
        n.y = 80;
        n.width = cardW;
        n.height = cardH;
      });
    } else if (preset === 'grid-2x2') {
      nodes.forEach((n, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        n.x = 60 + col * (cardW + gap);
        n.y = 80 + row * (cardH + gap);
        n.width = cardW;
        n.height = cardH;
      });
    } else if (preset === 'pipeline') {
      nodes.forEach((n, idx) => {
        n.x = 60 + idx * (cardW + gap);
        n.y = 100;
        n.width = cardW;
        n.height = cardH;
      });
    } else if (preset === 'fleet') {
      const perRow = 3;
      nodes.forEach((n, idx) => {
        const col = idx % perRow;
        const row = Math.floor(idx / perRow);
        n.x = 60 + col * (cardW + gap);
        n.y = 80 + row * (cardH + gap);
        n.width = cardW;
        n.height = cardH;
      });
    }

    handleUpdateActiveWorkspace({
      ...activeWorkspace,
      nodes,
      canvas: { panX: 40, panY: 40, zoom: 0.8 }
    });
  };

  // Autonomous Loops Execution Engine
  const handleStartLoop = (newLoop) => {
    setActiveLoops(prev => [...prev, newLoop]);

    // Send first iteration
    broadcastInput([newLoop.terminalId], `${newLoop.directive}\n`);

    const runLoopCycle = (loopId) => {
      setActiveLoops(prev => {
        const loop = prev.find(l => l.id === loopId);
        if (!loop || loop.status !== 'running') return prev;

        const nextIter = loop.currentIteration + 1;
        if (nextIter >= loop.maxIterations) {
          return prev.map(l => l.id === loopId ? { ...l, status: 'completed' } : l);
        }

        // Dispatch next command
        broadcastInput([loop.terminalId], `${loop.directive}\n`);
        return prev.map(l => l.id === loopId ? { ...l, currentIteration: nextIter } : l);
      });
    };

    const intervalTime = (newLoop.intervalSec || 30) * 1000;
    const timerId = setInterval(() => {
      runLoopCycle(newLoop.id);
    }, intervalTime);

    loopTimersRef.current[newLoop.id] = timerId;
  };

  const handleStopLoop = (loopId) => {
    if (loopTimersRef.current[loopId]) {
      clearInterval(loopTimersRef.current[loopId]);
      delete loopTimersRef.current[loopId];
    }
    setActiveLoops(prev => prev.filter(l => l.id !== loopId));
  };

  const handleSelectWorkspaceCwd = (newCwd, switchTerminals = true) => {
    if (!activeWorkspace) return;

    // Update workspace cwd and node cwd values
    const updatedNodes = activeWorkspace.nodes.map(node => {
      if (node.type === 'terminal' || node.type === 'git') {
        return { ...node, cwd: newCwd };
      }
      return node;
    });

    const updatedWorkspace = {
      ...activeWorkspace,
      cwd: newCwd,
      nodes: updatedNodes
    };

    handleUpdateActiveWorkspace(updatedWorkspace);

    // If requested, change directory in active terminal sessions
    if (switchTerminals) {
      const activeTerminalIds = terminals.map(t => t.id);
      if (activeTerminalIds.length > 0) {
        broadcastInput(activeTerminalIds, `cd "${newCwd}"\n`);
      }
    }
  };

  const terminals = activeWorkspace?.nodes.filter(n => n.type === 'terminal') || [];
  const needsInputCount = terminals.filter(t => t.status === 'needs_input').length;

  return (
    <div className="h-full w-full flex flex-col bg-[#0A0908] text-[#F1E9DD] overflow-hidden select-none">
      {/* Top Navbar */}
      <Navbar 
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={setActiveWorkspaceId}
        onAddWorkspace={handleAddWorkspace}
        onAddNode={handleAddNode}
        onApplyLayoutPreset={handleApplyLayoutPreset}
        onOpenComposer={() => setShowComposer(true)}
        onToggleMissionMap={() => setShowMissionMap(!showMissionMap)}
        onToggleMemory={() => setShowMemory(!showMemory)}
        onToggleUsage={() => setShowUsage(!showUsage)}
        onOpenLoops={() => setShowLoops(true)}
        onToggleDrawing={() => setIsDrawingActive(!isDrawingActive)}
        onOpenCodeStudio={() => setShowCodeStudio(true)}
        onOpenFolderSelector={() => setShowFolderSelector(true)}
        isDrawingActive={isDrawingActive}
        activeLoopsCount={activeLoops.length}
        needsInputCount={needsInputCount}
        installedAgents={installedAgents}
      />

      {/* Main Canvas Workspace */}
      <main className="flex-1 relative overflow-hidden">
        {activeWorkspace ? (
          <Canvas 
            workspace={activeWorkspace}
            onUpdateWorkspace={handleUpdateActiveWorkspace}
            onHandoff={(sourceNode) => setHandoffSourceNode(sourceNode)}
            focusedNodeId={focusedNodeId}
            onClearFocus={() => setFocusedNodeId(null)}
            isDrawingActive={isDrawingActive}
            onCloseDrawing={() => setIsDrawingActive(false)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[#8B7E72] font-mono text-sm">
            Loading workspaces…
          </div>
        )}

        {/* Ambient Mission Map Drawer */}
        <MissionMapDrawer
          isOpen={showMissionMap}
          onClose={() => setShowMissionMap(false)}
          terminals={terminals}
          onFocusNode={(nodeId) => {
            setFocusedNodeId(nodeId);
            setShowMissionMap(false);
          }}
        />

        {/* Project Memory Drawer */}
        <MemoryDrawer 
          isOpen={showMemory}
          onClose={() => setShowMemory(false)}
          terminals={terminals}
        />

        {/* Token & Usage Analytics Drawer */}
        <UsageDrawer
          isOpen={showUsage}
          onClose={() => setShowUsage(false)}
          terminals={terminals}
        />
      </main>

      {/* Handoff Modal */}
      <HandoffModal
        isOpen={!!handoffSourceNode}
        onClose={() => setHandoffSourceNode(null)}
        sourceNode={handoffSourceNode}
        availableTerminals={terminals}
      />

      {/* Fleet Composer Broadcast Modal */}
      <ComposerModal 
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        terminals={terminals}
      />

      {/* Autonomous Loops Modal */}
      <LoopModal 
        isOpen={showLoops}
        onClose={() => setShowLoops(false)}
        terminals={terminals}
        activeLoops={activeLoops}
        onStartLoop={handleStartLoop}
        onStopLoop={handleStopLoop}
      />

      {/* Code Studio Modal */}
      <CodeStudioModal
        isOpen={showCodeStudio}
        onClose={() => setShowCodeStudio(false)}
        rootPath={activeWorkspace?.cwd || ''}
        onPinFile={(filePath, content) => {
          handleAddNode('code', {
            title: filePath.split('/').pop(),
            data: { filePath, content }
          });
        }}
      />

      {/* Folder / Working Directory Selector Modal */}
      <FolderSelectModal
        isOpen={showFolderSelector}
        onClose={() => setShowFolderSelector(false)}
        currentCwd={activeWorkspace?.cwd || ''}
        onSelectCwd={handleSelectWorkspaceCwd}
      />
    </div>
  );
}
