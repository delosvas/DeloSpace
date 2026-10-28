import React, { useState, useEffect } from 'react';
import { 
  SquareTerminal, 
  Layers, 
  Plus, 
  Globe, 
  Columns3, 
  FileText, 
  GitBranch, 
  LayoutGrid, 
  Radar, 
  Bookmark, 
  ChevronDown,
  Sparkles,
  FolderOpen,
  FolderTree,
  GitGraph,
  BookOpen,
  Network,
  Infinity as InfinityIcon,
  PenTool,
  AlarmClock,
  SlidersHorizontal,
  MoreHorizontal,
  Check,
  X,
  Monitor,
  Move
} from 'lucide-react';
import { getStoredAgentTerminals } from './AgentConfigModal';

export const DEFAULT_TOOLBAR_VISIBLE_IDS = [
  'studios',
  'loops',
  'subspace',
  'quota-alarm',
  'memory'
];

export const TOOLBAR_ITEMS = [
  { id: 'studios', label: 'Studios', icon: FolderTree, color: '#06B6D4' },
  { id: 'presets', label: 'Presets', icon: LayoutGrid, color: '#CDC2B3' },
  { id: 'loops', label: 'Loops', icon: InfinityIcon, color: '#FF8038' },
  { id: 'markup', label: 'Markup', icon: PenTool, color: '#FF8038' },
  { id: 'composer', label: 'Composer', icon: Layers, color: '#FF8038' },
  { id: 'subspace', label: 'Subspace', icon: LayoutGrid, color: '#A855F7' },
  { id: 'quota-alarm', label: 'Quota Alarm', icon: AlarmClock, color: '#10B981' },
  { id: 'memory', label: 'Memory', icon: Bookmark, color: '#3B82F6' },
  { id: 'mission-map', label: 'Mission Map', icon: Radar, color: '#10B981' }
];

function getStoredToolbarConfig() {
  try {
    const raw = localStorage.getItem('delospace_topbar_toolbar_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse topbar toolbar config:', err);
  }
  return DEFAULT_TOOLBAR_VISIBLE_IDS;
}

function saveStoredToolbarConfig(visibleIds) {
  try {
    localStorage.setItem('delospace_topbar_toolbar_config', JSON.stringify(visibleIds));
  } catch (err) {
    console.error('Failed to save topbar toolbar config:', err);
  }
}

export default function Navbar({
  workspaces = [],
  activeWorkspaceId,
  onSelectWorkspace,
  onAddWorkspace,
  onAddNode,
  onApplyLayoutPreset,
  onOpenComposer,
  onToggleMissionMap,
  onToggleMemory,
  onAddSubspace,
  onOpenQuotaAlarm,
  onOpenAgentConfig,
  onOpenLoops,
  onToggleDrawing,
  onOpenCodeStudio,
  onOpenFolderSelector,
  onCloseWorkspace,
  isDrawingActive = false,
  activeLoopsCount = 0,
  needsInputCount = 0,
  installedAgents = [],
  agentTerminals = null
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showStudiosMenu, setShowStudiosMenu] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSubspaceMenu, setShowSubspaceMenu] = useState(false);

  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false);
  const [customMenuPos, setCustomMenuPos] = useState({ x: 0, y: 0 });
  const [visibleToolbarIds, setVisibleToolbarIds] = useState(getStoredToolbarConfig);

  const toggleToolbarItem = (id) => {
    setVisibleToolbarIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      saveStoredToolbarConfig(next);
      return next;
    });
  };

  const resetToolbarToDefaults = () => {
    setVisibleToolbarIds(DEFAULT_TOOLBAR_VISIBLE_IDS);
    saveStoredToolbarConfig(DEFAULT_TOOLBAR_VISIBLE_IDS);
  };

  const handleHeaderContextMenu = (e) => {
    e.preventDefault();
    setCustomMenuPos({
      x: Math.min(e.clientX, window.innerWidth - 250),
      y: Math.min(e.clientY, window.innerHeight - 380)
    });
    setShowCustomizeMenu(true);
    setShowMoreMenu(false);
    setShowSubspaceMenu(false);
    setShowAddMenu(false);
    setShowStudiosMenu(false);
    setShowPresetMenu(false);
  };

  useEffect(() => {
    const handleOutside = () => {
      setShowCustomizeMenu(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowCustomizeMenu(false);
        setShowMoreMenu(false);
        setShowSubspaceMenu(false);
        setShowAddMenu(false);
        setShowStudiosMenu(false);
        setShowPresetMenu(false);
      }
    };
    if (showCustomizeMenu) {
      window.addEventListener('click', handleOutside);
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('click', handleOutside);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showCustomizeMenu]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (!e.target.closest('.more-menu-container')) {
        setShowMoreMenu(false);
      }
      if (!e.target.closest('.subspace-menu-container')) {
        setShowSubspaceMenu(false);
      }
    };
    if (showMoreMenu || showSubspaceMenu) {
      window.addEventListener('click', handleOutside);
      return () => window.removeEventListener('click', handleOutside);
    }
  }, [showMoreMenu, showSubspaceMenu]);

  const moreFeatures = TOOLBAR_ITEMS.filter(item => !visibleToolbarIds.includes(item.id));
  const hasMoreAlert = (
    (!visibleToolbarIds.includes('mission-map') && needsInputCount > 0) ||
    (!visibleToolbarIds.includes('loops') && activeLoopsCount > 0) ||
    (!visibleToolbarIds.includes('markup') && isDrawingActive)
  );

  const activeWs = workspaces.find(w => w.id === activeWorkspaceId);

  return (
    <header 
      onContextMenu={handleHeaderContextMenu}
      className="h-14 bg-[rgba(15,12,10,0.92)] border-b border-[rgba(241,233,221,0.09)] pl-20 pr-4 flex items-center justify-between z-30 select-none relative backdrop-blur-md window-drag-region"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Workspaces */}
      <div className="flex items-center gap-3">

        {/* Workspaces Tabs */}
        <div className="flex items-center gap-1 bg-[#14110E] p-1 rounded-xl border border-[rgba(241,233,221,0.06)]">
          {workspaces.map(ws => (
            <div
              key={ws.id}
              className={`flex items-center rounded-lg text-[12px] font-medium transition group ${
                ws.id === activeWorkspaceId
                  ? 'bg-[#1F1A16] text-[#F1E9DD] shadow-sm border border-[rgba(241,233,221,0.12)]'
                  : 'text-[#8B7E72] hover:text-[#CDC2B3]'
              }`}
            >
              <button
                onClick={() => onSelectWorkspace(ws.id)}
                className="px-2.5 py-1"
              >
                {ws.name}
              </button>
              {workspaces.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseWorkspace?.(ws.id);
                  }}
                  className="pr-1.5 pl-0.5 py-1 text-[#8B7E72] hover:text-rose-400 opacity-60 hover:opacity-100 transition"
                  title={`Close ${ws.name}`}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={onAddWorkspace}
            className="p-1 rounded-lg text-[#8B7E72] hover:text-[#F1E9DD] hover:bg-[#1F1A16] transition ml-0.5"
            title="Create new workspace board"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Clickable Current Working Directory Pill */}
        <button
          onClick={onOpenFolderSelector}
          className="flex items-center gap-1.5 text-[11px] font-mono text-[#CDC2B3] hover:text-[#F1E9DD] px-2.5 py-1 rounded-lg bg-[#14110E] hover:bg-[#1F1A16] border border-[rgba(241,233,221,0.06)] hover:border-[#FF8038]/40 transition group cursor-pointer max-w-[280px] shadow-sm"
          title={`Click to change project folder across computer\nCurrent path: ${activeWs?.cwd || '(none)'}`}
        >
          <FolderOpen size={12} className="text-[#FF8038] flex-none group-hover:scale-110 transition-transform" />
          <span className="truncate font-medium">{activeWs?.cwd?.split('/').slice(-2).join('/') || 'Select Folder…'}</span>
          <ChevronDown size={10} className="text-[#8B7E72] flex-none group-hover:text-[#FF8038] transition ml-0.5" />
        </button>
      </div>

      {/* Center / Action Toolbar */}
      <div className="flex items-center gap-2">
        {/* + Add Node Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowAddMenu(!showAddMenu);
              setShowSubspaceMenu(false);
              setShowStudiosMenu(false);
              setShowPresetMenu(false);
              setShowMoreMenu(false);
            }}
            className="sym-btn-primary px-3 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add Node</span>
            <ChevronDown size={12} className={`transition ${showAddMenu ? 'rotate-180' : ''}`} />
          </button>

          {showAddMenu && (() => {
            const currentAgents = (agentTerminals || getStoredAgentTerminals()).filter(a => a.visible !== false);
            return (
              <div className="absolute top-full mt-1.5 left-0 w-64 sym-glass rounded-xl p-1.5 border border-[rgba(241,233,221,0.14)] shadow-2xl z-50 window-no-drag">
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8B7E72]">
                  <span>Agent Terminals (PTY)</span>
                  <button
                    onClick={() => { onOpenAgentConfig?.(); setShowAddMenu(false); }}
                    className="hover:text-[#FF8038] flex items-center gap-1 normal-case tracking-normal transition"
                    title="Edit dropdown visibility, order, and add custom agents"
                  >
                    <SlidersHorizontal size={11} />
                    <span>Edit</span>
                  </button>
                </div>

                {currentAgents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onAddNode('terminal', {
                        agentType: agent.id,
                        title: agent.name,
                        command: agent.command,
                        data: { color: agent.color }
                      });
                      setShowAddMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD]"
                  >
                    <span 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: agent.color || '#FF8038' }}
                    />
                    <span className="font-medium truncate">{agent.name}</span>
                    <span className="text-[10px] text-[#8B7E72] ml-auto truncate max-w-[80px]">{agent.provider}</span>
                  </button>
                ))}

                <button
                  onClick={() => { onOpenAgentConfig?.(); setShowAddMenu(false); }}
                  className="w-full mt-1 px-2.5 py-1 rounded-lg border border-dashed border-[rgba(241,233,221,0.1)] hover:border-[#FF8038]/40 hover:bg-[#1F1A16] flex items-center justify-center gap-1.5 text-[11px] text-[#8B7E72] hover:text-[#FF8038] transition"
                >
                  <Plus size={12} />
                  <span>Customize & Add Agents…</span>
                </button>

                <div className="my-1 border-t border-[rgba(241,233,221,0.06)]" />

                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8B7E72]">
                  Workspace Tiles
                </div>
                <button
                  onClick={() => { onAddSubspace?.('fitted'); setShowAddMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD]"
                >
                  <Monitor size={14} className="text-[#A855F7]" />
                  <span>Fitted Subspace (Virtual Screen)</span>
                </button>
                <button
                  onClick={() => { onAddSubspace?.('free'); setShowAddMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD]"
                >
                  <Move size={14} className="text-[#FF8038]" />
                  <span>Free Subspace (Freeform Group)</span>
                </button>
                <button
                  onClick={() => { onAddNode('webtile', { title: 'Local Preview' }); setShowAddMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD]"
                >
                  <Globe size={14} className="text-[#3B82F6]" />
                  <span>Live Web Tile (localhost)</span>
                </button>
                <button
                  onClick={() => { onAddNode('kanban', { title: 'Sprint Board' }); setShowAddMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD]"
                >
                  <Columns3 size={14} className="text-[#F59E0B]" />
                  <span>Kanban Board</span>
                </button>
                <button
                  onClick={() => { onAddNode('notes', { title: 'Project Notes' }); setShowAddMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD]"
                >
                  <FileText size={14} className="text-[#8B5CF6]" />
                  <span>Markdown & Checklists</span>
                </button>
                <button
                  onClick={() => { onAddNode('git', { title: 'Git Status' }); setShowAddMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD]"
                >
                  <GitBranch size={14} className="text-[#EF4444]" />
                  <span>Git Status & Commits</span>
                </button>
              </div>
            );
          })()}
        </div>

        {/* 4 Studios Dropdown */}
        {visibleToolbarIds.includes('studios') && (
          <div className="relative">
            <button
              onClick={() => {
                setShowStudiosMenu(!showStudiosMenu);
                setShowSubspaceMenu(false);
                setShowAddMenu(false);
                setShowPresetMenu(false);
                setShowMoreMenu(false);
              }}
              className="sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5"
              title="Open Symvibe Studios (Code, Diagram, Document, Markdown Vault)"
            >
              <FolderTree size={14} className="text-[#06B6D4]" />
              <span className="hidden sm:inline">Studios</span>
              <ChevronDown size={12} className={`transition ${showStudiosMenu ? 'rotate-180' : ''}`} />
            </button>

            {showStudiosMenu && (
              <div className="absolute top-full mt-1.5 left-0 w-64 sym-glass rounded-xl p-1.5 border border-[rgba(241,233,221,0.14)] shadow-2xl z-50 window-no-drag">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8B7E72]">
                  4 Native Studios
                </div>
                <button
                  onClick={() => { onOpenCodeStudio(); setShowStudiosMenu(false); }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2.5 text-[12px] text-[#F1E9DD]"
                >
                  <span className="p-1 rounded bg-[#06B6D4]/20 text-[#06B6D4]">
                    <FolderOpen size={13} />
                  </span>
                  <div>
                    <div className="font-medium">Code Studio</div>
                    <div className="text-[10px] text-[#8B7E72]">Browse repo & pin code</div>
                  </div>
                </button>
                <button
                  onClick={() => { onAddNode('diagram', { title: 'System Architecture' }); setShowStudiosMenu(false); }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2.5 text-[12px] text-[#F1E9DD]"
                >
                  <span className="p-1 rounded bg-[#10B981]/20 text-[#10B981]">
                    <GitGraph size={13} />
                  </span>
                  <div>
                    <div className="font-medium">Diagram Studio</div>
                    <div className="text-[10px] text-[#8B7E72]">Live Mermaid diagrams & SVG</div>
                  </div>
                </button>
                <button
                  onClick={() => { onAddNode('document', { title: 'Technical Spec' }); setShowStudiosMenu(false); }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2.5 text-[12px] text-[#F1E9DD]"
                >
                  <span className="p-1 rounded bg-[#EC4899]/20 text-[#EC4899]">
                    <BookOpen size={13} />
                  </span>
                  <div>
                    <div className="font-medium">Document Studio</div>
                    <div className="text-[10px] text-[#8B7E72]">Rich documentation & PDF export</div>
                  </div>
                </button>
                <button
                  onClick={() => { onAddNode('vault', { title: 'Knowledge Vault' }); setShowStudiosMenu(false); }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2.5 text-[12px] text-[#F1E9DD]"
                >
                  <span className="p-1 rounded bg-[#A855F7]/20 text-[#A855F7]">
                    <Network size={13} />
                  </span>
                  <div>
                    <div className="font-medium">Markdown Vault</div>
                    <div className="text-[10px] text-[#8B7E72]">Obsidian-style linked graph</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Layout Presets Dropdown */}
        {visibleToolbarIds.includes('presets') && (
          <div className="relative">
            <button
              onClick={() => {
                setShowPresetMenu(!showPresetMenu);
                setShowSubspaceMenu(false);
                setShowAddMenu(false);
                setShowStudiosMenu(false);
                setShowMoreMenu(false);
              }}
              className="sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5"
              title="Arrange board nodes into presets"
            >
              <LayoutGrid size={14} />
              <span className="hidden md:inline">Presets</span>
              <ChevronDown size={12} className={`transition ${showPresetMenu ? 'rotate-180' : ''}`} />
            </button>

            {showPresetMenu && (
              <div className="absolute top-full mt-1.5 right-0 w-48 sym-glass rounded-xl p-1.5 border border-[rgba(241,233,221,0.14)] shadow-2xl z-50 window-no-drag">
                <button
                  onClick={() => { onApplyLayoutPreset('side-by-side'); setShowPresetMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] text-[12px] text-[#F1E9DD]"
                >
                  Side by Side (2 Consoles)
                </button>
                <button
                  onClick={() => { onApplyLayoutPreset('grid-2x2'); setShowPresetMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] text-[12px] text-[#F1E9DD]"
                >
                  2x2 Fleet Grid
                </button>
                <button
                  onClick={() => { onApplyLayoutPreset('pipeline'); setShowPresetMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] text-[12px] text-[#F1E9DD]"
                >
                  Pipeline Layout (3 Consoles)
                </button>
                <button
                  onClick={() => { onApplyLayoutPreset('fleet'); setShowPresetMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] text-[12px] text-[#F1E9DD]"
                >
                  Fleet Overview (4 Consoles)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Autonomous Loops */}
        {visibleToolbarIds.includes('loops') && (
          <button
            onClick={onOpenLoops}
            className={`sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5 relative ${
              activeLoopsCount > 0 ? 'bg-[#FF8038]/15 border-[#FF8038]/40 text-[#FF8038]' : ''
            }`}
            title="Autonomous Agent Loops (continuous test & repair)"
          >
            <InfinityIcon size={14} className={activeLoopsCount > 0 ? 'text-[#FF8038] animate-spin' : 'text-[#CDC2B3]'} />
            <span className="hidden md:inline">Loops</span>
            {activeLoopsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FF8038] text-white font-bold">
                {activeLoopsCount}
              </span>
            )}
          </button>
        )}

        {/* Freehand Canvas Drawing Mode Toggle */}
        {visibleToolbarIds.includes('markup') && (
          <button
            onClick={onToggleDrawing}
            className={`sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5 ${
              isDrawingActive ? 'bg-[#FF8038]/20 border-[#FF8038] text-[#FF8038]' : ''
            }`}
            title="Freehand Canvas Drawing & Markup Mode"
          >
            <PenTool size={14} />
            <span className="hidden lg:inline">Markup</span>
          </button>
        )}

        {/* Fleet Composer (Broadcast) */}
        {visibleToolbarIds.includes('composer') && (
          <button
            onClick={onOpenComposer}
            className="sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5"
            title="Compose and broadcast tasks to all agents"
          >
            <Layers size={14} className="text-[#FF8038]" />
            <span className="hidden lg:inline">Composer</span>
          </button>
        )}

        {/* Subspace Group Dropdown */}
        {visibleToolbarIds.includes('subspace') && (
          <div className="relative subspace-menu-container">
            <button
              onClick={() => {
                setShowSubspaceMenu(!showSubspaceMenu);
                setShowAddMenu(false);
                setShowStudiosMenu(false);
                setShowPresetMenu(false);
                setShowMoreMenu(false);
              }}
              className={`sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5 ${
                showSubspaceMenu ? 'bg-[#1F1A16] text-[#F1E9DD] border border-[rgba(241,233,221,0.15)]' : ''
              }`}
              title="Create Subspace (Freeform or Fitted Virtual Screen)"
            >
              <LayoutGrid size={14} className="text-[#A855F7]" />
              <span className="hidden lg:inline">Subspace</span>
              <ChevronDown size={11} className={`text-[#8B7E72] transition ${showSubspaceMenu ? 'rotate-180' : ''}`} />
            </button>

            {showSubspaceMenu && (
              <div className="absolute top-full mt-1.5 left-0 w-64 sym-glass rounded-xl p-1.5 border border-[rgba(241,233,221,0.14)] shadow-2xl z-50 window-no-drag animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8B7E72] border-b border-[rgba(241,233,221,0.06)] mb-1">
                  Subspace Layout Type
                </div>

                <button
                  onClick={() => {
                    onAddSubspace?.('fitted');
                    setShowSubspaceMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#1F1A16] flex items-start gap-2.5 text-[12px] text-[#F1E9DD] transition group"
                >
                  <span className="p-1.5 rounded-lg bg-[#A855F7]/20 text-[#A855F7] group-hover:scale-105 transition-transform mt-0.5">
                    <Monitor size={15} />
                  </span>
                  <div>
                    <div className="font-medium text-[#F1E9DD] flex items-center gap-1.5">
                      <span>Fitted Subspace</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#A855F7]/25 text-[#D8B4FE] font-mono font-semibold">SCREEN</span>
                    </div>
                    <div className="text-[11px] text-[#8B7E72] mt-0.5">
                      Virtual screen with snap zones (1/2, 1/4, 1/1) & auto-scaling
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onAddSubspace?.('free');
                    setShowSubspaceMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#1F1A16] flex items-start gap-2.5 text-[12px] text-[#F1E9DD] transition group mt-0.5"
                >
                  <span className="p-1.5 rounded-lg bg-[#FF8038]/20 text-[#FF8038] group-hover:scale-105 transition-transform mt-0.5">
                    <Move size={15} />
                  </span>
                  <div>
                    <div className="font-medium text-[#F1E9DD] flex items-center gap-1.5">
                      <span>Free Subspace</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FF8038]/25 text-[#FFD8B4] font-mono font-semibold">FREEFORM</span>
                    </div>
                    <div className="text-[11px] text-[#8B7E72] mt-0.5">
                      Freeform container to group & move nodes freely together
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quota Alarm / Resetter */}
        {visibleToolbarIds.includes('quota-alarm') && (
          <button
            onClick={onOpenQuotaAlarm}
            className="sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5"
            title="Quota Alarm / Usage Resetter (5h warmup pings)"
          >
            <AlarmClock size={14} className="text-[#10B981]" />
            <span className="hidden lg:inline">Quota Alarm</span>
          </button>
        )}

        {/* Project Memory Drawer Toggle */}
        {visibleToolbarIds.includes('memory') && (
          <button
            onClick={onToggleMemory}
            className="sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5"
            title="Project Memory and Guidelines"
          >
            <Bookmark size={14} className="text-[#3B82F6]" />
            <span className="hidden lg:inline">Memory</span>
          </button>
        )}

        {/* Mission Map Drawer Toggle */}
        {visibleToolbarIds.includes('mission-map') && (
          <button
            onClick={onToggleMissionMap}
            className={`sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5 relative ${
              needsInputCount > 0 ? 'border-amber-500/50 bg-amber-500/10 text-amber-300' : ''
            }`}
            title="Toggle ambient Mission Map drawer"
          >
            <Radar size={14} className={needsInputCount > 0 ? 'text-amber-400 animate-pulse' : 'text-[#10B981]'} />
            <span className="hidden sm:inline">Mission Map</span>
            {needsInputCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-black font-bold">
                {needsInputCount}
              </span>
            )}
          </button>
        )}

        {/* Tiny "More" button on the furthest right of the toolbar */}
        {moreFeatures.length > 0 && (
          <div className="relative more-menu-container">
            <button
              onClick={() => {
                setShowMoreMenu(!showMoreMenu);
                setShowStudiosMenu(false);
                setShowPresetMenu(false);
                setShowAddMenu(false);
              }}
              className={`sym-btn-ghost px-2 py-1.5 rounded-lg text-[13px] flex items-center gap-1 relative ${
                showMoreMenu ? 'bg-[#1F1A16] text-[#F1E9DD] border border-[rgba(241,233,221,0.15)]' : ''
              }`}
              title="More features (right-click top bar to customize)"
            >
              <MoreHorizontal size={15} className="text-[#CDC2B3]" />
              <span className="text-[12px] text-[#CDC2B3] hidden sm:inline">More</span>
              <ChevronDown size={11} className={`text-[#8B7E72] transition ${showMoreMenu ? 'rotate-180' : ''}`} />
              
              {/* Alert notification badge if an item in More has an alert */}
              {hasMoreAlert && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[#0A0908] animate-pulse" />
              )}
            </button>

            {showMoreMenu && (
              <div className="absolute top-full mt-1.5 right-0 w-60 sym-glass rounded-xl p-1.5 border border-[rgba(241,233,221,0.14)] shadow-2xl z-50 window-no-drag animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8B7E72] border-b border-[rgba(241,233,221,0.06)] mb-1">
                  <span>More Features</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHeaderContextMenu(e);
                    }}
                    className="hover:text-[#FF8038] flex items-center gap-1 normal-case tracking-normal transition"
                    title="Right-click top bar or click here to customize which buttons appear on bar"
                  >
                    <SlidersHorizontal size={10} />
                    <span>Customize</span>
                  </button>
                </div>

                <div className="space-y-0.5">
                  {moreFeatures.map(item => {
                    if (item.id === 'presets') {
                      return (
                        <div key="presets" className="p-1.5 rounded-lg bg-[rgba(241,233,221,0.03)] border border-[rgba(241,233,221,0.06)] mb-1">
                          <div className="flex items-center gap-2 px-1 text-[11px] font-medium text-[#CDC2B3] mb-1">
                            <LayoutGrid size={13} className="text-[#CDC2B3]" />
                            <span>Layout Presets</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px]">
                            <button
                              onClick={() => { onApplyLayoutPreset('side-by-side'); setShowMoreMenu(false); }}
                              className="px-2 py-1 rounded hover:bg-[#1F1A16] text-[#CDC2B3] hover:text-[#F1E9DD] text-left transition"
                            >
                              Side-by-Side
                            </button>
                            <button
                              onClick={() => { onApplyLayoutPreset('grid-2x2'); setShowMoreMenu(false); }}
                              className="px-2 py-1 rounded hover:bg-[#1F1A16] text-[#CDC2B3] hover:text-[#F1E9DD] text-left transition"
                            >
                              2x2 Grid
                            </button>
                            <button
                              onClick={() => { onApplyLayoutPreset('pipeline'); setShowMoreMenu(false); }}
                              className="px-2 py-1 rounded hover:bg-[#1F1A16] text-[#CDC2B3] hover:text-[#F1E9DD] text-left transition"
                            >
                              Pipeline
                            </button>
                            <button
                              onClick={() => { onApplyLayoutPreset('fleet'); setShowMoreMenu(false); }}
                              className="px-2 py-1 rounded hover:bg-[#1F1A16] text-[#CDC2B3] hover:text-[#F1E9DD] text-left transition"
                            >
                              Fleet (4)
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (item.id === 'studios') {
                      return (
                        <div key="studios" className="p-1.5 rounded-lg bg-[rgba(241,233,221,0.03)] border border-[rgba(241,233,221,0.06)] mb-1">
                          <div className="flex items-center gap-2 px-1 text-[11px] font-medium text-[#06B6D4] mb-1">
                            <FolderTree size={13} />
                            <span>Studios</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px]">
                            <button onClick={() => { onOpenCodeStudio(); setShowMoreMenu(false); }} className="px-2 py-1 rounded hover:bg-[#1F1A16] text-[#CDC2B3] hover:text-[#F1E9DD] text-left">Code</button>
                            <button onClick={() => { onAddNode('diagram', { title: 'System Architecture' }); setShowMoreMenu(false); }} className="px-2 py-1 rounded hover:bg-[#1F1A16] text-[#CDC2B3] hover:text-[#F1E9DD] text-left">Diagram</button>
                            <button onClick={() => { onAddNode('document', { title: 'Technical Spec' }); setShowMoreMenu(false); }} className="px-2 py-1 rounded hover:bg-[#1F1A16] text-[#CDC2B3] hover:text-[#F1E9DD] text-left">Doc</button>
                            <button onClick={() => { onAddNode('vault', { title: 'Knowledge Vault' }); setShowMoreMenu(false); }} className="px-2 py-1 rounded hover:bg-[#1F1A16] text-[#CDC2B3] hover:text-[#F1E9DD] text-left">Vault</button>
                          </div>
                        </div>
                      );
                    }

                    if (item.id === 'mission-map') {
                      return (
                        <button
                          key="mission-map"
                          onClick={() => { onToggleMissionMap(); setShowMoreMenu(false); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] transition ${
                            needsInputCount > 0 ? 'bg-amber-500/10 text-amber-300' : 'text-[#F1E9DD]'
                          }`}
                        >
                          <Radar size={14} className={needsInputCount > 0 ? 'text-amber-400 animate-pulse' : 'text-[#10B981]'} />
                          <span>Mission Map</span>
                          {needsInputCount > 0 && (
                            <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-black font-bold">
                              {needsInputCount}
                            </span>
                          )}
                        </button>
                      );
                    }

                    if (item.id === 'markup') {
                      return (
                        <button
                          key="markup"
                          onClick={() => { onToggleDrawing(); setShowMoreMenu(false); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] transition ${
                            isDrawingActive ? 'bg-[#FF8038]/20 text-[#FF8038]' : 'text-[#F1E9DD]'
                          }`}
                        >
                          <PenTool size={14} className="text-[#FF8038]" />
                          <span>Canvas Markup</span>
                          {isDrawingActive && <span className="ml-auto text-[10px] text-[#FF8038]">Active</span>}
                        </button>
                      );
                    }

                    if (item.id === 'composer') {
                      return (
                        <button
                          key="composer"
                          onClick={() => { onOpenComposer(); setShowMoreMenu(false); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD] transition"
                        >
                          <Layers size={14} className="text-[#FF8038]" />
                          <span>Fleet Composer</span>
                        </button>
                      );
                    }

                    if (item.id === 'loops') {
                      return (
                        <button
                          key="loops"
                          onClick={() => { onOpenLoops(); setShowMoreMenu(false); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] transition ${
                            activeLoopsCount > 0 ? 'bg-[#FF8038]/15 text-[#FF8038]' : 'text-[#F1E9DD]'
                          }`}
                        >
                          <InfinityIcon size={14} className={activeLoopsCount > 0 ? 'text-[#FF8038] animate-spin' : 'text-[#CDC2B3]'} />
                          <span>Autonomous Loops</span>
                          {activeLoopsCount > 0 && (
                            <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] bg-[#FF8038] text-white font-bold">
                              {activeLoopsCount}
                            </span>
                          )}
                        </button>
                      );
                    }

                    if (item.id === 'subspace') {
                      return (
                        <div key="subspace" className="p-1.5 rounded-lg bg-[rgba(241,233,221,0.03)] border border-[rgba(241,233,221,0.06)] mb-1">
                          <div className="flex items-center gap-2 px-1 text-[11px] font-medium text-[#CDC2B3] mb-1">
                            <LayoutGrid size={13} className="text-[#A855F7]" />
                            <span>Subspaces</span>
                          </div>
                          <div className="space-y-0.5">
                            <button
                              onClick={() => { onAddSubspace?.('fitted'); setShowMoreMenu(false); }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-[#1F1A16] flex items-center gap-2 text-[11px] text-[#CDC2B3] hover:text-[#F1E9DD] transition"
                            >
                              <Monitor size={13} className="text-[#A855F7]" />
                              <span>Fitted Subspace (Screen)</span>
                            </button>
                            <button
                              onClick={() => { onAddSubspace?.('free'); setShowMoreMenu(false); }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-[#1F1A16] flex items-center gap-2 text-[11px] text-[#CDC2B3] hover:text-[#F1E9DD] transition"
                            >
                              <Move size={13} className="text-[#FF8038]" />
                              <span>Free Subspace (Group)</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (item.id === 'quota-alarm') {
                      return (
                        <button
                          key="quota-alarm"
                          onClick={() => { onOpenQuotaAlarm(); setShowMoreMenu(false); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD] transition"
                        >
                          <AlarmClock size={14} className="text-[#10B981]" />
                          <span>Quota Alarm</span>
                        </button>
                      );
                    }

                    if (item.id === 'memory') {
                      return (
                        <button
                          key="memory"
                          onClick={() => { onToggleMemory(); setShowMoreMenu(false); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD] transition"
                        >
                          <Bookmark size={14} className="text-[#3B82F6]" />
                          <span>Project Memory</span>
                        </button>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right-Click Customize Top Bar Context Menu */}
      {showCustomizeMenu && (
        <div
          style={{ left: `${customMenuPos.x}px`, top: `${customMenuPos.y}px` }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 min-w-[240px] bg-[#14110E]/95 backdrop-blur-xl border border-[rgba(241,233,221,0.18)] rounded-xl shadow-2xl py-2 px-2 text-xs text-[#F1E9DD] animate-in fade-in zoom-in-95 duration-100 select-none window-no-drag"
        >
          <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8B7E72] border-b border-[rgba(241,233,221,0.06)] mb-1.5 flex items-center justify-between">
            <span>Customize Top Bar</span>
            <span className="text-[9px] text-[#FF8038] font-sans">Right-Click Menu</span>
          </div>
          <p className="px-2.5 pb-1.5 text-[10px] text-[#8B7E72]">
            Checked items appear on the bar. Unchecked items move into the <strong>More</strong> dropdown.
          </p>

          <div className="space-y-0.5">
            {TOOLBAR_ITEMS.map(item => {
              const isVisible = visibleToolbarIds.includes(item.id);
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => toggleToolbarItem(item.id)}
                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 text-left text-[12px] transition"
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    readOnly
                    className="w-3.5 h-3.5 rounded accent-[#FF8038] cursor-pointer pointer-events-none"
                  />
                  <IconComponent size={13} style={{ color: item.color }} />
                  <span className={isVisible ? 'text-[#F1E9DD] font-medium' : 'text-[#8B7E72]'}>
                    {item.label}
                  </span>
                  <span className="text-[10px] text-[#8B7E72] ml-auto">
                    {isVisible ? 'On Bar' : 'In More'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="my-1.5 border-t border-[rgba(241,233,221,0.06)]" />

          <div className="flex items-center justify-between px-1 pt-0.5">
            <button
              onClick={resetToolbarToDefaults}
              className="px-2 py-1 rounded text-[11px] text-[#8B7E72] hover:text-[#FF8038] hover:bg-white/5 transition"
              title="Reset to default (Presets, Markup, Composer, Mission Map in More)"
            >
              Reset defaults
            </button>
            <button
              onClick={() => setShowCustomizeMenu(false)}
              className="sym-btn-primary px-3 py-1 rounded-md text-[11px]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
