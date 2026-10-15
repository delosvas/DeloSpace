# Symvibe · One Board for Your AI Agents

A 1-to-1 local-first implementation of **Symvibe**, bringing your AI coding agents together on one visual, infinite board. Run real terminals, organize agent teams, hand off task context, and orchestrate work on your Mac.

---

## Capabilities & Architecture

### 1. Real Pseudo-Terminals (Native macOS PTY)
- Every console is a real pseudo-terminal (`forkpty`) running macOS `/bin/zsh`.
- Full interactive job control: `Ctrl+C`, Vim, Nano, curses, and prompt navigation work natively.
- **Pre-configured Agent Launchers**:
  - **Claude Code** (`claude`) — *Auto-detected on your Mac*
  - **OpenAI Codex** (`codex`) — *Auto-detected on your Mac*
  - **OpenCode** (`opencode`) — *Auto-detected on your Mac*
  - **Gemini CLI** (`gemini`)
  - **Aider** (`aider`)
  - **macOS Zsh Shell** (Direct shell terminal)
- **Profile Isolation**: Run multiple accounts of the same CLI (e.g. Work Claude vs. Personal Claude) side-by-side using isolated configuration folders (`CLAUDE_CONFIG_DIR`, `CODEX_HOME`).
- **On-Device Voice Dictation**: Hands-free prompt input using native browser Web Speech API.

### 2. Infinite Visual Canvas & Navigation
- **Infinite 2D Pan and Zoom**: Pan smoothly by dragging the canvas background. Zoom in and out anchored at your cursor (`0.2x` to `2.5x`).
- **Interactive Minimap**: Real-time spatial radar on the bottom-right showing all nodes on the canvas. Click or drag to jump anywhere on the board.
- **Draggable & Resizable Nodes**: Freely reposition nodes by their headers or resize them from their corners.
- **Fullscreen Focus**: Maximize any console or studio tile with one click to focus, then restore back to canvas view.
- **Layout Presets**: One-click arrangement into Side-by-Side (2 Consoles), 2x2 Fleet Grid, Pipeline Layout (3 Consoles), or Fleet Overview (4 Consoles).

### 3. The 4 Native Studios
- **Code Studio**: Browse the local repository tree, preview code files, and pin live syntax-highlighted code cards directly onto the canvas board.
- **Diagram Studio**: Real-time Mermaid diagram editor for architecture flows, sequence diagrams, and class charts with live SVG export.
- **Document Studio**: Rich technical specification and markdown editor with header hierarchy, code blocks, pagination preview, and PDF print export.
- **Markdown Vault**: Obsidian-style interconnected knowledge graph with `[[WikiLink]]` backlink parsing, note search, and 2D canvas link physics graph.

### 4. Autonomous Agent Loops
- Continuous autonomous test-and-repair loops.
- Configure triggers: **On Agent Idle** (runs immediately when terminal finishes) or **Timer Interval** (every N seconds).
- Intelligent stop condition: regex or string matching on console output (e.g., `tests passed`, `0 errors`, `Done in`).
- Max iteration safety guardrails with real-time cycle tracking and one-click emergency abort.

### 5. Freehand Canvas Markup & Drawing Layer
- Canvas-wide freehand drawing tool: **Pen**, **Highlighter**, **Eraser**, color swatches, stroke sizing, and undo.
- Drawings scale and pan seamlessly in the infinite canvas coordinate space to annotate terminal errors or diagram connections.

### 6. Multi-Agent Orchestration & State Handoff
- **Agent Handoff**: Seamlessly transfer work from Agent A to Agent B. Symvibe automatically extracts the recent session context from the source console, wraps it with a task directive, and dispatches it directly into the target console.
- **Fleet Composer (Broadcast)**: Select any group of active agents and broadcast a coordinated command or test directive simultaneously.

### 7. Telemetry & Analytics
- **Ambient Mission Map**: Real-time status detection for every agent console (🟢 Working, 🟡 Needs You, ⚪ Idle) with one-click **Jump to Node** and **Interrupt (Ctrl+C)** controls.
- **Token & Usage Analytics**: Live tracking of token consumption (input/output) across Anthropic, OpenAI, Google, and local agents with estimated costs and JSON export.
- **Project Memory**: Global and per-project instruction bank with one-click **Push to Console** injection.
- **Live Git Card**: Real-time branch, changed files count, untracked files, and recent commit history.
- **Live Web Tiles**: Embedded browser preview (e.g., `http://localhost:5173`) with responsive viewport toggles (Desktop, Tablet 768px, Mobile 375px).

---

## Getting Started

### Prerequisites
- macOS (Apple Silicon recommended)
- Node.js v18+ and npm

### 1. Launch in Browser
```bash
npm start
```
Boots the Express 5 + WebSocket backend on `http://localhost:3001` and serves the production client.
Open your browser to:
```
http://localhost:3001
```

### 2. Launch as Native macOS Desktop App (Electron)
```bash
npm run electron
```
Or to run both server and desktop window in a single command:
```bash
npm run desktop
```
Opens Symvibe in a native macOS frameless dark window with inset traffic light controls.

### 3. Development Mode
```bash
npm run dev
```
Runs Vite dev server with Hot Module Replacement (HMR) alongside the backend PTY server.

---

## Architecture Overview

```
CopyOfIDEAapp/
├── electron/
│   └── main.js           # macOS Electron window & traffic light configuration
├── server/
│   ├── index.js          # Express 5 + WebSocket server (port 3001)
│   ├── pty-manager.js    # Native macOS PTY spawner, buffer manager & status detector
│   ├── agent-catalog.js  # Agent CLI auto-detection & profile environments
│   ├── git-service.js    # Git repository inspection (branch, diff, log)
│   └── storage.js        # Local JSON persistence (~/.symvibe/workspaces.json)
├── src/
│   ├── App.jsx           # Main board orchestrator & loop runtime
│   ├── services/api.js   # REST API & WebSocket client
│   ├── components/
│   │   ├── Canvas.jsx          # Infinite 2D pan/zoom canvas
│   │   ├── Minimap.jsx         # Interactive spatial navigation radar
│   │   ├── Navbar.jsx          # Workspace tabs, studios menu & tools
│   │   ├── InkLayer.jsx        # Freehand canvas markup & drawing layer
│   │   ├── LoopModal.jsx       # Autonomous loops configuration & control
│   │   ├── CodeStudioModal.jsx # Repo browser & code pinner
│   │   ├── ComposerModal.jsx   # Fleet-wide prompt broadcast
│   │   ├── HandoffModal.jsx    # Agent-to-agent state handoff
│   │   ├── MissionMapDrawer.jsx# Ambient fleet overview
│   │   ├── MemoryDrawer.jsx    # Project memory & injection
│   │   ├── UsageDrawer.jsx     # Token & cost telemetry
│   │   └── nodes/
│   │       ├── TerminalNode.jsx     # xterm.js PTY console with quick prompt & dictation
│   │       ├── WebTileNode.jsx      # Live browser viewport preview
│   │       ├── KanbanNode.jsx       # Task card columns
│   │       ├── NotesNode.jsx        # Markdown notes & checklists
│   │       ├── GitNode.jsx          # Live Git telemetry
│   │       ├── CodeNode.jsx         # Pinned syntax-highlighted code file
│   │       ├── DiagramNode.jsx      # Mermaid architecture studio
│   │       ├── DocumentNode.jsx     # Technical spec studio with PDF export
│   │       └── MarkdownVaultNode.jsx# Linked knowledge graph studio
└── dist/                       # Production-compiled client bundle
```
