import { useState, useMemo, useCallback } from 'react';
import ProblemList from './ProblemList';
import ProblemDetail from './ProblemDetail';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(key) {
  const d = new Date(key + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

const STYLES = `
.adhoc-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--text);
}

.adhoc-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.adhoc-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.adhoc-subtitle {
  color: var(--text-muted);
  font-size: 0.82rem;
  margin: 0;
}

.adhoc-mode-toggle {
  display: flex;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px;
  gap: 2px;
  margin-left: auto;
}

.adhoc-mode-btn {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.adhoc-mode-btn.active {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 2px 8px rgba(124,92,252,0.3);
}

.adhoc-mode-btn:hover:not(.active) {
  color: var(--text);
  background: rgba(255,255,255,0.04);
}

.adhoc-daily-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.adhoc-nav-btn {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.adhoc-nav-btn:hover { border-color: var(--accent); }

.adhoc-date-label {
  font-size: 0.85rem;
  font-weight: 600;
  min-width: 180px;
  text-align: center;
}

.adhoc-today-btn {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--accent-light);
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: border-color 0.2s;
}

.adhoc-today-btn:hover { border-color: var(--accent); }

.adhoc-daily-stats {
  display: flex;
  gap: 12px;
  margin-left: auto;
  align-items: center;
}

.adhoc-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.adhoc-stat strong {
  color: var(--text);
  font-size: 0.85rem;
}

.adhoc-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.adhoc-body::-webkit-scrollbar { width: 6px; }
.adhoc-body::-webkit-scrollbar-track { background: transparent; }
.adhoc-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
.adhoc-body::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

.adhoc-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
}

.adhoc-empty-card {
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px 24px;
  max-width: 380px;
}

.adhoc-empty-card h3 { margin: 0 0 6px; font-size: 0.95rem; }
.adhoc-empty-card p { margin: 0; color: var(--text-muted); font-size: 0.82rem; }
`;

export default function AdhocView({
  problems = [],
  onUpdate,
  onUpdateProblem,
  onOpenProblem,
  openProblem,
  onBack,
}) {
  const [mode, setMode] = useState('daily'); // 'daily' | 'all'
  const [currentDate, setCurrentDate] = useState(todayKey);

  // Group problems by date (createdAt)
  const problemsByDate = useMemo(() => {
    const map = {};
    for (const p of problems) {
      const dateKey = (p.createdAt || '').slice(0, 10);
      if (!dateKey) continue;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(p);
    }
    return map;
  }, [problems]);

  // Get sorted unique dates
  const sortedDates = useMemo(() =>
    Object.keys(problemsByDate).sort().reverse(),
    [problemsByDate]
  );

  // Navigate dates
  const dateIndex = sortedDates.indexOf(currentDate);

  const goToPrev = useCallback(() => {
    if (dateIndex < sortedDates.length - 1) {
      setCurrentDate(sortedDates[dateIndex + 1]);
    } else if (dateIndex === -1 && sortedDates.length > 0) {
      // Current date has no problems, find nearest previous
      const nearest = sortedDates.find(d => d <= currentDate);
      if (nearest) setCurrentDate(nearest);
    }
  }, [dateIndex, sortedDates, currentDate]);

  const goToNext = useCallback(() => {
    if (dateIndex > 0) {
      setCurrentDate(sortedDates[dateIndex - 1]);
    }
  }, [dateIndex, sortedDates]);

  const goToToday = useCallback(() => setCurrentDate(todayKey()), []);

  // Daily filtered problems
  const dailyProblems = useMemo(() =>
    problemsByDate[currentDate] || [],
    [problemsByDate, currentDate]
  );

  // Stats for current day
  const dailyStats = useMemo(() => {
    const list = dailyProblems;
    return {
      total: list.length,
      solved: list.filter(p => p.status === 'Solved').length,
      attempted: list.filter(p => p.status === 'Attempted').length,
    };
  }, [dailyProblems]);

  // If viewing a problem detail
  if (openProblem) {
    return (
      <div className="adhoc-wrap">
        <style>{STYLES}</style>
        <ProblemDetail
          problem={openProblem}
          onUpdate={onUpdateProblem}
          onBack={onBack}
        />
      </div>
    );
  }

  const displayProblems = mode === 'daily' ? dailyProblems : problems;

  // In daily mode, ProblemList only sees the day's subset.
  // Wrap onUpdate so add/delete operate on the full list to avoid data loss.
  const handleListUpdate = useCallback((nextOrUpdater) => {
    if (mode === 'all') {
      onUpdate(nextOrUpdater);
      return;
    }
    // Daily mode: merge changes back into the full list
    const nextDaily = typeof nextOrUpdater === 'function'
      ? nextOrUpdater(dailyProblems)
      : nextOrUpdater;
    const dailyIds = new Set(dailyProblems.map(p => p.id));
    const nextDailyIds = new Set(nextDaily.map(p => p.id));
    // Keep all non-daily problems, remove daily ones that were deleted, add new ones
    const otherProblems = problems.filter(p => !dailyIds.has(p.id));
    onUpdate([...nextDaily, ...otherProblems]);
  }, [mode, onUpdate, problems, dailyProblems]);

  return (
    <div className="adhoc-wrap">
      <style>{STYLES}</style>

      <div className="adhoc-header">
        <div>
          <h2 className="adhoc-title">Adhoc Problems</h2>
          <p className="adhoc-subtitle">Practice problems you add daily — track, solve & review</p>
        </div>
        <div className="adhoc-mode-toggle">
          <button
            className={`adhoc-mode-btn${mode === 'daily' ? ' active' : ''}`}
            onClick={() => setMode('daily')}
          >
            📅 Daily
          </button>
          <button
            className={`adhoc-mode-btn${mode === 'all' ? ' active' : ''}`}
            onClick={() => setMode('all')}
          >
            📋 All
          </button>
        </div>
      </div>

      {mode === 'daily' && (
        <div className="adhoc-daily-nav">
          <button className="adhoc-nav-btn" onClick={goToPrev} title="Previous day">◀</button>
          <span className="adhoc-date-label">{formatDateLabel(currentDate)}</span>
          <button className="adhoc-nav-btn" onClick={goToNext} title="Next day">▶</button>
          {currentDate !== todayKey() && (
            <button className="adhoc-today-btn" onClick={goToToday}>Today</button>
          )}
          <div className="adhoc-daily-stats">
            <span className="adhoc-stat"><strong>{dailyStats.total}</strong> added</span>
            <span className="adhoc-stat"><strong>{dailyStats.solved}</strong> solved</span>
            <span className="adhoc-stat"><strong>{dailyStats.attempted}</strong> attempted</span>
          </div>
        </div>
      )}

      <div className="adhoc-body">
        <ProblemList
          problems={displayProblems}
          onUpdate={handleListUpdate}
          onOpenProblem={onOpenProblem}
          hideHeader
        />
      </div>
    </div>
  );
}
