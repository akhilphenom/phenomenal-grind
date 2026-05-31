import { useState, useRef, useCallback, useMemo } from 'react';

const TOOLBAR = [
  { label: 'B', title: 'Bold', before: '**', after: '**' },
  { label: 'I', title: 'Italic', before: '_', after: '_' },
  { label: '~~', title: 'Strikethrough', before: '~~', after: '~~' },
  { label: 'H1', title: 'Heading 1', before: '# ', after: '', line: true },
  { label: 'H2', title: 'Heading 2', before: '## ', after: '', line: true },
  { label: 'H3', title: 'Heading 3', before: '### ', after: '', line: true },
  { type: 'sep' },
  { label: '🔗', title: 'Link', insert: '[link text](https://)', select: [1, 10] },
  { label: '```', title: 'Code Block', before: '```\n', after: '\n```', block: true },
  { label: '`', title: 'Inline Code', before: '`', after: '`' },
  { type: 'sep' },
  { label: '•', title: 'Bullet List', before: '- ', after: '', line: true },
  { label: '1.', title: 'Numbered List', before: '1. ', after: '', line: true },
  { label: '☑', title: 'Checkbox', before: '- [ ] ', after: '', line: true },
  { label: '>', title: 'Blockquote', before: '> ', after: '', line: true },
  { label: '---', title: 'Horizontal Rule', insert: '\n---\n' },
];

export function renderMarkdown(text) {
  if (!text) return '<p class="md-empty">Nothing written yet...</p>';

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre class="md-codeblock"><code>${code}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');

  // Bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Links
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
    '<a class="md-link" href="$2" target="_blank" rel="noopener">$1</a>'
  );
  // Auto-link bare URLs
  html = html.replace(
    /(?<!")(?<!=)(https?:\/\/[^\s<]+)/g,
    '<a class="md-link" href="$1" target="_blank" rel="noopener">$1</a>'
  );

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="md-hr"/>');

  // Checkboxes
  html = html.replace(/^- \[x\] (.+)$/gm, '<div class="md-checkbox checked">☑ $1</div>');
  html = html.replace(/^- \[ \] (.+)$/gm, '<div class="md-checkbox">☐ $1</div>');

  // Bullet lists
  html = html.replace(/^- (.+)$/gm, '<div class="md-bullet">• $1</div>');

  // Numbered lists
  html = html.replace(/^(\d+)\. (.+)$/gm, '<div class="md-numbered">$1. $2</div>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');

  // Paragraphs: double newline = paragraph break, single newline = line break
  // But don't add extra spacing between consecutive list/block elements
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br/>');
  html = '<p>' + html + '</p>';
  // Clean up empty paragraphs and paragraphs wrapping block elements
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<div |<blockquote |<pre |<hr |<h[1-3] )/g, '$1');
  html = html.replace(/(<\/div>|<\/blockquote>|<\/pre>|<\/h[1-3]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr[^>]*\/>)<\/p>/g, '$1');

  return html;
}

const STYLES = `
.md-editor {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.md-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
  background: rgba(255,255,255,0.01);
  flex-wrap: wrap;
}

.md-toolbar-btn {
  padding: 3px 7px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  transition: all 0.12s;
  min-width: 24px;
  text-align: center;
}

.md-toolbar-btn:hover {
  background: var(--surface2);
  color: var(--text);
}

.md-toolbar-sep {
  width: 1px;
  height: 18px;
  background: var(--border);
  margin: 0 4px;
}

.md-toolbar-spacer { flex: 1; }

.md-mode-toggle {
  display: flex;
  border-radius: 6px;
  border: 1px solid var(--border);
  overflow: hidden;
}

.md-mode-btn {
  padding: 3px 10px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.65rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.md-mode-btn.active {
  background: var(--accent);
  color: #fff;
}
.md-mode-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.md-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.md-textarea {
  flex: 1;
  width: 100%;
  min-height: 200px;
  background: transparent;
  color: var(--text);
  border: none;
  padding: 14px 16px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.82rem;
  line-height: 1.75;
  resize: none;
  outline: none;
  tab-size: 2;
}

.md-textarea::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}

.md-preview {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
  font-size: 0.82rem;
  line-height: 1.75;
  color: var(--text);
}

.md-preview .md-h1 { font-size: 1.4rem; font-weight: 800; margin: 12px 0 6px; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 6px; }
.md-preview .md-h2 { font-size: 1.15rem; font-weight: 700; margin: 10px 0 4px; color: var(--text); }
.md-preview .md-h3 { font-size: 0.95rem; font-weight: 700; margin: 8px 0 4px; color: var(--accent-light); }

.md-preview strong { font-weight: 700; color: #fff; }
.md-preview em { font-style: italic; color: var(--accent-light); }
.md-preview del { text-decoration: line-through; opacity: 0.6; }

.md-preview .md-link {
  color: var(--cyan, #22d3ee);
  text-decoration: underline;
  text-decoration-color: rgba(34,211,238,0.3);
  text-underline-offset: 2px;
}
.md-preview .md-link:hover { text-decoration-color: var(--cyan, #22d3ee); }

.md-preview .md-codeblock {
  background: rgba(0,0,0,0.35);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  line-height: 1.6;
  overflow-x: auto;
  margin: 8px 0;
  white-space: pre;
}

.md-preview .md-inline-code {
  background: rgba(124,92,252,0.15);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--accent-light);
}

.md-preview .md-bullet, .md-preview .md-numbered {
  padding-left: 16px;
  position: relative;
}

.md-preview .md-checkbox { padding-left: 4px; }
.md-preview .md-checkbox.checked { color: var(--text-muted); text-decoration: line-through; }

.md-preview .md-blockquote {
  border-left: 3px solid var(--accent);
  padding: 4px 12px;
  margin: 6px 0;
  color: var(--text-muted);
  font-style: italic;
  background: rgba(124,92,252,0.04);
  border-radius: 0 6px 6px 0;
}

.md-preview .md-hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 12px 0;
}

.md-preview .md-empty {
  color: var(--text-muted);
  opacity: 0.5;
  font-style: italic;
}
.md-preview p { margin: 0 0 4px; }
.md-preview .md-bullet, .md-preview .md-numbered { margin: 1px 0; }
.md-preview .md-checkbox { margin: 1px 0; }

.md-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  border-top: 1px solid var(--border);
  font-size: 0.62rem;
  color: var(--text-muted);
}
`;

export default function MarkdownEditor({ value, onChange, placeholder, label, livePreview }) {
  const [mode, setMode] = useState('write');
  const textareaRef = useRef(null);

  // Force write mode when live preview pane is open externally
  const effectiveMode = livePreview ? 'write' : mode;

  const handleToolbar = useCallback((item) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.slice(start, end);

    let newText, cursorPos;

    if (item.insert) {
      newText = text.slice(0, start) + item.insert + text.slice(end);
      cursorPos = start + (item.select ? item.select[0] : item.insert.length);
    } else if (item.line) {
      // Find line start
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      newText = text.slice(0, lineStart) + item.before + text.slice(lineStart);
      cursorPos = start + item.before.length;
    } else {
      newText = text.slice(0, start) + item.before + (selected || 'text') + item.after + text.slice(end);
      if (selected) {
        cursorPos = start + item.before.length + selected.length + item.after.length;
      } else {
        cursorPos = start + item.before.length;
      }
    }

    onChange(newText);
    requestAnimationFrame(() => {
      el.focus();
      const selectEnd = item.insert && item.select
        ? start + item.select[0] + item.select[1]
        : cursorPos;
      el.setSelectionRange(
        item.insert && item.select ? start + item.select[0] : cursorPos,
        selectEnd
      );
    });
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    const el = e.target;
    const text = el.value;
    const start = el.selectionStart;

    // Tab indents list items
    if (e.key === 'Tab') {
      e.preventDefault();
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const line = text.slice(lineStart, start);

      if (e.shiftKey) {
        // Shift+Tab: remove leading 2 spaces
        if (line.startsWith('  ')) {
          const newText = text.slice(0, lineStart) + text.slice(lineStart + 2);
          onChange(newText);
          requestAnimationFrame(() => el.setSelectionRange(start - 2, start - 2));
        }
      } else {
        // Tab: add 2 spaces at line start
        const newText = text.slice(0, lineStart) + '  ' + text.slice(lineStart);
        onChange(newText);
        requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
      }
      return;
    }

    // Enter: auto-continue lists
    if (e.key === 'Enter') {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const line = text.slice(lineStart, start);

      // Match list patterns: "  - ", "- [ ] ", "- [x] ", "- ", "  1. ", "1. "
      const bulletMatch = line.match(/^(\s*)(- \[[ x]\] |- )(.*)/);
      const numberMatch = line.match(/^(\s*)(\d+)\. (.*)/);

      if (bulletMatch) {
        const [, indent, prefix, content] = bulletMatch;
        if (!content.trim()) {
          // Empty bullet — remove it (double-enter clears)
          e.preventDefault();
          const newText = text.slice(0, lineStart) + '\n' + text.slice(start);
          onChange(newText);
          requestAnimationFrame(() => el.setSelectionRange(lineStart + 1, lineStart + 1));
        } else {
          // Continue with same prefix
          e.preventDefault();
          const continuation = `\n${indent}${prefix.startsWith('- [') ? '- [ ] ' : '- '}`;
          const newText = text.slice(0, start) + continuation + text.slice(start);
          onChange(newText);
          const newPos = start + continuation.length;
          requestAnimationFrame(() => el.setSelectionRange(newPos, newPos));
        }
      } else if (numberMatch) {
        const [, indent, num, content] = numberMatch;
        if (!content.trim()) {
          // Empty number — remove it
          e.preventDefault();
          const newText = text.slice(0, lineStart) + '\n' + text.slice(start);
          onChange(newText);
          requestAnimationFrame(() => el.setSelectionRange(lineStart + 1, lineStart + 1));
        } else {
          // Continue with next number
          e.preventDefault();
          const nextNum = parseInt(num) + 1;
          const continuation = `\n${indent}${nextNum}. `;
          const newText = text.slice(0, start) + continuation + text.slice(start);
          onChange(newText);
          const newPos = start + continuation.length;
          requestAnimationFrame(() => el.setSelectionRange(newPos, newPos));
        }
      }
    }
  }, [onChange]);

  const preview = useMemo(() => renderMarkdown(value), [value]);
  const wordCount = value?.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value?.length || 0;

  return (
    <div className="md-editor">
      <style>{STYLES}</style>

      <div className="md-toolbar">
        {TOOLBAR.map((item, i) => {
          if (item.type === 'sep') return <div key={`sep-${i}`} className="md-toolbar-sep" />;
          return (
            <button
              key={item.label}
              type="button"
              className="md-toolbar-btn"
              title={item.title}
              onClick={() => handleToolbar(item)}
            >
              {item.label}
            </button>
          );
        })}

        <div className="md-toolbar-spacer" />

        <div className="md-mode-toggle">
          <button
            type="button"
            className={`md-mode-btn${effectiveMode === 'write' ? ' active' : ''}`}
            onClick={() => setMode('write')}
          >
            Write
          </button>
          <button
            type="button"
            className={`md-mode-btn${effectiveMode === 'preview' ? ' active' : ''}${livePreview ? ' disabled' : ''}`}
            onClick={() => !livePreview && setMode('preview')}
            disabled={livePreview}
            title={livePreview ? 'Preview is shown in separate pane' : 'Preview'}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="md-body">
        {effectiveMode === 'write' ? (
          <textarea
            ref={textareaRef}
            className="md-textarea"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Start writing... Use **bold**, _italic_, ```code blocks```, [links](url), and more'}
          />
        ) : (
          <div
            className="md-preview"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        )}
      </div>

      <div className="md-footer">
        <span>{label || 'Markdown supported'}</span>
        <span>{wordCount} words · {charCount} chars</span>
      </div>
    </div>
  );
}
