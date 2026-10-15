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
  BarChart2
} from 'lucide-react';

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
  onToggleUsage,
  onOpenLoops,
  onToggleDrawing,
  onOpenCodeStudio,
  isDrawingActive = false,
  activeLoopsCount = 0,
  needsInputCount = 0,
  installedAgents = []
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showStudiosMenu, setShowStudiosMenu] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);

  const activeWs = workspaces.find(w => w.id === activeWorkspaceId);

  return (
    <header className="h-14 bg-[rgba(15,12,10,0.92)] border-b border-[rgba(241,233,221,0.09)] px-4 flex items-center justify-between z-30 select-none relative backdrop-blur-md">
      {/* Brand & Workspaces */}
      <div className="flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mr-2">
          <div className="w-6 h-6 rounded-md bg-[#FF8038] flex items-center justify-center text-white font-bold text-xs shadow-md shadow-[#FF8038]/20">
            D
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#F1E9DD]">
            DeloSpace
          </span>
        </div>

        {/* Workspaces Tabs */}
        <div className="flex items-center gap-1 bg-[#14110E] p-1 rounded-xl border border-[rgba(241,233,221,0.06)]">
          {workspaces.map(ws => (
            <button
              key={ws.id}
              onClick={() => onSelectWorkspace(ws.id)}
              className={`px-3 py-1 rounded-lg text-[12px] font-medium transition ${
                ws.id === activeWorkspaceId
                  ? 'bg-[#1F1A16] text-[#F1E9DD] shadow-sm border border-[rgba(241,233,221,0.12)]'
                  : 'text-[#8B7E72] hover:text-[#CDC2B3]'
              }`}
            >
              {ws.name}
            </button>
          ))}
          <button
            onClick={onAddWorkspace}
            className="p-1 rounded-lg text-[#8B7E72] hover:text-[#F1E9DD] hover:bg-[#1F1A16] transition ml-0.5"
            title="Create new workspace board"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Current Repo Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-mono text-[#8B7E72] px-2 py-0.5 rounded bg-[#14110E] border border-[rgba(241,233,221,0.04)] max-w-[240px] truncate" title={activeWs?.cwd}>
          <FolderOpen size={12} className="text-[#FF8038] flex-none" />
          <span className="truncate">{activeWs?.cwd?.split('/').slice(-2).join('/') || 'workspace'}</span>
        </div>
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

          {showAddMenu && (
            <div className="absolute top-full mt-1.5 left-0 w-64 sym-glass rounded-xl p-1.5 border border-[rgba(241,233,221,0.14)] shadow-2xl z-50">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8B7E72]">
                Agent Terminals (Native macOS PTY)
              </div>
              <button
                onClick={() => { onAddNode('terminal', { agentType: 'claude', title: 'Claude Code', command: 'claude' }); setShowAddMenu(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD]"
              >
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                <span className="font-medium">Claude Code</span>
                <span className="text-[10px] text-[#8B7E72] ml-auto">Anthropic</span>
              </button>
              <button
                onClick={() => { onAddNode('terminal', { agentType: 'codex', title: 'OpenAI Codex', command: 'codex' }); setShowAddMenu(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD]"
              >
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="font-medium">OpenAI Codex</span>
                <span className="text-[10px] text-[#8B7E72] ml-auto">OpenAI</span>
              </button>
              <button
                onClick={() => { onAddNode('terminal', { agentType: 'gemini', title: 'Gemini CLI', command: 'gemini' }); setShowAddMenu(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD]"
              >
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                <span className="font-medium">Gemini CLI</span>
                <span className="text-[10px] text-[#8B7E72] ml-auto">Google</span>
              </button>
              <button
                onClick={() => { onAddNode('terminal', { agentType: 'opencode', title: 'OpenCode', command: 'opencode' }); setShowAddMenu(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD]"
              >
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                <span className="font-medium">OpenCode</span>
                <span className="text-[10px] text-[#8B7E72] ml-auto">Community</span>
              </button>
              <button
                onClick={() => { onAddNode('terminal', { agentType: 'zsh', title: 'macOS Shell', command: '' }); setShowAddMenu(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1F1A16] flex items-center gap-2 text-[12px] text-[#F1E9DD]"
              >
                <span className="w-2 h-2 rounded-full bg-[#FF8038]" />
                <span className="font-medium">Direct zsh Shell</span>
                <span className="text-[10px] text-[#8B7E72] ml-auto">Native PTY</span>
              </button>

              <div className="my-1 border-t border-[rgba(241,233,221,0.06)]" />

              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8B7E72]">
                Workspace Tiles
              </div>
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
          )}
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
            <div className="absolute top-full mt-1.5 left-0 w-64 sym-glass rounded-xl p-1.5 border border-[rgba(241,233,221,0.14)] shadow-2xl z-50">
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
            <div className="absolute top-full mt-1.5 right-0 w-48 sym-glass rounded-xl p-1.5 border border-[rgba(241,233,221,0.14)] shadow-2xl z-50">
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

        {/* Token & Usage Analytics */}
        <button
          onClick={onToggleUsage}
          className="sym-btn-ghost px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5"
          title="Token & Usage Analytics"
        >
          <BarChart2 size={14} className="text-emerald-400" />
          <span className="hidden lg:inline">Usage</span>
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
