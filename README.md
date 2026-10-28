# DeloSpace · One Board for Your AI Agents

A high-performance, local-first visual operating canvas for AI coding agents. Run native macOS pseudo-terminals, organize your agents into fitted screens and freeform subspaces, hand off task context, set quota resetters, and orchestrate autonomous workflows on your Mac.

---

## Capabilities & Key Features

### 1. Real Pseudo-Terminals (Native macOS PTY)
- **Native PTY Process Control**: Every console is a real pseudo-terminal (`node-pty` / `forkpty`) running macOS `/bin/zsh`.
- **Interactive CLI Support**: Full interactive job control (`Ctrl+C`, Vim, Nano, curses, and prompt navigation work natively).
- **Supported & Auto-Detected Agents**:
  - **Claude Code** (`claude`) — *Auto-detected on your Mac*
  - **OpenAI Codex** (`codex`) — *Auto-detected on your Mac*
  - **Kimi CLI** (`kimi`)
  - **DeepCode** (`deepcode`)
  - **OpenCode** (`opencode`) — *Auto-detected on your Mac*
  - **Gemini CLI** (`gemini`)
  - **Aider** (`aider`)
  - **macOS Zsh Shell** (Direct shell terminal)
  - **Custom Agent CLIs** — Add any CLI tool with custom command, provider name, and color theme.
- **Sleep & WiFi Auto-Recovery**: Automatic PTY session reconnect on network `online` and `visibilitychange` events, plus instant manual reconnect on `<RotateCcw />` or right-click context menu.
- **Agent Terminals Customizer**: Reorder agent presets, toggle dropdown visibility, and configure custom agent launchers.
- **Profile Isolation**: Run multiple accounts of the same CLI (e.g. Work Claude vs. Personal Claude) side-by-side using isolated configuration folders (`CLAUDE_CONFIG_DIR`, `CODEX_HOME`).
- **Voice Dictation**: Hands-free prompt input using native Web Speech recognition.

---

### 2. Subspaces: Fitted Virtual Screens & Freeform Groups
Organize multiple terminals and tools into dedicated spatial workspaces:
- **Fitted Subspace (`SCREEN`)**:
  - **Windows Aero-Style Smart Window Snapping**: Drag any node near edges or corners to see live glowing translucent snap preview ghost boxes.
  - **Snap Zones**:
    - Sides (Middle): Snaps to **Left Half (1/2)** or **Right Half (1/2)**.
    - Corners: Snaps to **Top-Left (1/4)**, **Top-Right (1/4)**, **Bottom-Left (1/4)**, or **Bottom-Right (1/4)**.
    - Top Center: Snaps to **Full Screen (1/1)**.
  - **Dynamic Proportional Auto-Scaling**: Resizing a Fitted Subspace automatically recalculates and scales all docked member nodes in real time.
  - **Undocking**: Drag a docked card out of the screen boundary to detach and float freely.
- **Free Subspace (`FREEFORM`)**:
  - Freeform grouping container where nodes retain their individual dimensions. Moving the subspace moves all grouped cards together across the canvas.
- Accessible via the **Subspace dropdown menu** in the top bar, **+ Add Node** menu, **More** dropdown, and canvas right-click context menu.

---

### 3. Pinned Sticky Notes on Nodes
- **Right-Click Attachment**: Right-click anywhere on any node to pin a sticky note at that exact spot.
- **Synchronized Movement**: Sticky notes stay pinned and travel smoothly with their parent node when dragged.
- **Color Themes**: Yellow, Pink, Green, Blue, and Orange palettes.
- **Inline Editing & Management**: Double-click to edit, or right-click a sticky note for edit, color palette, and delete actions.

---

### 4. Quota Resetter & Warmup Alarms
- **Automated Quota Resets**: Set alarms (one-time or daily recurring) for any AI provider (Claude, Codex, Gemini, Kimi, DeepCode, or custom agents).
- **Background Warmup Pings**: Wakes up 5 hours before your target reset time and sends an ultra-cheap warmup ping (e.g., using lightweight models like Claude Haiku or GPT-4o-mini) so provider quota windows reset exactly when you need them.

---

### 5. Customizable Top Bar & "More" Menu
- **Right-Click Customizer**: Right-click the top navigation bar to toggle which tool buttons are visible on the bar and which are moved into the sleek **More** dropdown.
- **Instant Click-to-Dismiss**: All dropdowns (+ Add Node, Studios, Presets, Subspace, More) and the Customize popover immediately close when clicking anywhere outside.
- **Persistent Preferences**: Toolbar settings are saved automatically in `localStorage`.

---

### 6. Infinite Visual Canvas & Navigation
- **Infinite 2D Pan and Zoom**: Pan smoothly with trackpad or mouse drag. Cursor-anchored wheel zooming (`0.2x` to `2.5x`).
- **Interactive Minimap**: Real-time radar HUD on the bottom-right showing all canvas nodes and visible camera frustum with one-click navigation, *Fit All*, and *Reset 100%*.
- **Draggable & Resizable Nodes**: Smooth node header dragging and corner resizing.
- **Fullscreen Focus**: Maximize any terminal or studio tile with one click, then restore back to canvas view.
- **Layout Presets**: One-click arrangement into Side-by-Side (2 Consoles), 2x2 Fleet Grid, Pipeline (3 Consoles), or Fleet Overview (4 Consoles).

---

### 7. The 4 Native Studios
- **Code Studio**: Browse the project directory tree, preview files, and pin syntax-highlighted code cards directly onto the canvas board.
- **Diagram Studio**: Real-time Mermaid diagram editor for architecture flows, sequence diagrams, state machines, and entity-relationship models with SVG export.
- **Document Studio**: Rich technical specification editor with markdown parsing, code blocks, pagination preview, and PDF export.
- **Markdown Vault**: Obsidian-style interconnected knowledge vault with `[[WikiLink]]` backlink parsing, note search, and 2D canvas link physics graph.

---

### 8. Autonomous Agent Loops
- **Continuous Test-and-Repair Loops**: Run agents in autonomous iterations.
- **Trigger Modes**: **On Agent Idle** (runs immediately when terminal finishes) or **Timer Interval** (every N seconds).
- **Intelligent Stop Conditions**: Regex or string matching on console output (e.g., `tests passed`, `0 errors`, `Build succeeded`).
- **Safety Guardrails**: Max iteration limits, real-time cycle counters, and emergency abort.

---

### 9. Freehand Canvas Markup Layer
- Canvas-wide drawing tools: **Pen**, **Highlighter**, **Eraser**, color swatches, stroke sizing, and undo.
- Ink strokes scale and pan accurately with the canvas coordinate space to annotate errors or draw connections between agents.

---

### 10. Multi-Agent Orchestration & Context Handoff
- **Agent Handoff**: Transfer work from Agent A to Agent B. DeloSpace automatically extracts the recent session context from the source console, wraps it with a task directive, and injects it into the target console.
- **Fleet Composer (Broadcast)**: Select any group of active agents and broadcast a coordinated command or test directive simultaneously.
- **Ambient Mission Map**: Ambient fleet radar with real-time status indicators (🟢 Working, 🟡 Needs Attention, ⚪ Idle), one-click **Jump to Node**, and emergency **Ctrl+C** controls.
- **Project Memory**: Global and per-workspace instruction bank with one-click **Push to Console** injection.
- **Live Git & Web Preview**: Real-time branch status, changed files, commit history, and embedded responsive web browser previews (`Desktop`, `Tablet 768px`, `Mobile 375px`).

---

## Getting Started

### Prerequisites
- macOS (Apple Silicon arm64 recommended)
- Node.js v18+ and npm

### 1. Launch as Native macOS Desktop App (Electron)
```bash
npm run desktop
```
Opens DeloSpace in a native macOS dark frameless window with native traffic light controls.

### 2. Compile & Install to Applications (`/Applications/DeloSpace.app`)
To build the standalone `.app` with the native **DeloSpace** app icon and register it with Raycast & Spotlight:
```bash
npm run install-mac
```
Installs directly to `/Applications/DeloSpace.app` and registers with macOS LaunchServices.

### 3. Launch in Browser
```bash
npm start
```
Starts the Express 5 + WebSocket backend on `http://localhost:3001` and serves the production client at `http://localhost:3001`.

### 4. Development Mode
```bash
npm run dev
```
Runs the Vite client with Hot Module Replacement (HMR) alongside the backend PTY server.

---

## Architecture Overview

```
DeloSpace/
├── electron/
│   └── main.js               # macOS Electron window & traffic light configuration
├── server/
│   ├── index.js              # Express 5 + WebSocket server (port 3001)
│   ├── pty-manager.js        # Native macOS PTY spawner, buffer manager & status detector
│   ├── agent-catalog.js      # Agent CLI auto-detection, custom agents & profile environments
│   ├── quota-resetter.js     # Background provider quota warmup scheduler
│   ├── git-service.js        # Git repository inspection (branch, diff, log)
│   └── storage.js            # Local JSON persistence (~/.symvibe/workspaces.json)
├── src/
│   ├── App.jsx               # Main board orchestrator & loop runtime
│   ├── services/api.js       # REST API & WebSocket client
│   ├── components/
│   │   ├── Canvas.jsx              # Infinite 2D pan/zoom canvas, smart snapping & auto-scaling
│   │   ├── Minimap.jsx             # Interactive spatial navigation radar
│   │   ├── Navbar.jsx              # Workspace tabs, studios, dropdowns & toolbar customizer
│   │   ├── InkLayer.jsx            # Freehand canvas markup & drawing layer
│   │   ├── LoopModal.jsx           # Autonomous loops configuration & control
│   │   ├── CodeStudioModal.jsx     # Repo browser & code pinner
│   │   ├── ComposerModal.jsx       # Fleet-wide prompt broadcast
│   │   ├── HandoffModal.jsx        # Agent-to-agent state handoff
│   │   ├── MissionMapDrawer.jsx    # Ambient fleet overview
│   │   ├── MemoryDrawer.jsx        # Project memory & injection
│   │   ├── QuotaAlarmModal.jsx     # Provider quota reset alarm configuration
│   │   ├── AgentConfigModal.jsx    # Agent order, visibility & custom agent creator
│   │   ├── FolderSelectModal.jsx   # Project working directory browser & switcher
│   │   ├── common/
│   │   │   ├── ContextMenu.jsx     # Universal right-click menu (canvas, nodes, sticky notes)
│   │   │   └── StickyNote.jsx      # Pinned draggable sticky note component
│   │   └── nodes/
│   │       ├── TerminalNode.jsx    # xterm.js PTY console with quick prompt & dictation
│   │       ├── GroupNode.jsx       # Fitted virtual screen & freeform subspace container
│   │       ├── WebTileNode.jsx     # Live browser viewport preview
│   │       ├── KanbanNode.jsx      # Task card columns
│   │       ├── NotesNode.jsx       # Markdown notes & checklists
│   │       ├── GitNode.jsx         # Live Git telemetry
│   │       ├── CodeNode.jsx        # Pinned syntax-highlighted code file
│   │       ├── DiagramNode.jsx     # Mermaid architecture studio
│   │       ├── DocumentNode.jsx    # Technical spec studio with PDF export
│   │       └── MarkdownVaultNode.jsx# Linked knowledge graph studio
└── dist/                           # Production-compiled client bundle
```

---

## License

ISC License. Built for local-first, developer-centric agent workflows.
