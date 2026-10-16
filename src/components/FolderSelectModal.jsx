import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FolderGit2, 
  ArrowUp, 
  Check, 
  X, 
  Search, 
  HardDrive, 
  Compass, 
  ExternalLink,
  ChevronRight,
  Terminal,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { fetchFsShortcuts, validateFsPath, chooseFolderDialog, fetchFileTree } from '../services/api';

export default function FolderSelectModal({
  isOpen,
  onClose,
  currentCwd = '',
  onSelectCwd
}) {
  const [targetPath, setTargetPath] = useState(currentCwd || '');
  const [browserDir, setBrowserDir] = useState(currentCwd || '');
  const [items, setItems] = useState([]);
  const [parentDir, setParentDir] = useState(null);
  const [shortcuts, setShortcuts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pickingNative, setPickingNative] = useState(false);
  const [validation, setValidation] = useState({ valid: true, error: null });
  const [applyToActiveTerminals, setApplyToActiveTerminals] = useState(true);

  // Sync initial path when opening
  useEffect(() => {
    if (isOpen) {
      const init = currentCwd || '';
      setTargetPath(init);
      setBrowserDir(init);
      loadShortcuts();
      if (init) {
        loadDirectory(init);
        checkValidation(init);
      }
    }
  }, [isOpen, currentCwd]);

  const loadShortcuts = async () => {
    try {
      const data = await fetchFsShortcuts();
      if (data.shortcuts) {
        setShortcuts(data.shortcuts);
        if (!browserDir && data.home) {
          setBrowserDir(data.home);
          setTargetPath(data.home);
          loadDirectory(data.home);
        }
      }
    } catch (err) {
      console.warn('Failed to load shortcuts:', err);
    }
  };

  const loadDirectory = async (dir) => {
    setLoading(true);
    try {
      const data = await fetchFileTree(dir);
      if (data.success) {
        setBrowserDir(data.currentDir);
        setParentDir(data.parentDir);
        // Only show folders in the folder picker
        const foldersOnly = (data.items || []).filter(item => item.isDirectory);
        setItems(foldersOnly);
      }
    } catch (err) {
      console.error('Failed to load directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkValidation = async (pathToCheck) => {
    if (!pathToCheck || pathToCheck.trim() === '') {
      setValidation({ valid: false, error: 'Path cannot be empty' });
      return;
    }
    try {
      const res = await validateFsPath(pathToCheck.trim());
      if (res.valid) {
        setValidation({ valid: true, path: res.path, error: null });
      } else {
        setValidation({ valid: false, error: res.error || 'Invalid directory' });
      }
    } catch (err) {
      setValidation({ valid: false, error: 'Failed to validate path' });
    }
  };

  const handleNativeBrowse = async () => {
    setPickingNative(true);
    try {
      const res = await chooseFolderDialog();
      if (res.success && res.path) {
        setTargetPath(res.path);
        setBrowserDir(res.path);
        loadDirectory(res.path);
        checkValidation(res.path);
      }
    } catch (err) {
      console.error('Failed native picker:', err);
    } finally {
      setPickingNative(false);
    }
  };

  const handlePathChange = (val) => {
    setTargetPath(val);
    checkValidation(val);
  };

  const handleSelectShortcut = (shortcutPath) => {
    setTargetPath(shortcutPath);
    setBrowserDir(shortcutPath);
    loadDirectory(shortcutPath);
    checkValidation(shortcutPath);
  };

  const handleNavigateSubfolder = (folderPath) => {
    setTargetPath(folderPath);
    setBrowserDir(folderPath);
    loadDirectory(folderPath);
    checkValidation(folderPath);
  };

  const handleGoUp = () => {
    if (parentDir) {
      setTargetPath(parentDir);
      setBrowserDir(parentDir);
      loadDirectory(parentDir);
      checkValidation(parentDir);
    }
  };

  const handleConfirm = () => {
    const finalPath = validation.path || targetPath.trim();
    if (!finalPath) return;

    onSelectCwd(finalPath, applyToActiveTerminals);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#0D0B09] border border-[rgba(241,233,221,0.14)] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[rgba(241,233,221,0.08)] bg-[#14110E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF8038]/10 border border-[#FF8038]/20 flex items-center justify-center text-[#FF8038] shadow-inner">
              <FolderOpen size={20} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#F1E9DD] flex items-center gap-2">
                Project Working Directory
              </h2>
              <p className="text-[11px] text-[#8B7E72]">
                Choose any folder on your Mac. Claude Code, Codex, and new terminals will run here.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B7E72] hover:text-[#F1E9DD] hover:bg-[#1F1A16] transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Path Input & Finder Picker */}
        <div className="p-4 border-b border-[rgba(241,233,221,0.06)] bg-[#110E0C] space-y-2">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[#8B7E72] flex items-center justify-between">
            <span>Target Folder Path</span>
            {validation.valid ? (
              <span className="text-[#10B981] flex items-center gap-1 font-sans normal-case text-[11px]">
                <Check size={12} /> Directory verified
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1 font-sans normal-case text-[11px]">
                <AlertCircle size={12} /> {validation.error}
              </span>
            )}
          </label>

          <div className="flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <HardDrive size={14} className="absolute left-3 text-[#8B7E72]" />
              <input
                type="text"
                value={targetPath}
                onChange={(e) => handlePathChange(e.target.value)}
                placeholder="/Users/username/my-project or ~"
                className="w-full bg-[#181411] border border-[rgba(241,233,221,0.12)] focus:border-[#FF8038] text-[#F1E9DD] font-mono text-[12px] pl-9 pr-3 py-2 rounded-xl focus:outline-none transition"
              />
            </div>

            <button
              onClick={handleNativeBrowse}
              disabled={pickingNative}
              className="px-3.5 py-2 rounded-xl bg-[#1F1A16] hover:bg-[#2A231E] text-[#F1E9DD] text-[12px] font-medium border border-[rgba(241,233,221,0.14)] hover:border-[#FF8038]/50 flex items-center gap-2 transition flex-none disabled:opacity-50"
              title="Open native macOS Finder folder dialog"
            >
              {pickingNative ? (
                <>
                  <Loader2 size={13} className="animate-spin text-[#FF8038]" />
                  <span>Browsing…</span>
                </>
              ) : (
                <>
                  <Compass size={14} className="text-[#FF8038]" />
                  <span>Browse in Finder…</span>
                </>
              )}
            </button>
          </div>

          {/* Quick System Shortcuts */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] font-mono text-[#8B7E72] mr-1">Quick:</span>
            {shortcuts.map(s => (
              <button
                key={s.path}
                onClick={() => handleSelectShortcut(s.path)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition border ${
                  targetPath === s.path 
                    ? 'bg-[#FF8038]/15 border-[#FF8038]/40 text-[#FF8038]' 
                    : 'bg-[#181411] border-[rgba(241,233,221,0.06)] text-[#8B7E72] hover:text-[#CDC2B3] hover:border-[rgba(241,233,221,0.15)]'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Folder Browser */}
        <div className="flex-1 flex flex-col min-h-[220px] max-h-[340px] overflow-hidden bg-[#0A0908]">
          {/* Current Navigation Bar */}
          <div className="px-4 py-2 border-b border-[rgba(241,233,221,0.06)] bg-[#120F0D] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8B7E72] truncate max-w-[70%]">
              <Folder size={12} className="text-[#FF8038] flex-none" />
              <span className="truncate">{browserDir || '/'}</span>
            </div>

            <div className="flex items-center gap-1 flex-none">
              <button
                onClick={handleGoUp}
                disabled={!parentDir}
                className="px-2 py-1 rounded-lg text-[11px] font-mono text-[#8B7E72] hover:text-[#F1E9DD] hover:bg-[#1F1A16] border border-[rgba(241,233,221,0.06)] transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                title="Go up to parent directory"
              >
                <ArrowUp size={11} />
                <span>Up ..</span>
              </button>
            </div>
          </div>

          {/* Folder List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {loading ? (
              <div className="flex items-center justify-center h-36 text-[#8B7E72] font-mono text-xs gap-2">
                <Loader2 size={14} className="animate-spin text-[#FF8038]" />
                <span>Scanning folders…</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-36 text-[#8B7E72] text-xs gap-1">
                <FolderOpen size={24} className="text-[#8B7E72]/40" />
                <span>No subfolders found in this directory</span>
                <span className="text-[10px] text-[#8B7E72]/60 font-mono">You can still select this folder</span>
              </div>
            ) : (
              items.map((item) => {
                const isSelected = targetPath === item.path;
                return (
                  <div
                    key={item.path}
                    onClick={() => handlePathChange(item.path)}
                    onDoubleClick={() => handleNavigateSubfolder(item.path)}
                    className={`group px-3 py-2 rounded-xl flex items-center justify-between text-xs cursor-pointer transition select-none ${
                      isSelected 
                        ? 'bg-[#1F1A16] border border-[#FF8038]/30 text-[#F1E9DD]' 
                        : 'hover:bg-[#14110E] text-[#CDC2B3] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Folder size={15} className={`flex-none ${isSelected ? 'text-[#FF8038]' : 'text-[#8B7E72] group-hover:text-[#FF8038]'}`} />
                      <span className="font-mono text-[12px] truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1 flex-none opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateSubfolder(item.path);
                        }}
                        className="px-2 py-0.5 rounded bg-[#1F1A16] hover:bg-[#2A231E] text-[10px] font-mono text-[#8B7E72] hover:text-[#F1E9DD] border border-[rgba(241,233,221,0.08)] flex items-center gap-1"
                        title="Open subfolder"
                      >
                        <span>Open</span>
                        <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Terminal sync option */}
        <div className="px-4 py-3 border-t border-[rgba(241,233,221,0.06)] bg-[#120F0D] flex items-center gap-2.5">
          <input
            id="apply-terminals"
            type="checkbox"
            checked={applyToActiveTerminals}
            onChange={(e) => setApplyToActiveTerminals(e.target.checked)}
            className="w-4 h-4 rounded accent-[#FF8038] cursor-pointer"
          />
          <label htmlFor="apply-terminals" className="text-[12px] text-[#CDC2B3] cursor-pointer select-none flex items-center gap-1.5">
            <Terminal size={13} className="text-[#FF8038]" />
            <span>Switch directory in active open terminals (<code className="font-mono text-[#FF8038] text-[11px]">cd &quot;{targetPath.split('/').pop() || 'path'}&quot;</code>)</span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgba(241,233,221,0.08)] bg-[#14110E] flex items-center justify-between">
          <div className="text-[11px] font-mono text-[#8B7E72] truncate max-w-[50%]">
            Active: <span className="text-[#CDC2B3]">{currentCwd || '(none)'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-[#8B7E72] hover:text-[#F1E9DD] hover:bg-[#1F1A16] text-[12px] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!validation.valid}
              className="sym-btn-primary px-4 py-1.5 rounded-xl text-[12px] flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={14} />
              <span>Select Working Directory</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
