import { useMemo, useState } from 'react';

const AVAILABLE_TAGS = [
  'Arrays',
  'Strings',
  'DP',
  'Trees',
  'Graphs',
  'Binary Search',
  'Backtracking',
  'Stack',
  'Queue',
  'Heap',
  'Linked List',
  'Sliding Window',
  'Two Pointers',
  'Greedy',
  'Math',
  'Bit Manipulation',
  'Trie',
  'Union Find',
  'BFS',
  'DFS',
  'Sorting',
  'Hashing',
];

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];
const STATUS_OPTIONS = ['Not Attempted', 'Attempted', 'Solved', 'Revisit'];

const EMPTY_FORM = {
  title: '',
  link: '',
  difficulty: 'Medium',
  status: 'Not Attempted',
  tags: [],
};

const STYLES = `
.pl-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: var(--text);
}

.pl-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0)), var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
}

.pl-toolbar,
.pl-form,
.pl-table-wrap,
.pl-empty {
  padding: 18px;
}

.pl-toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pl-toolbar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.pl-heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pl-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.pl-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.pl-count {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 999px;
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.pl-button,
.pl-tag-button,
.pl-icon-button,
.pl-row-link {
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.pl-button {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
}

.pl-button:hover,
.pl-tag-button:hover,
.pl-icon-button:hover,
.pl-row-link:hover {
  transform: translateY(-1px);
  border-color: rgba(157, 132, 253, 0.55);
}

.pl-button-primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  border-color: transparent;
  color: #fff;
  box-shadow: 0 14px 28px rgba(124, 92, 252, 0.24);
}

.pl-button-primary:hover {
  box-shadow: 0 18px 30px rgba(124, 92, 252, 0.32);
}

.pl-controls {
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) repeat(2, minmax(150px, 0.7fr)) auto;
  gap: 12px;
}

.pl-control,
.pl-form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pl-label {
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 700;
}

.pl-input,
.pl-select,
.pl-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.02);
  color: var(--text);
  border-radius: 10px;
  padding: 11px 12px;
  font: inherit;
  font-size: 0.82rem;
  outline: none;
}

.pl-select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238888a4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
  cursor: pointer;
}

.pl-select option {
  background: var(--surface);
  color: var(--text);
}

.pl-input:focus,
.pl-select:focus,
.pl-textarea:focus {
  border-color: rgba(157, 132, 253, 0.75);
  box-shadow: 0 0 0 3px rgba(124, 92, 252, 0.14);
}

.pl-search {
  position: relative;
}

.pl-search .pl-input {
  padding-left: 34px;
}

.pl-search-icon {
  position: absolute;
  left: 12px;
  bottom: 12px;
  color: var(--text-muted);
  pointer-events: none;
  font-size: 0.85rem;
  line-height: 1;
}

.pl-form {
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pl-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) repeat(2, minmax(140px, 0.7fr));
  gap: 12px;
}

.pl-tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pl-tag-button {
  appearance: none;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.02);
  color: var(--text-muted);
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 0.82rem;
  cursor: pointer;
}

.pl-tag-button.active {
  color: #fff;
  background: rgba(124, 92, 252, 0.2);
  border-color: rgba(157, 132, 253, 0.72);
}

.pl-form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.pl-table-wrap {
  overflow-x: auto;
}

.pl-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.pl-table th {
  text-align: left;
  padding: 0 14px 12px;
  color: var(--text-muted);
  font-size: 0.76rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 700;
}

.pl-table td {
  padding: 14px;
  border-top: 1px solid rgba(255,255,255,0.05);
  vertical-align: top;
}

.pl-row {
  cursor: pointer;
}

.pl-row:hover {
  background: rgba(124, 92, 252, 0.07);
}

.pl-row-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.pl-row-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 0;
  color: var(--text);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.pl-row-link:hover {
  color: var(--accent-light);
}

.pl-link-anchor {
  color: var(--cyan);
  text-decoration: none;
  font-size: 0.82rem;
}

.pl-link-anchor:hover {
  text-decoration: underline;
}

.pl-pill,
.pl-tag-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid transparent;
  white-space: nowrap;
}

.pl-difficulty-easy {
  color: var(--green);
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.28);
}

.pl-difficulty-medium {
  color: var(--yellow);
  background: rgba(250, 204, 21, 0.12);
  border-color: rgba(250, 204, 21, 0.28);
}

.pl-difficulty-hard {
  color: var(--red);
  background: rgba(248, 113, 113, 0.12);
  border-color: rgba(248, 113, 113, 0.28);
}

.pl-status-not-attempted {
  color: var(--text-muted);
  background: rgba(136, 136, 164, 0.12);
  border-color: rgba(136, 136, 164, 0.25);
}

.pl-status-attempted {
  color: var(--orange);
  background: rgba(249, 115, 22, 0.12);
  border-color: rgba(249, 115, 22, 0.28);
}

.pl-status-solved {
  color: var(--green);
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.28);
}

.pl-status-revisit {
  color: var(--cyan);
  background: rgba(34, 211, 238, 0.12);
  border-color: rgba(34, 211, 238, 0.28);
}

.pl-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pl-tag-pill {
  color: var(--text);
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
}

.pl-tag-muted {
  color: var(--text-muted);
}

.pl-actions {
  width: 1%;
  white-space: nowrap;
}

.pl-icon-button {
  appearance: none;
  border: 1px solid rgba(248, 113, 113, 0.32);
  background: rgba(248, 113, 113, 0.1);
  color: var(--red);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}

.pl-empty {
  text-align: center;
  color: var(--text-muted);
}

.pl-empty strong {
  display: block;
  color: var(--text);
  margin-bottom: 8px;
}

@media (max-width: 900px) {
  .pl-controls,
  .pl-form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .pl-controls,
  .pl-form-grid {
    grid-template-columns: 1fr;
  }

  .pl-toolbar,
  .pl-form,
  .pl-table-wrap,
  .pl-empty {
    padding: 16px;
  }

  .pl-table {
    min-width: 640px;
  }
}
`;

function fuzzyMatch(text, query) {
  if (!query) return true;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i += 1) {
    if (lower[i] === q[qi]) qi += 1;
  }
  return qi === q.length;
}

function getDifficultyClass(difficulty) {
  return `pl-difficulty-${difficulty.toLowerCase()}`;
}

function getStatusClass(status) {
  return `pl-status-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

function toggleInList(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function ProblemList({ problems = [], onUpdate, onOpenProblem }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tagFilters, setTagFilters] = useState([]);

  const filteredProblems = useMemo(() => (
    problems.filter((problem) => {
      const matchesDifficulty = difficultyFilter === 'All' || problem.difficulty === difficultyFilter;
      const matchesStatus = statusFilter === 'All' || problem.status === statusFilter;
      const matchesTags = tagFilters.length === 0 || tagFilters.every((tag) => problem.tags.includes(tag));
      const matchesSearch = fuzzyMatch(problem.title || '', search.trim());
      return matchesDifficulty && matchesStatus && matchesTags && matchesSearch;
    })
  ), [difficultyFilter, problems, search, statusFilter, tagFilters]);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) return;

    const nextProblem = {
      id: crypto.randomUUID(),
      title,
      link: form.link.trim(),
      difficulty: form.difficulty,
      status: form.status,
      tags: form.tags,
      code: '',
      notes: '',
      language: 'javascript',
      createdAt: new Date().toISOString(),
    };

    onUpdate([nextProblem, ...problems]);
    resetForm();
    setIsFormOpen(false);
  };

  const handleDelete = (id) => {
    onUpdate(problems.filter((problem) => problem.id !== id));
  };

  const clearFilters = () => {
    setSearch('');
    setDifficultyFilter('All');
    setStatusFilter('All');
    setTagFilters([]);
  };

  return (
    <div className="pl-wrap">
      <style>{STYLES}</style>

      <section className="pl-card pl-toolbar">
        <div className="pl-toolbar-top">
          <div className="pl-heading">
            <h2 className="pl-title">Problem Tracker</h2>
            <p className="pl-subtitle">Track practice problems, filter by patterns, and jump back into any challenge fast.</p>
          </div>
          <div className="pl-toolbar-top">
            <span className="pl-count">{filteredProblems.length} of {problems.length} problems</span>
            <button
              type="button"
              className="pl-button pl-button-primary"
              onClick={() => setIsFormOpen((prev) => !prev)}
            >
              {isFormOpen ? 'Hide form' : 'Add problem'}
            </button>
          </div>
        </div>

        <div className="pl-controls">
          <label className="pl-control pl-search">
            <span className="pl-label">Search</span>
            <span className="pl-search-icon">🔍</span>
            <input
              className="pl-input"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title..."
            />
          </label>

          <label className="pl-control">
            <span className="pl-label">Difficulty</span>
            <select
              className="pl-select"
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
            >
              <option value="All">All difficulties</option>
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="pl-control">
            <span className="pl-label">Status</span>
            <select
              className="pl-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <div className="pl-control" style={{ justifyContent: 'flex-end' }}>
            <span className="pl-label">Filters</span>
            <button type="button" className="pl-button" onClick={clearFilters}>Clear filters</button>
          </div>
        </div>

        <div className="pl-control">
          <span className="pl-label">Tag filters</span>
          <div className="pl-tag-grid">
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`pl-tag-button${tagFilters.includes(tag) ? ' active' : ''}`}
                onClick={() => setTagFilters((prev) => toggleInList(prev, tag))}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {isFormOpen && (
        <form className="pl-card pl-form" onSubmit={handleSubmit}>
          <div className="pl-form-grid">
            <label className="pl-form-field">
              <span className="pl-label">Title</span>
              <input
                className="pl-input"
                type="text"
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                placeholder="e.g. Longest Substring Without Repeating Characters"
                required
              />
            </label>

            <label className="pl-form-field">
              <span className="pl-label">Link</span>
              <input
                className="pl-input"
                type="url"
                value={form.link}
                onChange={(event) => updateForm('link', event.target.value)}
                placeholder="https://..."
              />
            </label>

            <label className="pl-form-field">
              <span className="pl-label">Difficulty</span>
              <select
                className="pl-select"
                value={form.difficulty}
                onChange={(event) => updateForm('difficulty', event.target.value)}
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="pl-form-field">
              <span className="pl-label">Status</span>
              <select
                className="pl-select"
                value={form.status}
                onChange={(event) => updateForm('status', event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="pl-form-field">
            <span className="pl-label">Tags</span>
            <div className="pl-tag-grid">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`pl-tag-button${form.tags.includes(tag) ? ' active' : ''}`}
                  onClick={() => updateForm('tags', toggleInList(form.tags, tag))}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="pl-form-actions">
            <button type="button" className="pl-button" onClick={resetForm}>Reset</button>
            <button type="submit" className="pl-button pl-button-primary">Save problem</button>
          </div>
        </form>
      )}

      <section className="pl-card">
        {filteredProblems.length > 0 ? (
          <div className="pl-table-wrap">
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Difficulty</th>
                  <th>Status</th>
                  <th>Tags</th>
                  <th className="pl-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.map((problem) => (
                  <tr
                    key={problem.id}
                    className="pl-row"
                    onClick={() => onOpenProblem(problem)}
                  >
                    <td>
                      <div className="pl-row-title">
                        <button
                          type="button"
                          className="pl-row-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenProblem(problem);
                          }}
                        >
                          {problem.title}
                        </button>
                        {problem.link && (
                          <a
                            className="pl-link-anchor"
                            href={problem.link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                          >
                            Visit ↗
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`pl-pill ${getDifficultyClass(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td>
                      <span className={`pl-pill ${getStatusClass(problem.status)}`}>
                        {problem.status}
                      </span>
                    </td>
                    <td>
                      {problem.tags?.length ? (
                        <div className="pl-tag-list">
                          {problem.tags.map((tag) => (
                            <span key={tag} className="pl-tag-pill">{tag}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="pl-tag-muted">No tags</span>
                      )}
                    </td>
                    <td className="pl-actions">
                      <button
                        type="button"
                        className="pl-icon-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(problem.id);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pl-empty">
            <strong>No problems match your current filters.</strong>
            Try changing the search or filters, or add your first problem.
          </div>
        )}
      </section>
    </div>
  );
}
