import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { 
  SquareTerminal, 
  Play, 
  Send, 
  Mic, 
  MicOff, 
  RotateCcw, 
  ArrowRightLeft, 
  X, 
  Maximize2, 
  Minimize2,
  FolderGit2,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { spawnTerminal, signalTerminal, createTerminalWebSocket } from '../../services/api';

const AGENT_CONFIGS = {
  claude: { name: 'Claude Code', color: '#D97706', bg: 'rgba(217, 119, 6, 0.15)', border: 'rgba(217, 119, 6, 0.4)' },
  codex: { name: 'Codex', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
  gemini: { name: 'Gemini CLI', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)' },
  opencode: { name: 'OpenCode', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.4)' },
  aider: { name: 'Aider', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)' },
  zsh: { name: 'zsh', color: '#FF8038', bg: 'rgba(255, 128, 56, 0.15)', border: 'rgba(255, 128, 56, 0.4)' }
};

export default function TerminalNode({ 
  node, 
  onUpdate, 
  onClose, 
  onHandoff,
  onDuplicate,
  isMaximized, 
  onToggleMaximize 
}) {
  const terminalRef = useRef(null);
  const termInstanceRef = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);

  const [promptText, setPromptText] = useState('');
  const [status, setStatus] = useState(node.status || 'idle');
  const [profile, setProfile] = useState(node.profile || 'default');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const agentConfig = AGENT_CONFIGS[node.agentType] || AGENT_CONFIGS.zsh;

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: 'JetBrains Mono, ui-monospace, Menlo, monospace',
      lineHeight: 1.25,
      theme: {
        background: '#0B0908',
        foreground: '#F1E9DD',
        cursor: '#FF8038',
        cursorAccent: '#0B0908',
        selectionBackground: 'rgba(255, 128, 56, 0.35)',
        black: '#14110E',
        red: '#EF4444',
        green: '#10B981',
        yellow: '#F59E0B',
        blue: '#3B82F6',
        magenta: '#EC4899',
        cyan: '#06B6D4',
        white: '#F1E9DD',
        brightBlack: '#6B7280',
        brightRed: '#F87171',
        brightGreen: '#34D399',
        brightYellow: '#FBBF24',
        brightBlue: '#60A5FA',
        brightMagenta: '#F472B6',
        brightCyan: '#22D3EE',
        brightWhite: '#FFFFFF'
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(terminalRef.current);
    fitAddon.fit();

    termInstanceRef.current = term;
    fitAddonRef.current = fitAddon;

    // Spawn backend PTY
    spawnTerminal({
      id: node.id,
      command: node.command || '',
      agentType: node.agentType || 'zsh',
      title: node.title,
      cwd: node.cwd,
      profile,
      cols: term.cols,
      rows: term.rows
    }).then(() => {
      // Connect WebSocket
      const ws = createTerminalWebSocket(node.id);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send initial resize
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'output') {
            term.write(msg.data);
          } else if (msg.type === 'history') {
            term.write(msg.data);
          } else if (msg.type === 'status') {
            setStatus(msg.status);
            onUpdate({ ...node, status: msg.status });
          }
        } catch {
          term.write(event.data);
        }
      };

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data }));
        }
      });
    });

    const handleResize = () => {
      if (fitAddonRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        fitAddonRef.current.fit();
        wsRef.current.send(JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows
        }));
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      if (wsRef.current) wsRef.current.close();
      term.dispose();
    };
  }, [node.id, profile]);

  // Voice dictation using browser Web Speech API
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setPromptText(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const handleSendPrompt = (e) => {
    e?.preventDefault();
    if (!promptText.trim() || !wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'input',
      data: `${promptText}\n`
    }));
    setPromptText('');
  };

  const handleSendInterrupt = () => {
    signalTerminal(node.id, 'SIGINT');
  };

  const handleClear = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'input', data: 'clear\n' }));
    }
  };

  return (
    <div className="flex flex-col h-full w-full sym-glass rounded-xl overflow-hidden shadow-2xl border border-[rgba(241,233,221,0.12)]">
      {/* Node Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[rgba(20,17,14,0.85)] border-b border-[rgba(241,233,221,0.08)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span 
            className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase"
            style={{ 
              backgroundColor: agentConfig.bg, 
              color: agentConfig.color, 
              border: `1px solid ${agentConfig.border}` 
            }}
          >
            {agentConfig.name}
          </span>
          <span className="font-medium text-[13px] text-[#F1E9DD] truncate max-w-[200px]" title={node.title}>
            {node.title}
          </span>
          <StatusBadge status={status} />
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          {/* Profile selector for multi-accounts */}
          <select 
            value={profile} 
            onChange={(e) => setProfile(e.target.value)}
            className="bg-[rgba(241,233,221,0.05)] border border-[rgba(241,233,221,0.12)] rounded px-1.5 py-0.5 text-[11px] text-[#CDC2B3] focus:outline-none focus:border-[#FF8038]"
            title="Profile Isolation (separate accounts side-by-side)"
          >
            <option value="default">Profile: Default</option>
            <option value="work">Profile: Work</option>
            <option value="personal">Profile: Personal</option>
          </select>

          {/* Interrupt Ctrl+C */}
          <button 
            onClick={handleSendInterrupt}
            className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400/80 hover:text-rose-400 transition" 
            title="Send Ctrl+C (Interrupt)"
          >
            <ShieldAlert size={14} />
          </button>

          {/* Handoff to another agent */}
          <button 
            onClick={() => onHandoff(node)}
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#CDC2B3] hover:text-[#F1E9DD] transition flex items-center gap-1 text-[11px]" 
            title="Hand off context to another agent"
          >
            <ArrowRightLeft size={13} />
            <span className="hidden sm:inline">Handoff</span>
          </button>

          {/* Clear screen */}
          <button 
            onClick={handleClear}
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#8B7E72] hover:text-[#CDC2B3] transition" 
            title="Clear Terminal"
          >
            <RotateCcw size={13} />
          </button>

          {/* Maximize */}
          <button 
            onClick={onToggleMaximize}
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#8B7E72] hover:text-[#CDC2B3] transition" 
            title={isMaximized ? "Restore view" : "Maximize node"}
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Close */}
          <button 
            onClick={() => onClose(node.id)}
            className="p-1.5 rounded hover:bg-rose-500/20 text-[#8B7E72] hover:text-rose-400 transition" 
            title="Kill console"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div 
        ref={terminalRef} 
        className="flex-1 w-full bg-[#0B0908] overflow-hidden p-1 relative" 
      />

      {/* Bottom Prompt Bar & Quick Directive */}
      <div className="p-2.5 bg-[rgba(20,17,14,0.92)] border-t border-[rgba(241,233,221,0.08)]">
        <form onSubmit={handleSendPrompt} className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <input 
              type="text" 
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={`Send instruction to ${agentConfig.name}… (e.g. 'run tests and fix failures')`}
              className="w-full bg-[#14110E] border border-[rgba(241,233,221,0.12)] rounded-lg pl-3 pr-9 py-1.5 text-[13px] text-[#F1E9DD] placeholder-[#8B7E72] focus:outline-none focus:border-[#FF8038] focus:ring-1 focus:ring-[#FF8038]/50"
            />
            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`absolute right-2 p-1 rounded-md transition ${isRecording ? 'text-[#FF6B3D] animate-pulse bg-[#FF6B3D]/10' : 'text-[#8B7E72] hover:text-[#CDC2B3]'}`}
              title={isRecording ? "Stop dictation" : "Dictate prompt (on-device speech)"}
            >
              {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
          </div>

          <button 
            type="submit"
            disabled={!promptText.trim()}
            className="sym-btn-primary px-3 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send size={13} />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
