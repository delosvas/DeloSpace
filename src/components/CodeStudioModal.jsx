import React, { useState, useEffect } from 'react';
import { Folder, File, Pin, X, ChevronRight, ChevronDown, FolderOpen, RefreshCw } from 'lucide-react';
import { fetchFileTree, fetchFileContent } from '../services/api';

export default function CodeStudioModal({ 
  isOpen, 
  onClose, 
  rootPath = '', 
  onPinFile 
}) {
  const [currentDir, setCurrentDir] = useState(rootPath || '');
  const [items, setItems] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);

  const loadTree = async (dir) => {
    setLoading(true);
    try {
      const res = await fetchFileTree(dir);
      if (res.success) {
        setItems(res.items);
        setCurrentDir(res.currentDir);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTree(rootPath);
    }
  }, [isOpen, rootPath]);

  const handleSelectFile = async (item) => {
    if (item.isDirectory) {
      loadTree(item.path);
    } else {
      setSelectedFile(item);
      const res = await fetchFileContent(item.path);
      if (res.success) {
        setFileContent(res.content);
      }
    }
  };

  const handleGoUp = () => {
    const parent = currentDir.split('/').slice(0, -1).join('/') || '/';
    loadTree(parent);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl h-[80vh] sym-glass rounded-2xl overflow-hidden border border-[rgba(241,233,221,0.15)] shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[rgba(20,17,14,0.9)] border-b border-[rgba(241,233,221,0.1)]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40">
              <FolderOpen size={16} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#F1E9DD]">
                Code Studio · Repository Browser
              </h2>
              <p className="text-[12px] text-[#8B7E72] font-mono truncate max-w-lg">
                {currentDir}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-[#8B7E72] hover:text-[#F1E9DD] hover:bg-[rgba(241,233,221,0.1)] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Studio Content Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Tree Left Pane */}
          <div className="w-72 bg-[#100D0B] border-r border-[rgba(241,233,221,0.08)] flex flex-col">
            <div className="p-2 border-b border-[rgba(241,233,221,0.06)] flex items-center justify-between text-[11px] text-[#8B7E72]">
              <button 
                onClick={handleGoUp}
                className="hover:text-[#F1E9DD] px-1 py-0.5 rounded hover:bg-white/5 transition flex items-center gap-1"
              >
                <span>.. (Up Directory)</span>
              </button>
              <button 
                onClick={() => loadTree(currentDir)}
                className="hover:text-[#F1E9DD] p-1 rounded hover:bg-white/5"
                title="Refresh Tree"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 font-mono text-[12px]">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectFile(item)}
                  className={`w-full text-left px-2 py-1 rounded-md flex items-center gap-2 truncate transition ${
                    selectedFile?.path === item.path
                      ? 'bg-[#FF8038]/20 text-[#FF8038] border border-[#FF8038]/30'
                      : 'text-[#CDC2B3] hover:bg-white/5'
                  }`}
                >
                  {item.isDirectory ? (
                    <Folder size={14} className="text-[#FF8038] flex-none" />
                  ) : (
                    <File size={14} className="text-[#8B7E72] flex-none" />
                  )}
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
              {items.length === 0 && (
                <div className="p-4 text-center text-[#8B7E72] text-[11px] italic">
                  No files found in folder
                </div>
              )}
            </div>
          </div>

          {/* Code Preview Right Pane */}
          <div className="flex-1 flex flex-col bg-[#0B0908] overflow-hidden">
            {selectedFile ? (
              <>
                <div className="px-4 py-2 bg-[#14110E] border-b border-[rgba(241,233,221,0.08)] flex items-center justify-between">
                  <div className="font-mono text-[12px] text-[#F1E9DD] truncate">
                    {selectedFile.path}
                  </div>
                  <button
                    onClick={() => {
                      onPinFile(selectedFile.path, fileContent);
                      onClose();
                    }}
                    className="sym-btn-primary px-3 py-1 rounded-lg text-[12px] flex items-center gap-1.5"
                    title="Pin this code file onto the visual canvas"
                  >
                    <Pin size={13} />
                    <span>Pin to Canvas</span>
                  </button>
                </div>

                <div className="flex-1 p-4 overflow-auto font-mono text-[12px] text-[#CDC2B3] leading-relaxed whitespace-pre">
                  {fileContent}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[#8B7E72] p-8 text-center space-y-2">
                <File size={36} className="opacity-30" />
                <p className="text-sm">Select a file from the repository to preview and pin to the board.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
