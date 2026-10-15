import React, { useState } from 'react';
import { Columns3, Plus, Trash2, ChevronRight, ChevronLeft, X, Maximize2, Minimize2 } from 'lucide-react';

export default function KanbanNode({ node, onUpdate, onClose, isMaximized, onToggleMaximize }) {
  const [columns, setColumns] = useState(node.data?.columns || [
    { id: 'todo', title: 'To Do', items: ['Implement feature', 'Run unit tests'] },
    { id: 'inprogress', title: 'In Progress', items: ['Refactor auth flow'] },
    { id: 'done', title: 'Done', items: ['Project initialization'] }
  ]);

  const [newItemText, setNewItemText] = useState('');
  const [activeColumnId, setActiveColumnId] = useState('todo');

  const updateColumns = (newCols) => {
    setColumns(newCols);
    onUpdate({
      ...node,
      data: { ...node.data, columns: newCols }
    });
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newCols = columns.map(col => {
      if (col.id === activeColumnId) {
        return { ...col, items: [...col.items, newItemText.trim()] };
      }
      return col;
    });

    updateColumns(newCols);
    setNewItemText('');
  };

  const handleDeleteItem = (colId, itemIndex) => {
    const newCols = columns.map(col => {
      if (col.id === colId) {
        return { ...col, items: col.items.filter((_, idx) => idx !== itemIndex) };
      }
      return col;
    });
    updateColumns(newCols);
  };

  const handleMoveItem = (fromColId, toColId, itemIndex) => {
    const fromCol = columns.find(c => c.id === fromColId);
    const item = fromCol.items[itemIndex];

    const newCols = columns.map(col => {
      if (col.id === fromColId) {
        return { ...col, items: col.items.filter((_, idx) => idx !== itemIndex) };
      }
      if (col.id === toColId) {
        return { ...col, items: [...col.items, item] };
      }
      return col;
    });

    updateColumns(newCols);
  };

  return (
    <div className="flex flex-col h-full w-full sym-glass rounded-xl overflow-hidden shadow-2xl border border-[rgba(241,233,221,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[rgba(20,17,14,0.85)] border-b border-[rgba(241,233,221,0.08)]">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
            <Columns3 size={13} />
          </span>
          <span className="font-medium text-[13px] text-[#F1E9DD]">
            {node.title || 'Kanban Board'}
          </span>
        </div>

        <div className="flex items-center gap-1">
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

      {/* Add Task Quick Bar */}
      <div className="p-2.5 bg-[#14110E] border-b border-[rgba(241,233,221,0.06)] flex items-center gap-2">
        <select
          value={activeColumnId}
          onChange={(e) => setActiveColumnId(e.target.value)}
          className="bg-[#0B0908] border border-[rgba(241,233,221,0.1)] rounded px-2 py-1 text-[12px] text-[#CDC2B3] focus:outline-none focus:border-[#FF8038]"
        >
          {columns.map(col => (
            <option key={col.id} value={col.id}>{col.title}</option>
          ))}
        </select>
        <form onSubmit={handleAddItem} className="flex-1 flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add task to column…"
            className="flex-1 bg-[#0B0908] border border-[rgba(241,233,221,0.1)] rounded px-2.5 py-1 text-[12px] text-[#F1E9DD] placeholder-[#8B7E72] focus:outline-none focus:border-[#FF8038]"
          />
          <button
            type="submit"
            disabled={!newItemText.trim()}
            className="sym-btn-primary px-2.5 py-1 rounded text-[12px] flex items-center gap-1 disabled:opacity-40"
          >
            <Plus size={13} />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Columns Container */}
      <div className="flex-1 p-3 overflow-x-auto flex gap-3 bg-[#0B0908]/50">
        {columns.map((col, colIdx) => (
          <div 
            key={col.id} 
            className="flex-1 min-w-[180px] bg-[#14110E]/90 border border-[rgba(241,233,221,0.08)] rounded-lg flex flex-col overflow-hidden"
          >
            {/* Column Header */}
            <div className="px-3 py-2 bg-[rgba(28,23,19,0.7)] border-b border-[rgba(241,233,221,0.06)] flex items-center justify-between">
              <span className="font-semibold text-[12px] text-[#CDC2B3] uppercase tracking-wider">
                {col.title}
              </span>
              <span className="text-[11px] font-mono text-[#8B7E72] bg-[#0A0908] px-1.5 py-0.5 rounded">
                {col.items.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[380px]">
              {col.items.map((item, itemIdx) => (
                <div 
                  key={itemIdx}
                  className="p-2.5 bg-[#1F1A16] border border-[rgba(241,233,221,0.09)] rounded-md shadow-sm group hover:border-[#FF8038]/40 transition"
                >
                  <p className="text-[13px] text-[#F1E9DD] leading-relaxed break-words">
                    {item}
                  </p>
                  
                  {/* Card Actions */}
                  <div className="mt-2 pt-2 border-t border-[rgba(241,233,221,0.05)] flex items-center justify-between text-[#8B7E72]">
                    <div className="flex items-center gap-1">
                      {colIdx > 0 && (
                        <button 
                          onClick={() => handleMoveItem(col.id, columns[colIdx - 1].id, itemIdx)}
                          className="p-0.5 hover:text-[#CDC2B3]"
                          title="Move Left"
                        >
                          <ChevronLeft size={13} />
                        </button>
                      )}
                      {colIdx < columns.length - 1 && (
                        <button 
                          onClick={() => handleMoveItem(col.id, columns[colIdx + 1].id, itemIdx)}
                          className="p-0.5 hover:text-[#CDC2B3]"
                          title="Move Right"
                        >
                          <ChevronRight size={13} />
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteItem(col.id, itemIdx)}
                      className="p-0.5 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition"
                      title="Delete card"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {col.items.length === 0 && (
                <div className="p-4 text-center text-[#8B7E72] text-[11px] italic">
                  Empty column
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
