import { useMemo, useState } from 'react';

const DEFAULT_CHECKLIST = [
  'Solve LeetCode problems',
  'System Design study',
  'Drink 8 glasses of water',
  'Exercise / Workout',
  'Log sleep schedule',
  'Write daily journal',
];

const DASHBOARD_STYLES = `
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dash-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.dash-stat-card,
.dash-heatmap,
.dash-checklist,
.dash-weekly {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)), var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
}

.dash-stat-card {
  min-height: 148px;
  padding: 22px 20px 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.dash-stat-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
}

.dash-stat-card.problems::before {
  background: linear-gradient(180deg, #fb923c, var(--orange));
}

.dash-stat-card.streak::before {
  background: linear-gradient(180deg, #4ade80, var(--green));
}

.dash-stat-card.water::before {
  background: linear-gradient(180deg, #38bdf8, #14b8a6);
}

.dash-stat-card.work::before {
  background: linear-gradient(180deg, #22d3ee, #06b6d4);
}

.dash-stat-icon {
  font-size: 1.85rem;
  line-height: 1;
}

.dash-stat-value {
  font-size: clamp(1.9rem, 3vw, 2.35rem);
  font-weight: 800;
  color: var(--text);
  line-height: 1;
}

.dash-stat-label {
  font-size: 0.82rem;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dash-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.dash-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}

.dash-badge {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.dash-heatmap {
  padding: 16px;
}

.heatmap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.heatmap-year-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
}

.heatmap-year-btn {
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  width: 24px;
  height: 24px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.15s;
}
.heatmap-year-btn:hover {
  border-color: var(--accent);
  color: var(--text);
}

.heatmap-year-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text);
  min-width: 40px;
  text-align: center;
}

.heatmap-total-count {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 500;
}

.heatmap-months {
  --label-width: 30px;
  display: flex;
  padding-left: var(--label-width);
  gap: 0;
  margin-bottom: 4px;
  color: var(--text-muted);
  font-size: 0.62rem;
  font-weight: 600;
}

.heatmap-month-label {
  flex: 1;
  min-width: 0;
}

.heatmap-layout {
  --label-width: 30px;
  display: grid;
  grid-template-columns: var(--label-width) 1fr;
  gap: 4px;
  align-items: start;
}

.heatmap-y-axis {
  display: grid;
  grid-template-rows: repeat(7, 13px);
  gap: 3px;
}

.heatmap-day-label {
  font-size: 0.6rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  height: 13px;
}

.heatmap-grid {
  display: grid;
  gap: 3px;
  padding-bottom: 4px;
}

.heatmap-week {
  display: grid;
  grid-template-rows: repeat(7, 13px);
  gap: 3px;
}

.heatmap-cell {
  width: 13px;
  height: 13px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.heatmap-cell.future {
  background: rgba(255, 255, 255, 0.03) !important;
  border-color: rgba(255, 255, 255, 0.04);
}

.heatmap-cell:hover {
  transform: scale(1.2);
  border-color: rgba(255, 255, 255, 0.16);
}

.heatmap-cell.level-0 { background: rgba(255,255,255,0.04); }
.heatmap-cell.level-1 { background: rgba(124, 92, 252, 0.3); }
.heatmap-cell.level-2 { background: rgba(124, 92, 252, 0.55); }
.heatmap-cell.level-3 { background: rgba(157, 132, 253, 0.78); }
.heatmap-cell.level-4 { background: var(--accent-light); }

.heatmap-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.heatmap-legend {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.76rem;
}

.heatmap-legend-boxes {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.heatmap-legend-box {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid rgba(255,255,255,0.08);
}

.heatmap-legend-box.level-0 { background: rgba(255,255,255,0.04); }
.heatmap-legend-box.level-1 { background: rgba(124, 92, 252, 0.3); }
.heatmap-legend-box.level-2 { background: rgba(124, 92, 252, 0.55); }
.heatmap-legend-box.level-3 { background: rgba(157, 132, 253, 0.78); }
.heatmap-legend-box.level-4 { background: var(--accent-light); }

.dash-bottom-row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 18px;
}

.dash-checklist,
.dash-weekly {
  padding: 22px;
}

.checklist-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface2);
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
}

.checklist-item:hover {
  border-color: rgba(124, 92, 252, 0.5);
  transform: translateY(-1px);
}

.checklist-item input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  cursor: pointer;
}

.checklist-item span {
  color: var(--text);
  font-size: 0.95rem;
}

.checklist-item.done span {
  color: var(--text-muted);
  text-decoration: line-through;
}

.weekly-chart {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
  min-height: 250px;
}

.weekly-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.weekly-value {
  font-size: 0.76rem;
  color: var(--text-muted);
  min-height: 16px;
}

.weekly-bar-wrap {
  width: 100%;
  height: 170px;
  display: flex;
  align-items: flex-end;
}

.weekly-bar {
  width: 100%;
  min-width: 22px;
  border-radius: 12px 12px 6px 6px;
  background: linear-gradient(180deg, var(--accent-light), var(--accent));
  box-shadow: 0 12px 24px rgba(124, 92, 252, 0.28);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.weekly-bar:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.weekly-day-label {
  font-size: 0.78rem;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .dash-bottom-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dash-heatmap,
  .dash-checklist,
  .dash-weekly {
    padding: 18px;
  }

  .heatmap-grid {
    gap: 4px;
  }

  .heatmap-week {
    gap: 4px;
  }

  .weekly-chart {
    gap: 8px;
  }
}
`;

function normalizeDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`);
}

function parseTime(value) {
  if (!value || typeof value !== 'string') return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function getProblemCount(dayData) {
  const lc = dayData?.competitive?.leetcode || {};
  const cf = dayData?.competitive?.codeforces || {};
  const at = dayData?.competitive?.atcoder || {};

  return (
    (lc.easy || 0) +
    (lc.medium || 0) +
    (lc.hard || 0) +
    (cf.div1 || 0) +
    (cf.div2 || 0) +
    (cf.div3 || 0) +
    (cf.div4 || 0) +
    (at.abc || 0) +
    (at.arc || 0) +
    (at.agc || 0)
  );
}

function getSystemDesignCount(dayData) {
  const sd = dayData?.systemDesign || {};
  return (sd.hld?.count || 0) + (sd.lld?.count || 0) + (sd.concepts?.count || 0);
}

function getChecklistDoneCount(dayData) {
  if (!Array.isArray(dayData?.checklist)) return 0;
  return dayData.checklist.reduce((count, item) => count + (item?.done ? 1 : 0), 0);
}

function getActivityScore(dayData) {
  if (!dayData) return 0;

  let score = getProblemCount(dayData) + getSystemDesignCount(dayData) + getChecklistDoneCount(dayData);

  if (dayData?.routine?.exercise?.done) score += 1;
  if (dayData?.routine?.journal) score += 1;
  if ((dayData?.routine?.water || 0) > 0) score += 1;
  if (dayData?.routine?.sleep?.bedtime || dayData?.routine?.sleep?.wakeUp) score += 1;
  if (dayData?.routine?.work?.clockIn || dayData?.routine?.work?.clockOut) score += 1;

  return score;
}

function getHeatmapLevel(score) {
  if (score <= 0) return 0;
  if (score <= 2) return 1;
  if (score <= 4) return 2;
  if (score <= 6) return 3;
  return 4;
}

function getWorkHours(routine) {
  const start = parseTime(routine?.work?.clockIn);
  const end = parseTime(routine?.work?.clockOut);

  if (start == null || end == null) return 0;

  const diff = end >= start ? end - start : 24 * 60 - start + end;
  return diff / 60;
}

function formatHours(hours) {
  if (!hours) return '0h';
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}h` : `${rounded.toFixed(1)}h`;
}

function getChecklistItems(allData, date) {
  const stored = allData?.[date]?.checklist;

  if (Array.isArray(stored) && stored.length > 0) {
    return stored.map((item) => ({
      text: typeof item === 'string' ? item : item?.text || '',
      done: Boolean(typeof item === 'string' ? false : item?.done),
    }));
  }

  return DEFAULT_CHECKLIST.map((text) => ({ text, done: false }));
}

export default function DashboardView({ allData = {}, date, onUpdateChecklist }) {
  const selectedDate = date || normalizeDateKey(new Date());
  const selectedDay = allData[selectedDate] || {};
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());

  const checklistItems = useMemo(() => getChecklistItems(allData, selectedDate), [allData, selectedDate]);

  const stats = useMemo(() => {
    const problemsToday = getProblemCount(selectedDay);
    const checklistDone = getChecklistDoneCount(selectedDay);
    const checklistTotal = Array.isArray(selectedDay?.checklist) ? selectedDay.checklist.length : DEFAULT_CHECKLIST.length;
    const journalBody = selectedDay?.routine?.body || '';
    const journalWords = journalBody.trim() ? journalBody.trim().split(/\s+/).length : 0;

    let streak = 0;
    const cursor = parseDateKey(selectedDate);

    for (let i = 0; i < 365; i += 1) {
      const day = new Date(cursor);
      day.setDate(cursor.getDate() - i);
      const key = normalizeDateKey(day);
      const score = getActivityScore(allData[key]);

      if (score > 0) {
        streak += 1;
      } else {
        break;
      }
    }

    return {
      problemsToday,
      checklistDone,
      checklistTotal,
      journalWords,
      streak,
    };
  }, [allData, selectedDate, selectedDay]);

  const heatmap = useMemo(() => {
    const weeks = [];
    const jan1 = new Date(heatmapYear, 0, 1);
    const dec31 = new Date(heatmapYear, 11, 31);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from the Sunday on or before Jan 1
    const startDay = new Date(jan1);
    startDay.setDate(jan1.getDate() - jan1.getDay());

    // End on the Saturday on or after Dec 31
    const endDay = new Date(dec31);
    if (endDay.getDay() < 6) endDay.setDate(dec31.getDate() + (6 - dec31.getDay()));

    const cursor = new Date(startDay);
    let totalScore = 0;

    while (cursor <= endDay) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const current = new Date(cursor);
        const key = normalizeDateKey(current);
        const inYear = current.getFullYear() === heatmapYear;
        const isFuture = current > today;
        const score = inYear && !isFuture ? getActivityScore(allData[key]) : 0;
        if (inYear && !isFuture) totalScore += score;
        week.push({
          date: current,
          key,
          score,
          level: inYear ? (isFuture ? -1 : getHeatmapLevel(score)) : -2,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    return { weeks, totalScore };
  }, [allData, heatmapYear]);

  const monthLabels = useMemo(() => {
    const labels = [];
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const { weeks } = heatmap;

    for (let m = 0; m < 12; m++) {
      // Find the first week that contains a day in this month within the year
      const weekIdx = weeks.findIndex((week) =>
        week.some((day) => day.date.getMonth() === m && day.date.getFullYear() === heatmapYear)
      );
      labels.push({ label: MONTHS[m], weekIdx });
    }
    return labels;
  }, [heatmap, heatmapYear]);

  const weeklyProgress = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const selected = parseDateKey(selectedDate);
    const weekStart = new Date(selected);
    weekStart.setDate(selected.getDate() - selected.getDay());

    const items = labels.map((label, index) => {
      const current = new Date(weekStart);
      current.setDate(weekStart.getDate() + index);
      const key = normalizeDateKey(current);
      const count = getProblemCount(allData[key]);
      return { label, key, count };
    });

    const max = Math.max(...items.map((item) => item.count), 1);

    return items.map((item) => ({
      ...item,
      height: item.count > 0 ? Math.max((item.count / max) * 100, 10) : 0,
    }));
  }, [allData, selectedDate]);

  const handleToggleChecklist = (index) => {
    const updated = checklistItems.map((item, itemIndex) =>
      itemIndex === index ? { ...item, done: !item.done } : item
    );

    onUpdateChecklist?.(updated);
  };

  return (
    <div className="dashboard-view">
      <style>{DASHBOARD_STYLES}</style>

      <div className="dash-stats">
        <article className="dash-stat-card problems">
          <div className="dash-stat-icon" aria-hidden="true">⚡</div>
          <div className="dash-stat-value">{stats.problemsToday}</div>
          <div className="dash-stat-label">Problems Today</div>
        </article>

        <article className="dash-stat-card streak">
          <div className="dash-stat-icon" aria-hidden="true">🔥</div>
          <div className="dash-stat-value">{stats.streak}</div>
          <div className="dash-stat-label">Day Streak</div>
        </article>

        <article className="dash-stat-card water">
          <div className="dash-stat-icon" aria-hidden="true">✅</div>
          <div className="dash-stat-value">{stats.checklistDone}/{stats.checklistTotal}</div>
          <div className="dash-stat-label">Checklist Done</div>
        </article>

        <article className="dash-stat-card work">
          <div className="dash-stat-icon" aria-hidden="true">📝</div>
          <div className="dash-stat-value">{stats.journalWords}</div>
          <div className="dash-stat-label">Journal Words</div>
        </article>
      </div>

      <section className="dash-heatmap">
        <div className="heatmap-header">
          <div>
            <h3 className="dash-card-title">📅 Activity Heatmap</h3>
            <span className="heatmap-total-count">{heatmap.totalScore} contributions in {heatmapYear}</span>
          </div>
          <div className="heatmap-year-toggle">
            <button className="heatmap-year-btn" onClick={() => setHeatmapYear((y) => y - 1)}>◀</button>
            <span className="heatmap-year-label">{heatmapYear}</span>
            <button className="heatmap-year-btn" onClick={() => setHeatmapYear((y) => y + 1)}>▶</button>
          </div>
        </div>

        <div className="heatmap-months">
          {monthLabels.map((m, i) => {
            const totalWeeks = heatmap.weeks.length;
            const nextIdx = i < 11 ? monthLabels[i + 1].weekIdx : totalWeeks;
            const span = nextIdx - m.weekIdx;
            return (
              <div
                key={m.label}
                className="heatmap-month-label"
                style={{ flex: `${span} 0 0`, minWidth: 0 }}
              >
                {span >= 2 ? m.label : ''}
              </div>
            );
          })}
        </div>

        <div className="heatmap-layout">
          <div className="heatmap-y-axis" aria-hidden="true">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, index) => (
              <div className="heatmap-day-label" key={`label-${index}`}>{index % 2 === 1 ? label : ''}</div>
            ))}
          </div>

          <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${heatmap.weeks.length}, 1fr)` }}>
            {heatmap.weeks.map((week, weekIndex) => (
              <div className="heatmap-week" key={`week-${weekIndex}`}>
                {week.map((day) => (
                  <div
                    key={day.key}
                    className={`heatmap-cell${day.level === -2 ? ' hidden' : day.level === -1 ? ' future level-0' : ` level-${day.level}`}`}
                    title={day.level === -2 ? '' : day.level === -1 ? `${day.key} (future)` : `${day.key} — ${day.score} activity`}
                    style={day.level === -2 ? { visibility: 'hidden' } : undefined}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="heatmap-footer">
          <div className="heatmap-legend">
            <span>Less</span>
            <div className="heatmap-legend-boxes">
              {[0, 1, 2, 3, 4].map((level) => (
                <span key={`legend-${level}`} className={`heatmap-legend-box level-${level}`} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </section>

      <div className="dash-bottom-row">
        <section className="dash-checklist">
          <div className="dash-card-header">
            <h3 className="dash-card-title">📋 Today's Checklist</h3>
          </div>

          <div className="checklist-list">
            {checklistItems.map((item, index) => (
              <label
                key={`${item.text}-${index}`}
                className={`checklist-item${item.done ? ' done' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => handleToggleChecklist(index)}
                />
                <span>{item.text}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="dash-weekly">
          <div className="dash-card-header">
            <h3 className="dash-card-title">📊 Weekly Progress</h3>
          </div>

          <div className="weekly-chart">
            {weeklyProgress.map((item) => (
              <div className="weekly-day" key={item.key}>
                <div className="weekly-value">{item.count}</div>
                <div className="weekly-bar-wrap">
                  <div
                    className="weekly-bar"
                    style={{ height: `${item.height}%`, opacity: item.count > 0 ? 1 : 0.2 }}
                    title={`${item.label} — ${item.count} problems`}
                  />
                </div>
                <div className="weekly-day-label">{item.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
