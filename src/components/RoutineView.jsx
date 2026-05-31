import { useCallback } from 'react';
import MarkdownEditor from './MarkdownEditor';

const MOODS = [
  { emoji: '😫', label: 'Rough' },
  { emoji: '😓', label: 'Meh' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😊', label: 'Good' },
  { emoji: '🤩', label: 'Great' },
];

const TAGS = [
  'Productive', 'Creative', 'Learning', 'Relaxed', 'Social',
  'Focused', 'Tired', 'Stressed', 'Grateful', 'Motivated',
];

const DEFAULT_JOURNAL = {
  mood: '',
  tags: [],
  highlights: '',
  lowlights: '',
  gratitude: '',
  learnings: '',
  body: '',
};

function mergeJournal(routine = {}) {
  return { ...DEFAULT_JOURNAL, ...(routine || {}) };
}

const STYLES = `
.journal-view {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 14px;
  height: 100%;
}

.journal-left {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.journal-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.journal-mood-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
}

.journal-section-title {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.journal-mood-row {
  display: flex;
  gap: 8px;
}

.journal-mood-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface2);
  cursor: pointer;
  transition: all 0.15s;
  flex: 1;
}

.journal-mood-btn .mood-emoji { font-size: 1.3rem; }
.journal-mood-btn .mood-label {
  font-size: 0.62rem;
  color: var(--text-muted);
  font-weight: 600;
}

.journal-mood-btn:hover {
  border-color: var(--accent);
  background: rgba(124, 92, 252, 0.06);
}

.journal-mood-btn.active {
  border-color: var(--accent);
  background: rgba(124, 92, 252, 0.15);
  box-shadow: 0 0 12px rgba(124, 92, 252, 0.15);
}
.journal-mood-btn.active .mood-label { color: var(--accent-light); }

.journal-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.journal-tag {
  padding: 4px 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.journal-tag:hover {
  border-color: var(--accent);
  color: var(--text);
}

.journal-tag.active {
  background: rgba(124, 92, 252, 0.18);
  border-color: var(--accent);
  color: var(--accent-light);
}

.journal-prompts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.journal-prompt-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.journal-prompt-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text);
}

.journal-prompt-header .prompt-icon { font-size: 0.9rem; }

.journal-prompt-card textarea {
  width: 100%;
  min-height: 56px;
  background: rgba(255,255,255,0.02);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
  font-size: 0.8rem;
  line-height: 1.55;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
}

.journal-prompt-card textarea:focus {
  border-color: var(--accent);
}

.journal-prompt-card textarea::placeholder {
  color: var(--text-muted);
}

@media (max-width: 700px) {
  .journal-view { grid-template-columns: 1fr; }
}
`;

export default function RoutineView({ dayData, onUpdate }) {
  const journal = mergeJournal(dayData?.routine);

  const patch = useCallback(
    (updates) => {
      onUpdate?.({ ...journal, ...updates });
    },
    [journal, onUpdate]
  );

  const toggleTag = (tag) => {
    const tags = journal.tags || [];
    patch({
      tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
    });
  };

  return (
    <div className="journal-view">
      <style>{STYLES}</style>

      {/* Left — Free Write */}
      <div className="journal-left">
        <MarkdownEditor
          value={journal.body}
          onChange={(v) => patch({ body: v })}
          placeholder="Stream of consciousness, reflections, anything on your mind...

Use **bold**, _italic_, [links](url), \`code\`, and \`\`\`code blocks\`\`\`"
          label="📝 Free Write"
        />
      </div>

      {/* Right — Mood, Tags, Prompts */}
      <div className="journal-right">
        <div className="journal-mood-section">
          <div className="journal-section-title">How are you feeling today?</div>
          <div className="journal-mood-row">
            {MOODS.map((m) => (
              <button
                key={m.emoji}
                type="button"
                className={`journal-mood-btn${journal.mood === m.emoji ? ' active' : ''}`}
                onClick={() => patch({ mood: m.emoji })}
              >
                <span className="mood-emoji">{m.emoji}</span>
                <span className="mood-label">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="journal-section-title" style={{ marginTop: 14 }}>Day vibes</div>
          <div className="journal-tags-row">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`journal-tag${(journal.tags || []).includes(tag) ? ' active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="journal-prompts">
          <div className="journal-prompt-card">
            <div className="journal-prompt-header">
              <span className="prompt-icon">✨</span> Highlights
            </div>
            <textarea
              value={journal.highlights}
              onChange={(e) => patch({ highlights: e.target.value })}
              placeholder="What went well today?"
            />
          </div>

          <div className="journal-prompt-card">
            <div className="journal-prompt-header">
              <span className="prompt-icon">🔧</span> To Improve
            </div>
            <textarea
              value={journal.lowlights}
              onChange={(e) => patch({ lowlights: e.target.value })}
              placeholder="What could have gone better?"
            />
          </div>

          <div className="journal-prompt-card">
            <div className="journal-prompt-header">
              <span className="prompt-icon">🙏</span> Gratitude
            </div>
            <textarea
              value={journal.gratitude}
              onChange={(e) => patch({ gratitude: e.target.value })}
              placeholder="What are you grateful for today?"
            />
          </div>

          <div className="journal-prompt-card">
            <div className="journal-prompt-header">
              <span className="prompt-icon">🧠</span> Learnings
            </div>
            <textarea
              value={journal.learnings}
              onChange={(e) => patch({ learnings: e.target.value })}
              placeholder="New concepts, ideas, or skills picked up..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

