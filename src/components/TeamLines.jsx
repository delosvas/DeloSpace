import React from 'react';

const STATUS_COLOR = { working: '#34D399', needs_input: '#FBBF24' };

// Manager → worker curves, drawn in canvas coordinates between subspaces and cards.
export default function TeamLines({ nodes, onDisconnect }) {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const workers = nodes.filter(n => n.managerId && byId.has(n.managerId));
  if (!workers.length) return null;

  return (
    <svg className="absolute left-0 top-0 overflow-visible pointer-events-none" width="1" height="1">
      {workers.map(w => {
        const m = byId.get(w.managerId);
        const dx = (w.x + w.width / 2) - (m.x + m.width / 2);
        const dy = (w.y + w.height / 2) - (m.y + m.height / 2);
        // Leave from the side facing the worker: left/right when side by side, top/bottom when stacked
        const horizontal = Math.abs(dx) - (m.width + w.width) / 2 >= Math.abs(dy) - (m.height + w.height) / 2;
        let x1, y1, x2, y2, d;
        if (horizontal) {
          x1 = dx >= 0 ? m.x + m.width : m.x; y1 = m.y + m.height / 2;
          x2 = dx >= 0 ? w.x : w.x + w.width; y2 = w.y + w.height / 2;
          const bend = Math.max(60, Math.abs(x2 - x1) / 2) * Math.sign(dx || 1);
          d = `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`;
        } else {
          x1 = m.x + m.width / 2; y1 = dy >= 0 ? m.y + m.height : m.y;
          x2 = w.x + w.width / 2; y2 = dy >= 0 ? w.y : w.y + w.height;
          const bend = Math.max(60, Math.abs(y2 - y1) / 2) * Math.sign(dy || 1);
          d = `M${x1},${y1} C${x1},${y1 + bend} ${x2},${y2 - bend} ${x2},${y2}`;
        }
        const color = STATUS_COLOR[w.status] || '#8B7E72';
        const working = w.status === 'working';

        return (
          <g key={w.id} className="group">
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={working ? '10 8' : undefined}
              className="opacity-75 group-hover:opacity-100 transition-opacity"
            >
              {working && <animate attributeName="stroke-dashoffset" from="36" to="0" dur="0.8s" repeatCount="indefinite" />}
            </path>
            <circle cx={x1} cy={y1} r="4" fill="#FF8038" />
            <circle cx={x2} cy={y2} r="4" fill={color} />
            {/* Wide invisible stroke so the thin line is easy to hit */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth="16"
              className="pointer-events-auto cursor-pointer"
              onClick={() => onDisconnect(w.id)}
            >
              <title>{`${m.title} manages ${w.title}. Click to disconnect.`}</title>
            </path>
          </g>
        );
      })}
    </svg>
  );
}
