import React from 'react';

export default function Minimap({ 
  nodes = [], 
  canvasState, 
  onNavigate 
}) {
  const { panX, panY, zoom } = canvasState;

  // Compute bounding box of all nodes
  const mapWidth = 180;
  const mapHeight = 110;

  // Canvas bounds estimation
  const minX = Math.min(0, ...nodes.map(n => n.x));
  const maxX = Math.max(2000, ...nodes.map(n => n.x + n.width));
  const minY = Math.min(0, ...nodes.map(n => n.y));
  const maxY = Math.max(1400, ...nodes.map(n => n.y + n.height));

  const totalWidth = maxX - minX;
  const totalHeight = maxY - minY;

  const scaleX = mapWidth / totalWidth;
  const scaleY = mapHeight / totalHeight;

  // Viewport box
  const viewWidth = (window.innerWidth / zoom) * scaleX;
  const viewHeight = (window.innerHeight / zoom) * scaleY;
  const viewX = (-panX - minX) * scaleX;
  const viewY = (-panY - minY) * scaleY;

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetCanvasX = minX + clickX / scaleX;
    const targetCanvasY = minY + clickY / scaleY;

    onNavigate({
      panX: -targetCanvasX + window.innerWidth / (2 * zoom),
      panY: -targetCanvasY + window.innerHeight / (2 * zoom)
    });
  };

  return (
    <div 
      onClick={handleClick}
      className="sym-glass rounded-xl overflow-hidden border border-[rgba(241,233,221,0.12)] shadow-xl cursor-crosshair relative"
      style={{ width: mapWidth, height: mapHeight }}
      title="Canvas Minimap (click to jump)"
    >
      {/* Background dot grid preview */}
      <div className="absolute inset-0 bg-[#0B0908] opacity-90" />

      {/* Nodes on map */}
      {nodes.map(n => {
        const nx = (n.x - minX) * scaleX;
        const ny = (n.y - minY) * scaleY;
        const nw = Math.max(4, n.width * scaleX);
        const nh = Math.max(3, n.height * scaleY);

        let color = '#FF8038';
        if (n.type === 'webtile') color = '#3B82F6';
        if (n.type === 'kanban') color = '#F59E0B';
        if (n.type === 'notes') color = '#8B5CF6';
        if (n.type === 'git') color = '#EF4444';

        return (
          <div
            key={n.id}
            className="absolute rounded-sm border border-black/40"
            style={{
              left: nx,
              top: ny,
              width: nw,
              height: nh,
              backgroundColor: color,
              opacity: 0.75
            }}
          />
        );
      })}

      {/* Viewport rectangle */}
      <div
        className="absolute border border-white/80 bg-white/10 pointer-events-none rounded-sm shadow-sm"
        style={{
          left: Math.max(0, viewX),
          top: Math.max(0, viewY),
          width: Math.min(mapWidth, viewWidth),
          height: Math.min(mapHeight, viewHeight)
        }}
      />
    </div>
  );
}
