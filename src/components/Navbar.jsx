import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { getStoredAgentTerminals } from './AgentConfigModal';

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

  const activeWs = workspaces.find(w => w.id === activeWorkspaceId);

  return (
    <header 
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
              setShowStudiosMenu(false);
              setShowPresetMenu(false);
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
                  onClick={() => { onAddSubspace?.(); setShowAddMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD]"
                >
                  <LayoutGrid size={14} className="text-[#A855F7]" />
                  <span>Subspace Group Container</span>
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
        <div className="relative">
          <button
            onClick={() => {
              setShowStudiosMenu(!showStudiosMenu);
              setShowAddMenu(false);
              setShowPresetMenu(false);
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

        {/* Layout Presets Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPresetMenu(!showPresetMenu);
              setShowAddMenu(false);
              setShowStudiosMenu(false);
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

        {/* Autonomous Loops */}
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

        {/* Freehand Canvas Drawing Mode Toggle */}
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

        {/* Fleet Composer (Broadcast) */}
        <button
          onClick={onOpenComposer}
          className="sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5"
          title="Compose and broadcast tasks to all agents"
        >
          <Layers size={14} className="text-[#FF8038]" />
          <span className="hidden lg:inline">Composer</span>
        </button>

        {/* Subspace Group Container */}
        <button
          onClick={onAddSubspace}
          className="sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5"
          title="Create Subspace Group (organize & move nodes together like desktop icons)"
        >
          <LayoutGrid size={14} className="text-[#A855F7]" />
          <span className="hidden lg:inline">Subspace</span>
        </button>

        {/* Quota Alarm / Resetter */}
        <button
          onClick={onOpenQuotaAlarm}
          className="sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5"
          title="Quota Alarm / Usage Resetter (5h warmup pings)"
        >
          <AlarmClock size={14} className="text-[#10B981]" />
          <span className="hidden lg:inline">Quota Alarm</span>
        </button>

        {/* Project Memory Drawer Toggle */}
        <button
          onClick={onToggleMemory}
          className="sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5"
          title="Project Memory and Guidelines"
        >
          <Bookmark size={14} className="text-[#3B82F6]" />
          <span className="hidden lg:inline">Memory</span>
        </button>

        {/* Mission Map Drawer Toggle */}
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
      </div>
    </header>
  );
}
