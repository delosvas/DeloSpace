import React, { useEffect, useState } from 'react';
import { GitBranch, GitCommit, RefreshCw, GitPullRequest, X, Maximize2, Minimize2 } from 'lucide-react';
import { fetchGitStatus } from '../../services/api';

export default function GitNode({ node, onClose, isMaximized, onToggleMaximize }) {
  const [gitData, setGitData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await fetchGitStatus(node.cwd);
      setGitData(data);
    } catch {
      setGitData({ isRepo: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [node.cwd]);

  return (
    <div className="flex flex-col h-full w-full sym-glass rounded-xl overflow-hidden shadow-2xl border border-[rgba(241,233,221,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[rgba(20,17,14,0.85)] border-b border-[rgba(241,233,221,0.08)]">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
            <GitBranch size={13} />
          </span>
          <span className="font-medium text-[13px] text-[#F1E9DD]">
            Git · {gitData?.branch || 'Repository'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={loadStatus}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#8B7E72] hover:text-[#CDC2B3] transition" 
            title="Refresh Git Status"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={onToggleMaximize}
            className="p-1.5 rounded hover:bg-[rgba(241,233,221,0.1)] text-[#8B7E72] hover:text-[#CDC2B3] transition" 
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button 
            onClick={() => onClose(node.id)}
            className="p-1.5 rounded hover:bg-rose-500/20 text-[#8B7E72] hover:text-rose-400 transition" 
            title="Close Card"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3.5 bg-[#0B0908] overflow-y-auto space-y-4">
        {gitData && gitData.isRepo ? (
          <>
            {/* Branch Summary */}
            <div className="flex items-center justify-between p-2.5 bg-[#14110E] border border-[rgba(241,233,221,0.08)] rounded-lg">
              <div className="flex items-center gap-2">
                <GitBranch size={14} className="text-[#FF8038]" />
                <span className="font-mono text-[13px] text-[#F1E9DD]">{gitData.branch}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-amber-400">+{gitData.added}</span>
                <span className="text-blue-400">~{gitData.modified}</span>
                <span className="text-rose-400">-{gitData.deleted}</span>
              </div>
            </div>

            {/* Changed Files */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#8B7E72] mb-1.5 flex items-center justify-between">
                <span>Working Changes</span>
                <span>{gitData.filesCount} files</span>
              </div>
              <div className="space-y-1 max-h-[160px] overflow-y-auto">
                {gitData.files && gitData.files.length > 0 ? (
                  gitData.files.map((file, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between py-1 px-2 rounded bg-[#14110E]/60 text-[12px] font-mono border border-[rgba(241,233,221,0.04)]"
                    >
                      <span className="text-[#CDC2B3] truncate mr-2">{file.path}</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-[rgba(241,233,221,0.1)] text-[#FF8038]">
                        {file.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[12px] text-[#8B7E72] italic p-2">Working tree clean</div>
                )}
              </div>
            </div>

            {/* Recent Commits */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#8B7E72] mb-1.5">
                Recent Commits
              </div>
              <div className="space-y-1.5">
                {gitData.commits && gitData.commits.map((c, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[12px]">
                    <GitCommit size={13} className="text-[#8B7E72] mt-0.5 flex-none" />
                    <span className="font-mono text-[#FF8038]">{c.hash}</span>
                    <span className="text-[#CDC2B3] truncate">{c.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-6 text-[#8B7E72] text-[13px]">
            {loading ? 'Checking git repository…' : 'No git repository detected in this workspace directory.'}
          </div>
        )}
      </div>
    </div>
  );
}
