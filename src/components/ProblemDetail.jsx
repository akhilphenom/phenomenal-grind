import { useState, useEffect, useRef, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';

const MIN_PANE = 15;
const DEFAULT_VERTICAL = 40;
const DEFAULT_HORIZONTAL = 50;
const STATUS_OPTIONS = ['Not Attempted', 'Attempted', 'Solved', 'Revisit'];

const LANGS = {
  javascript: { label: 'JavaScript', ext: javascript },
  python: { label: 'Python', ext: python },
  java: { label: 'Java', ext: java },
  cpp: { label: 'C++', ext: cpp },
};

const STYLES = `
  .pd-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    min-height: 0;
    color: var(--text);
  }

  .pd-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pd-back-button,
  .pd-open-button,
  .pd-toggle,
  .pd-select {
    transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease, color 0.2s ease;
  }

  .pd-back-button,
  .pd-open-button,
  .pd-toggle,
  .pd-select,
  .pd-notes {
    border: 1px solid var(--border);
    outline: none;
    color: var(--text);
  }

  .pd-back-button,
  .pd-open-button,
  .pd-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: var(--surface);
  }

  .pd-back-button {
    gap: 8px;
    padding: 10px 14px;
    border-radius: 999px;
    font-weight: 600;
  }

  .pd-back-button:hover,
  .pd-open-button:hover,
  .pd-toggle:hover,
  .pd-select:hover,
  .pd-notes:hover {
    border-color: var(--accent);
  }

  .pd-back-button:hover,
  .pd-open-button:hover,
  .pd-toggle:hover {
    transform: translateY(-1px);
  }

  .pd-open-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    transform: none;
    box-shadow: none;
  }

  .pd-topbar-title {
    font-size: 0.95rem;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .pd-workspace {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) + 4px);
    background: linear-gradient(180deg, rgba(124, 92, 252, 0.08), transparent 16%), var(--bg);
  }

  .pd-panel {
    min-height: 0;
    min-width: 0;
    background: var(--surface);
  }

  .pd-left-panel {
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .pd-right-panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    background: var(--surface);
  }

  .pd-right-panel.pd-collapsed,
  .pd-left-panel.pd-collapsed,
  .pd-problem-pane.pd-collapsed,
  .pd-notes-pane.pd-collapsed {
    overflow: hidden;
  }

  .pd-problem-pane.pd-collapsed,
  .pd-notes-pane.pd-collapsed {
    padding-top: 0;
    padding-bottom: 0;
    padding-left: 0;
    padding-right: 0;
    border: 0;
  }

  .pd-left-stack {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .pd-pane {
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    transition: flex-basis 0.24s ease, width 0.24s ease, height 0.24s ease, opacity 0.2s ease;
  }

  .pd-root.pd-dragging .pd-pane,
  .pd-root.pd-dragging .pd-divider {
    transition: none;
  }

  .pd-problem-pane,
  .pd-notes-pane,
  .pd-editor-shell {
    padding: 18px;
    gap: 16px;
  }

  .pd-problem-pane,
  .pd-notes-pane {
    background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent), var(--surface);
  }

  .pd-problem-pane {
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  .pd-pane-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .pd-pane-label {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .pd-problem-title {
    margin: 0;
    font-size: clamp(1.35rem, 2vw, 1.85rem);
    line-height: 1.15;
  }

  .pd-open-button {
    width: fit-content;
    gap: 8px;
    padding: 11px 14px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--accent), var(--accent-light));
    border-color: transparent;
    color: white;
    font-weight: 700;
    box-shadow: 0 10px 30px rgba(124, 92, 252, 0.28);
  }

  .pd-meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .pd-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pd-field-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
  }

  .pd-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    padding: 7px 12px;
    border-radius: 999px;
    font-size: 0.88rem;
    font-weight: 700;
    border: 1px solid currentColor;
    background: rgba(255, 255, 255, 0.04);
  }

  .pd-select {
    appearance: none;
    background: var(--surface2);
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 0.95rem;
  }

  .pd-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pd-tag {
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(34, 211, 238, 0.08);
    color: var(--cyan);
    border: 1px solid rgba(34, 211, 238, 0.22);
    font-size: 0.82rem;
    font-weight: 600;
  }

  .pd-empty-text {
    color: var(--text-muted);
    font-size: 0.92rem;
  }

  .pd-notes {
    flex: 1;
    min-height: 180px;
    resize: none;
    border-radius: 14px;
    background: var(--surface2);
    padding: 14px;
    line-height: 1.55;
    font: inherit;
  }

  .pd-divider {
    position: relative;
    flex: 0 0 auto;
    background: var(--bg);
  }

  .pd-divider::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.04);
  }

  .pd-divider:hover::before {
    background: rgba(124, 92, 252, 0.35);
  }

  .pd-divider-vertical {
    width: 10px;
    cursor: col-resize;
  }

  .pd-divider-horizontal {
    height: 10px;
    cursor: row-resize;
  }

  .pd-divider-buttons {
    position: absolute;
    z-index: 2;
    display: flex;
    gap: 6px;
  }

  .pd-divider-vertical .pd-divider-buttons {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    flex-direction: column;
  }

  .pd-divider-horizontal .pd-divider-buttons {
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .pd-toggle {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    padding: 0;
    font-size: 0.76rem;
    font-weight: 800;
    color: var(--text-muted);
    background: var(--surface2);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
  }

  .pd-toggle:hover {
    color: var(--text);
  }

  .pd-editor-shell {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    gap: 14px;
    background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent), var(--surface);
  }

  .pd-editor-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .pd-editor-title {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .pd-editor-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
  }

  .pd-editor-subtitle {
    color: var(--text-muted);
    font-size: 0.86rem;
  }

  .pd-editor-select {
    min-width: 170px;
  }

  .pd-editor-frame {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 16px;
    background: #0b0d17;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
  }

  .pd-editor-frame .cm-editor {
    height: 100%;
    font-size: 14px;
  }

  .pd-editor-frame .cm-scroller {
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  }

  @media (max-width: 980px) {
    .pd-meta-grid {
      grid-template-columns: 1fr;
    }

    .pd-editor-toolbar,
    .pd-topbar {
      flex-direction: column;
      align-items: stretch;
    }
  }
`;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getDifficultyColor(difficulty) {
  const normalized = String(difficulty || '').toLowerCase();

  if (normalized === 'easy') return 'var(--green)';
  if (normalized === 'medium') return 'var(--yellow)';
  if (normalized === 'hard') return 'var(--red)';
  return 'var(--text-muted)';
}

export default function ProblemDetail({ problem = {}, onUpdate, onBack }) {
  const rootRef = useRef(null);
  const leftPaneRef = useRef(null);
  const dragStateRef = useRef(null);
  const previousVerticalRef = useRef(DEFAULT_VERTICAL);
  const previousHorizontalRef = useRef(DEFAULT_HORIZONTAL);

  const [leftWidth, setLeftWidth] = useState(DEFAULT_VERTICAL);
  const [topHeight, setTopHeight] = useState(DEFAULT_HORIZONTAL);
  const [dragging, setDragging] = useState(null);

  const language = LANGS[problem.language] ? problem.language : 'javascript';
  const difficulty = problem.difficulty || 'Unknown';
  const tags = Array.isArray(problem.tags) ? problem.tags : [];
  const code = typeof problem.code === 'string' ? problem.code : '';
  const notes = typeof problem.notes === 'string' ? problem.notes : '';
  const status = STATUS_OPTIONS.includes(problem.status) ? problem.status : STATUS_OPTIONS[0];
  const editorLanguage = LANGS[language];
  const isLeftCollapsed = leftWidth <= 0;
  const isRightCollapsed = leftWidth >= 100;
  const isTopCollapsed = topHeight <= 0;
  const isBottomCollapsed = topHeight >= 100;

  const emitUpdate = useCallback((patch) => {
    if (typeof onUpdate === 'function') {
      onUpdate({
        ...problem,
        code,
        notes,
        language,
        status,
        ...patch,
      });
    }
  }, [code, language, notes, onUpdate, problem, status]);

  const toggleLeftPane = useCallback(() => {
    if (isLeftCollapsed) {
      setLeftWidth(clamp(previousVerticalRef.current || DEFAULT_VERTICAL, MIN_PANE, 100 - MIN_PANE));
      return;
    }

    previousVerticalRef.current = clamp(leftWidth, MIN_PANE, 100 - MIN_PANE);
    setLeftWidth(0);
  }, [isLeftCollapsed, leftWidth]);

  const toggleRightPane = useCallback(() => {
    if (isRightCollapsed) {
      setLeftWidth(clamp(previousVerticalRef.current || DEFAULT_VERTICAL, MIN_PANE, 100 - MIN_PANE));
      return;
    }

    previousVerticalRef.current = clamp(leftWidth, MIN_PANE, 100 - MIN_PANE);
    setLeftWidth(100);
  }, [isRightCollapsed, leftWidth]);

  const toggleTopPane = useCallback(() => {
    if (isTopCollapsed) {
      setTopHeight(clamp(previousHorizontalRef.current || DEFAULT_HORIZONTAL, MIN_PANE, 100 - MIN_PANE));
      return;
    }

    previousHorizontalRef.current = clamp(topHeight, MIN_PANE, 100 - MIN_PANE);
    setTopHeight(0);
  }, [isTopCollapsed, topHeight]);

  const toggleBottomPane = useCallback(() => {
    if (isBottomCollapsed) {
      setTopHeight(clamp(previousHorizontalRef.current || DEFAULT_HORIZONTAL, MIN_PANE, 100 - MIN_PANE));
      return;
    }

    previousHorizontalRef.current = clamp(topHeight, MIN_PANE, 100 - MIN_PANE);
    setTopHeight(100);
  }, [isBottomCollapsed, topHeight]);

  const startVerticalDrag = useCallback((event) => {
    if (!rootRef.current) return;

    dragStateRef.current = {
      type: 'vertical',
      startX: event.clientX,
      startSize: leftWidth,
    };
    setDragging('vertical');
  }, [leftWidth]);

  const startHorizontalDrag = useCallback((event) => {
    if (!leftPaneRef.current) return;

    dragStateRef.current = {
      type: 'horizontal',
      startY: event.clientY,
      startSize: topHeight,
    };
    setDragging('horizontal');
  }, [topHeight]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const drag = dragStateRef.current;
      if (!drag) return;

      if (drag.type === 'vertical' && rootRef.current) {
        const rect = rootRef.current.getBoundingClientRect();
        if (!rect.width) return;
        const next = ((event.clientX - rect.left) / rect.width) * 100;
        const clamped = clamp(next, MIN_PANE, 100 - MIN_PANE);
        previousVerticalRef.current = clamped;
        setLeftWidth(clamped);
      }

      if (drag.type === 'horizontal' && leftPaneRef.current) {
        const rect = leftPaneRef.current.getBoundingClientRect();
        if (!rect.height) return;
        const next = ((event.clientY - rect.top) / rect.height) * 100;
        const clamped = clamp(next, MIN_PANE, 100 - MIN_PANE);
        previousHorizontalRef.current = clamped;
        setTopHeight(clamped);
      }
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
      setDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className={`pd-root${dragging ? ' pd-dragging' : ''}`}>
      <style>{STYLES}</style>

      <div className="pd-topbar">
        <button type="button" className="pd-back-button" onClick={onBack}>
          <span aria-hidden="true">←</span>
          <span>Back to Problems</span>
        </button>
        <div className="pd-topbar-title">Problem Workspace</div>
      </div>

      <div className="pd-workspace" ref={rootRef}>
        <section
          ref={leftPaneRef}
          className={`pd-panel pd-left-panel${isLeftCollapsed ? ' pd-collapsed' : ''}`}
          style={{ width: `${leftWidth}%` }}
        >
          <div className="pd-left-stack">
            <div
              className={`pd-pane pd-problem-pane${isTopCollapsed ? ' pd-collapsed' : ''}`}
              style={{ flexBasis: `${topHeight}%`, opacity: isTopCollapsed ? 0 : 1 }}
            >
              <div className="pd-pane-header">
                <p className="pd-pane-label">Problem Info</p>
              </div>

              <div>
                <h1 className="pd-problem-title">{problem.title || 'Untitled Problem'}</h1>
              </div>

              <button
                type="button"
                className="pd-open-button"
                onClick={() => window.open(problem.link, '_blank', 'noopener,noreferrer')}
                disabled={!problem.link}
              >
                <span>Open Problem ↗</span>
              </button>

              <div className="pd-meta-grid">
                <div className="pd-field">
                  <span className="pd-field-label">Difficulty</span>
                  <span className="pd-badge" style={{ color: getDifficultyColor(difficulty) }}>
                    {difficulty}
                  </span>
                </div>

                <label className="pd-field">
                  <span className="pd-field-label">Status</span>
                  <select
                    className="pd-select"
                    value={status}
                    onChange={(event) => emitUpdate({ status: event.target.value })}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="pd-field">
                <span className="pd-field-label">Tags</span>
                <div className="pd-tags">
                  {tags.length > 0 ? tags.map((tag) => (
                    <span key={tag} className="pd-tag">{tag}</span>
                  )) : <span className="pd-empty-text">No tags yet.</span>}
                </div>
              </div>
            </div>

            <div
              className="pd-divider pd-divider-horizontal"
              onMouseDown={startHorizontalDrag}
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize problem info and notes"
            >
              <div className="pd-divider-buttons" onMouseDown={(event) => event.stopPropagation()}>
                <button type="button" className="pd-toggle" onClick={toggleTopPane} aria-label={isTopCollapsed ? 'Expand problem info pane' : 'Collapse problem info pane'}>
                  {isTopCollapsed ? '↓' : '↑'}
                </button>
                <button type="button" className="pd-toggle" onClick={toggleBottomPane} aria-label={isBottomCollapsed ? 'Expand notes pane' : 'Collapse notes pane'}>
                  {isBottomCollapsed ? '↑' : '↓'}
                </button>
              </div>
            </div>

            <div
              className={`pd-pane pd-notes-pane${isBottomCollapsed ? ' pd-collapsed' : ''}`}
              style={{ flexBasis: `${100 - topHeight}%`, opacity: isBottomCollapsed ? 0 : 1 }}
            >
              <div className="pd-pane-header">
                <p className="pd-pane-label">Notes</p>
              </div>
              <textarea
                className="pd-notes"
                value={notes}
                onChange={(event) => emitUpdate({ notes: event.target.value })}
                placeholder="Capture patterns, edge cases, debugging ideas, or future improvements..."
              />
            </div>
          </div>
        </section>

        <div
          className="pd-divider pd-divider-vertical"
          onMouseDown={startVerticalDrag}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize details and editor"
        >
          <div className="pd-divider-buttons" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="pd-toggle" onClick={toggleLeftPane} aria-label={isLeftCollapsed ? 'Expand details pane' : 'Collapse details pane'}>
              {isLeftCollapsed ? '→' : '←'}
            </button>
            <button type="button" className="pd-toggle" onClick={toggleRightPane} aria-label={isRightCollapsed ? 'Expand editor pane' : 'Collapse editor pane'}>
              {isRightCollapsed ? '←' : '→'}
            </button>
          </div>
        </div>

        <section
          className={`pd-panel pd-right-panel${isRightCollapsed ? ' pd-collapsed' : ''}`}
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div className="pd-editor-shell">
            <div className="pd-editor-toolbar">
              <div className="pd-editor-title">
                <p className="pd-pane-label">Code Editor</p>
                <h2 className="pd-editor-name">{problem.title || 'Untitled Problem'}</h2>
                <span className="pd-editor-subtitle">Tokyo Night • autosaving through onUpdate</span>
              </div>

              <label className="pd-field pd-editor-select">
                <span className="pd-field-label">Language</span>
                <select
                  className="pd-select"
                  value={language}
                  onChange={(event) => emitUpdate({ language: event.target.value })}
                >
                  {Object.entries(LANGS).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="pd-editor-frame">
              <CodeMirror
                value={code}
                height="100%"
                theme={tokyoNight}
                extensions={[editorLanguage.ext()]}
                onChange={(value) => emitUpdate({ code: value })}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  foldGutter: true,
                  autocompletion: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  indentOnInput: true,
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
