import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MarkdownEditor, { renderMarkdown } from './MarkdownEditor';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';

const LANGS = {
  javascript: { label: 'JavaScript', ext: javascript },
  python: { label: 'Python', ext: python },
  java: { label: 'Java', ext: java },
  cpp: { label: 'C++', ext: cpp },
};

const STYLES = `
.notes-view {
  height: 100%;
  display: flex;
  min-height: 0;
  color: var(--text);
}

/* ── Sidebar ── */
.notes-sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition: opacity 0.2s ease;
  overflow: hidden;
}
.notes-sidebar.collapsed {
  width: 0 !important;
  min-width: 0;
  overflow: hidden;
  opacity: 0;
  border-right: none;
}

.notes-sidebar-header {
  padding: 12px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.notes-sidebar-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.notes-sidebar-title {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.notes-sidebar-hint {
  font-size: 0.65rem;
  color: var(--text-muted);
}
.notes-add-actions {
  display: flex;
  gap: 6px;
}

.notes-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 10px;
  border-radius: 7px;
  font-size: 0.72rem;
  font-weight: 600;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.notes-btn:hover {
  border-color: var(--accent);
  color: var(--accent-light);
}
.notes-btn.primary {
  background: rgba(124,92,252,0.14);
  border-color: rgba(124,92,252,0.3);
}

.notes-sidebar-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 6px 14px;
}

/* ── Tree ── */
.notes-tree-node { display: flex; flex-direction: column; }

.notes-tree-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 28px;
  padding: 2px 6px;
  border-radius: 5px;
  cursor: default;
  transition: background 0.12s, border-color 0.12s;
  border: 1px solid transparent;
}
.notes-tree-row::before {
  content: '';
  position: absolute;
  left: 0; top: 4px; bottom: 4px;
  width: 3px;
  border-radius: 999px;
  background: transparent;
  transition: background 0.12s;
}
.notes-tree-row:hover { background: rgba(255,255,255,0.04); }
.notes-tree-row.active { background: rgba(124,92,252,0.12); }
.notes-tree-row.active::before { background: var(--accent); }

/* Drag & drop states */
.notes-tree-row.dragging { opacity: 0.4; }
.notes-tree-row.drag-over {
  border-color: var(--accent);
  background: rgba(124,92,252,0.1);
}
.notes-drop-bar {
  height: 2px;
  margin: 0 8px;
  border-radius: 2px;
  background: transparent;
  transition: background 0.1s;
}
.notes-drop-bar.active {
  background: var(--accent);
}

.notes-tree-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
}
.notes-tree-toggle {
  width: 14px; height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 0;
  cursor: pointer;
  font-size: 0.55rem;
  transition: transform 0.15s;
  flex-shrink: 0;
}
.notes-tree-toggle:hover { color: var(--text); }
.notes-tree-icon { width: 14px; text-align: center; font-size: 0.72rem; flex-shrink: 0; }
.notes-tree-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.74rem;
}
.notes-tree-label.muted { color: var(--text-muted); font-style: italic; }
.notes-tree-label-btn { all: unset; flex: 1; min-width: 0; cursor: pointer; }
.notes-tree-input {
  width: 100%;
  border: 1px solid rgba(124,92,252,0.45);
  background: rgba(124,92,252,0.08);
  color: var(--text);
  border-radius: 5px;
  padding: 3px 6px;
  font: inherit;
  font-size: 0.78rem;
  outline: none;
}

.notes-tree-actions {
  display: inline-flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.12s;
  flex-shrink: 0;
}
.notes-tree-row:hover .notes-tree-actions,
.notes-tree-actions.menu-open { opacity: 1; }

.notes-tree-action {
  width: 18px; height: 18px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.6rem;
  padding: 0;
  transition: all 0.12s;
}
.notes-tree-action:hover {
  background: var(--surface2);
  color: var(--accent-light);
}
.notes-tree-action.delete:hover {
  color: #ff9d9d;
  background: rgba(255,123,123,0.1);
}

/* Context menu */
.notes-ctx-menu {
  position: fixed;
  z-index: 1000;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 4px 0;
  min-width: 130px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
}
.notes-ctx-item {
  display: block;
  width: 100%;
  padding: 5px 12px;
  border: none;
  background: none;
  color: var(--text);
  font-size: 0.72rem;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
}
.notes-ctx-item:hover {
  background: rgba(124,92,252,0.12);
}
.notes-ctx-item.delete:hover {
  background: rgba(255,123,123,0.1);
  color: #ff9d9d;
}
.notes-ctx-sep {
  height: 1px;
  background: var(--border);
  margin: 3px 8px;
}

.notes-tree-children {
  display: grid;
  grid-template-rows: 1fr;
  overflow: hidden;
  transition: grid-template-rows 0.2s ease;
}
.notes-tree-children.collapsed { grid-template-rows: 0fr; }
.notes-tree-children-inner { min-height: 0; overflow: hidden; }

/* ── Editor area ── */
.notes-resize-handle {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
  flex-shrink: 0;
  position: relative;
}
.notes-resize-handle:hover,
.notes-resize-handle.dragging {
  background: var(--accent);
}
.notes-resize-handle::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  left: -4px; right: -4px;
}

.notes-editor {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.notes-editor-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.notes-sidebar-toggle {
  width: 28px; height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  transition: all 0.12s;
  flex-shrink: 0;
}
.notes-sidebar-toggle:hover {
  border-color: var(--accent);
  color: var(--text);
}
.notes-note-title-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  padding: 0;
}
.notes-note-title-input::placeholder { color: var(--text-muted); }

.notes-pane-toggles {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.notes-pane-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.64rem;
  font-weight: 600;
  font-family: inherit;
  white-space: nowrap;
  transition: all 0.15s;
  user-select: none;
}
.notes-pane-pill:hover { border-color: var(--accent); color: var(--text); }
.notes-pane-pill.active {
  background: rgba(124,92,252,0.15);
  border-color: var(--accent);
  color: var(--accent-light);
}
.notes-pill-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: background 0.15s;
}
.notes-pane-pill.active .notes-pill-dot {
  background: var(--accent-light);
  box-shadow: 0 0 6px rgba(124,92,252,0.5);
}

.notes-editor-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.notes-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
.notes-pane.note-pane { border-right: 1px solid var(--border); }

.notes-pane-label {
  padding: 6px 14px;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.notes-pane-close {
  width: 18px; height: 18px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
.notes-pane-close:hover { color: var(--text); background: var(--surface2); }

.notes-empty-state, .notes-editor-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.notes-empty-card, .notes-editor-empty-card {
  width: min(380px, 100%);
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px 20px;
}
.notes-empty-card h3, .notes-editor-empty-card h3 { margin: 0 0 6px; font-size: 0.95rem; }
.notes-empty-card p, .notes-editor-empty-card p { margin: 0; color: var(--text-muted); font-size: 0.82rem; }
.notes-empty-actions { margin-top: 14px; display: flex; justify-content: center; gap: 8px; }

.notes-footer-meta {
  padding: 4px 14px;
  font-size: 0.62rem;
  color: var(--text-muted);
  border-top: 1px solid var(--border);
}
.notes-code-lang {
  padding: 2px 6px;
  font-size: 0.62rem;
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 4px;
  cursor: pointer;
  outline: none;
}
.notes-code-lang:hover { border-color: var(--accent); }
.notes-code-pane .cm-editor { height: 100%; }
.notes-code-pane .cm-scroller { overflow: auto; }
`;

function formatTimestamp(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `Updated ${d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
}

export default function NotesView({ notes = [], onAddNote, onAddFolder, onUpdateNote, onDeleteNote, prefs = {}, onPrefsChange }) {
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(() => new Set());
  const [showCode, setShowCode] = useState(prefs.showCode ?? false);
  const [showPreview, setShowPreview] = useState(prefs.showPreview ?? false);
  const [sidebarOpen, setSidebarOpen] = useState(prefs.sidebarOpen ?? true);
  const [sidebarWidth, setSidebarWidth] = useState(prefs.sidebarWidth ?? 240);
  const [isResizing, setIsResizing] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { id, x, y } or null
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'before' | 'inside' | 'after'
  const treeInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const prevIdsRef = useRef(new Set());

  // Persist toggle/sidebar changes to prefs
  const persistPrefs = useCallback((patch) => {
    onPrefsChange?.(patch);
  }, [onPrefsChange]);

  // Derived
  const itemsById = useMemo(() => Object.fromEntries(notes.map(n => [n.id, n])), [notes]);

  const childMap = useMemo(() => {
    const map = new Map();
    for (const item of notes) {
      const key = item.parentId ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    // Sort children by sortOrder (fallback to createdAt for legacy items)
    for (const [, children] of map) {
      children.sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity) || (a.createdAt || '').localeCompare(b.createdAt || ''));
    }
    return map;
  }, [notes]);

  const noteItems = useMemo(() => notes.filter(n => n.type === 'note'), [notes]);
  const selectedNote = useMemo(() => notes.find(n => n.id === selectedNoteId && n.type === 'note') ?? null, [notes, selectedNoteId]);

  // Auto-expand new items
  useEffect(() => {
    const prev = prevIdsRef.current;
    const added = notes.filter(n => !prev.has(n.id));
    if (added.length) {
      setExpandedFolders(s => {
        const next = new Set(s);
        for (const n of notes) if (n.type === 'folder') next.add(n.id);
        return next;
      });
      const addedNote = added.find(n => n.type === 'note');
      const addedFolder = added.find(n => n.type === 'folder');
      if (addedNote) {
        setSelectedNoteId(addedNote.id);
        setTimeout(() => titleInputRef.current?.focus(), 50);
      } else if (addedFolder) {
        setEditingId(addedFolder.id);
        setDraftTitle(addedFolder.title || '');
      }
    }
    prevIdsRef.current = new Set(notes.map(n => n.id));
  }, [notes]);

  // Auto-expand all folders on first load
  useEffect(() => {
    setExpandedFolders(new Set(notes.filter(n => n.type === 'folder').map(n => n.id)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (editingId) { treeInputRef.current?.focus(); treeInputRef.current?.select(); } }, [editingId]);

  // Fix selectedNote if deleted
  useEffect(() => {
    if (selectedNoteId && !notes.find(n => n.id === selectedNoteId)) {
      setSelectedNoteId(noteItems[0]?.id ?? null);
    }
  }, [notes, noteItems, selectedNoteId]);

  const commitRename = useCallback((item) => {
    const t = draftTitle.trim();
    setEditingId(null);
    if (t !== (item.title || '')) onUpdateNote?.({ ...item, title: t, updatedAt: new Date().toISOString() });
  }, [draftTitle, onUpdateNote]);

  const handleUpdateField = useCallback((field, value) => {
    if (!selectedNote) return;
    onUpdateNote?.({ ...selectedNote, [field]: value, updatedAt: new Date().toISOString() });
  }, [selectedNote, onUpdateNote]);

  // ── Close context menu on outside click ──
  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e) => {
      if (e.target.closest('.notes-ctx-menu')) return;
      setContextMenu(null);
    };
    const id = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handler);
    });
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [contextMenu]);

  // ── Sidebar resize ──
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev) => {
      const newW = Math.max(160, Math.min(450, startW + ev.clientX - startX));
      setSidebarWidth(newW);
    };
    const onUp = () => {
      setIsResizing(false);
      // Persist final width
      const el = document.querySelector('.notes-sidebar');
      if (el) persistPrefs({ sidebarWidth: parseInt(el.style.width) || sidebarWidth });
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarWidth, persistPrefs]);

  // ── Drag helpers ──
  const getDescendantIds = useCallback((id) => {
    const ids = new Set();
    const collect = (pid) => {
      for (const c of (childMap.get(pid) || [])) { ids.add(c.id); if (c.type === 'folder') collect(c.id); }
    };
    collect(id);
    return ids;
  }, [childMap]);

  const handleDragStart = useCallback((e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragOver = useCallback((e, targetId, position) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(targetId);
    setDropPosition(position);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
    setDropPosition(null);
  }, []);

  const handleDrop = useCallback((e, targetId, position) => {
    e.preventDefault();
    setDragOverId(null);
    setDropPosition(null);
    const sourceId = dragId;
    setDragId(null);
    if (!sourceId || sourceId === targetId) return;
    const source = itemsById[sourceId];
    const target = itemsById[targetId];
    if (!source || !target) return;

    // Can't drop into own descendant
    const descendants = getDescendantIds(sourceId);
    if (descendants.has(targetId)) return;

    if (position === 'inside' && target.type === 'folder') {
      // Move into folder — append at end
      const siblings = childMap.get(target.id) || [];
      const maxOrder = siblings.reduce((m, s) => Math.max(m, s.sortOrder ?? 0), 0);
      onUpdateNote?.({ ...source, parentId: target.id, sortOrder: maxOrder + 1, updatedAt: new Date().toISOString() });
      setExpandedFolders(s => { const n = new Set(s); n.add(target.id); return n; });
    } else {
      // Move before or after target — reorder siblings
      const newParentId = target.parentId ?? null;
      const siblings = (childMap.get(newParentId) || []).filter(s => s.id !== sourceId);
      const targetIdx = siblings.findIndex(s => s.id === targetId);
      const insertIdx = position === 'before' ? targetIdx : targetIdx + 1;
      siblings.splice(insertIdx, 0, source);
      // Reassign sortOrder for all siblings
      const now = new Date().toISOString();
      siblings.forEach((s, i) => {
        const updated = { ...s, parentId: newParentId, sortOrder: i, updatedAt: now };
        onUpdateNote?.(updated);
      });
    }
  }, [dragId, itemsById, childMap, getDescendantIds, onUpdateNote]);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDragOverId(null);
    setDropPosition(null);
  }, []);

  // ── Render tree ──
  const renderTree = useCallback((parentId = null, depth = 0) => {
    const items = childMap.get(parentId) || [];
    return items.map((item) => {
      const isFolder = item.type === 'folder';
      const isExpanded = isFolder && expandedFolders.has(item.id);
      const children = isFolder ? childMap.get(item.id) || [] : [];
      const isEditing = editingId === item.id;
      const isActive = selectedNoteId === item.id;
      const isDragging = dragId === item.id;
      const isDragOver = dragOverId === item.id && dropPosition === 'inside';
      const pl = 8 + depth * 16;

      return (
        <div className="notes-tree-node" key={item.id}>
          {/* Drop bar above */}
          <div
            className={`notes-drop-bar${dragOverId === item.id && dropPosition === 'before' ? ' active' : ''}`}
            onDragOver={(e) => handleDragOver(e, item.id, 'before')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id, 'before')}
          />

          <div
            className={`notes-tree-row${isActive ? ' active' : ''}${isDragging ? ' dragging' : ''}${isDragOver ? ' drag-over' : ''}`}
            style={{ paddingLeft: pl }}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => isFolder ? handleDragOver(e, item.id, 'inside') : handleDragOver(e, item.id, 'after')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => isFolder ? handleDrop(e, item.id, 'inside') : handleDrop(e, item.id, 'after')}
            onDoubleClick={() => { setEditingId(item.id); setDraftTitle(item.title || ''); }}
          >
            <div className="notes-tree-main">
              {isFolder ? (
                <button type="button" className="notes-tree-toggle" onClick={() => setExpandedFolders(s => { const n = new Set(s); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n; })}>
                  {isExpanded ? '▼' : '▶'}
                </button>
              ) : <span className="notes-tree-toggle" />}

              <span className="notes-tree-icon">{isFolder ? (isExpanded ? '📂' : '📁') : '📄'}</span>

              {isEditing ? (
                <input
                  ref={treeInputRef}
                  className="notes-tree-input"
                  value={draftTitle}
                  onChange={e => setDraftTitle(e.target.value)}
                  onBlur={() => commitRename(item)}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(item); if (e.key === 'Escape') setEditingId(null); }}
                  placeholder={isFolder ? 'Folder name' : 'Note name'}
                />
              ) : (
                <button type="button" className="notes-tree-label-btn" onClick={() => isFolder ? setExpandedFolders(s => { const n = new Set(s); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n; }) : setSelectedNoteId(item.id)}>
                  <span className={`notes-tree-label${!(item.title || '').trim() ? ' muted' : ''}`}>
                    {(item.title || '').trim() || (isFolder ? 'Untitled folder' : 'Untitled')}
                  </span>
                </button>
              )}
            </div>

            <div className={`notes-tree-actions${contextMenu?.id === item.id ? ' menu-open' : ''}`}>
              <button type="button" className="notes-tree-action" onClick={(e) => {
                e.stopPropagation();
                if (contextMenu?.id === item.id) {
                  setContextMenu(null);
                } else {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setContextMenu({ id: item.id, x: rect.right, y: rect.bottom + 2 });
                }
              }} title="Actions">⋯</button>
            </div>
          </div>

          {isFolder && children.length > 0 && (
            <div className={`notes-tree-children${isExpanded ? '' : ' collapsed'}`}>
              <div className="notes-tree-children-inner">
                {renderTree(item.id, depth + 1)}
              </div>
            </div>
          )}

          {/* Drop bar below */}
          <div
            className={`notes-drop-bar${dragOverId === item.id && dropPosition === 'after' ? ' active' : ''}`}
            onDragOver={(e) => handleDragOver(e, item.id, 'after')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id, 'after')}
          />
        </div>
      );
    });
  }, [childMap, expandedFolders, editingId, selectedNoteId, dragId, dragOverId, dropPosition, draftTitle, contextMenu, commitRename, handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop, onAddNote, onAddFolder, onDeleteNote]);

  // ── Empty state ──
  if (!notes.length) {
    return (
      <div className="notes-view">
        <style>{STYLES}</style>
        <div className="notes-empty-state">
          <div className="notes-empty-card">
            <h3>📝 Start Your Knowledge Base</h3>
            <p>Create notes, organize in folders, and build your second brain.</p>
            <div className="notes-empty-actions">
              <button type="button" className="notes-btn" onClick={() => onAddFolder?.(null)}>📁 Folder</button>
              <button type="button" className="notes-btn primary" onClick={() => onAddNote?.(null)}>📄 Note</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-view">
      <style>{STYLES}</style>

      {/* Context menu rendered at top level to avoid overflow clipping */}
      {contextMenu && (() => {
        const item = notes.find(n => n.id === contextMenu.id);
        if (!item) return null;
        const isFolder = item.type === 'folder';
        return (
          <div className="notes-ctx-menu" style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, right: 'auto' }} onClick={e => e.stopPropagation()}>
            {isFolder && (
              <>
                <button className="notes-ctx-item" onClick={() => { onAddNote?.(item.id); setContextMenu(null); }}>📄 Add Note</button>
                <button className="notes-ctx-item" onClick={() => { onAddFolder?.(item.id); setContextMenu(null); }}>📁 Add Folder</button>
                <div className="notes-ctx-sep" />
              </>
            )}
            <button className="notes-ctx-item" onClick={() => { setEditingId(item.id); setDraftTitle(item.title || ''); setContextMenu(null); }}>✏️ Rename</button>
            <button className="notes-ctx-item delete" onClick={() => { onDeleteNote?.(item.id); setContextMenu(null); }}>✕ Delete</button>
          </div>
        );
      })()}

      {/* Sidebar */}
      <aside className={`notes-sidebar${sidebarOpen ? '' : ' collapsed'}`} style={sidebarOpen ? { width: sidebarWidth, minWidth: sidebarWidth } : undefined}>
        <div className="notes-sidebar-header">
          <div className="notes-sidebar-title-row">
            <span className="notes-sidebar-title">Vault</span>
            <span className="notes-sidebar-hint">{noteItems.length} notes</span>
          </div>
          <div className="notes-add-actions">
            <button type="button" className="notes-btn" onClick={() => onAddFolder?.(null)}>📁 Folder</button>
            <button type="button" className="notes-btn primary" onClick={() => onAddNote?.(null)}>📄 Note</button>
          </div>
        </div>
        <div className="notes-sidebar-body">
          {renderTree(null, 0)}
        </div>
      </aside>

      {/* Resize handle */}
      {sidebarOpen && (
        <div
          className={`notes-resize-handle${isResizing ? ' dragging' : ''}`}
          onMouseDown={handleResizeStart}
        />
      )}

      {/* Editor */}
      <section className="notes-editor">
        {/* Top bar with sidebar toggle + title */}
        <div className="notes-editor-bar">
          <button type="button" className="notes-sidebar-toggle" onClick={() => { setSidebarOpen(s => { const v = !s; persistPrefs({ sidebarOpen: v }); return v; }); }} title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
          {selectedNote ? (
            <>
              <input
                ref={titleInputRef}
                className="notes-note-title-input"
                value={selectedNote.title || ''}
                onChange={e => handleUpdateField('title', e.target.value)}
                placeholder="Untitled note"
              />
              <div className="notes-pane-toggles">
                <button type="button" className={`notes-pane-pill${showPreview ? ' active' : ''}`} onClick={() => { setShowPreview(s => { const v = !s; persistPrefs({ showPreview: v }); return v; }); }}>
                  <span className="notes-pill-dot" />Preview
                </button>
                <button type="button" className={`notes-pane-pill${showCode ? ' active' : ''}`} onClick={() => { setShowCode(s => { const v = !s; persistPrefs({ showCode: v }); return v; }); }}>
                  <span className="notes-pill-dot" />Code
                </button>
              </div>
            </>
          ) : (
            <span style={{ flex: 1, color: 'var(--text-muted)', fontSize: '0.82rem' }}>Select a note</span>
          )}
        </div>

        {!selectedNote ? (
          <div className="notes-editor-empty">
            <div className="notes-editor-empty-card">
              <h3>Select a note from the sidebar</h3>
              <p>Pick one or create a new note to start writing.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="notes-editor-body">
              {/* Note pane */}
              <div className="notes-pane note-pane" style={{ flex: (showPreview || showCode) ? '5 0 0' : '1 0 0' }}>
                <div className="notes-pane-label"><span>📝 Note</span></div>
                <MarkdownEditor
                  value={selectedNote.content || ''}
                  onChange={v => handleUpdateField('content', v)}
                  placeholder="# Start writing...\n\nUse **bold**, _italic_, [links](url), \`code\`, ```code blocks```, and more"
                  livePreview={showPreview}
                />
              </div>

              {/* Live preview pane */}
              {showPreview && (
                <div className="notes-pane" style={{ flex: '5 0 0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div className="notes-pane-label">
                    <span>👁️ Preview</span>
                    <button type="button" className="notes-pane-close" onClick={() => setShowPreview(false)}>✕</button>
                  </div>
                  <div
                    className="md-preview"
                    style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedNote.content || '') }}
                  />
                </div>
              )}

              {/* Code pane */}
              {showCode && (
                <div className="notes-pane notes-code-pane" style={{ flex: '4 0 0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div className="notes-pane-label">
                    <span>💻 Code</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <select
                        className="notes-code-lang"
                        value={selectedNote.codeLanguage || 'javascript'}
                        onChange={e => handleUpdateField('codeLanguage', e.target.value)}
                      >
                        {Object.entries(LANGS).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      <button type="button" className="notes-pane-close" onClick={() => setShowCode(false)}>✕</button>
                    </div>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <CodeMirror
                      value={selectedNote.code || ''}
                      onChange={v => handleUpdateField('code', v)}
                      theme={tokyoNight}
                      extensions={[LANGS[selectedNote.codeLanguage || 'javascript']?.ext() || javascript()]}
                      height="100%"
                      style={{ height: '100%' }}
                      basicSetup={{ lineNumbers: true, foldGutter: true, bracketMatching: true, autocompletion: true }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="notes-footer-meta">
              {formatTimestamp(selectedNote.updatedAt || selectedNote.createdAt)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
