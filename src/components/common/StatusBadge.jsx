import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  if (status === 'working') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Working
      </span>
    );
  }

  if (status === 'needs_input') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse ${className}`}>
        <span className="h-2 w-2 rounded-full bg-amber-400"></span>
        Needs You
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#8B7E72]/15 text-[#CDC2B3] border border-[#8B7E72]/25 ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-[#8B7E72]"></span>
      Idle
    </span>
  );
}
