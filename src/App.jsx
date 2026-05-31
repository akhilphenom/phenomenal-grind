import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import DateNav from './components/DateNav';
import DashboardView from './components/DashboardView';
import CompetitiveView from './components/CompetitiveView';
import SystemDesignView from './components/SystemDesignView';
import RoutineView from './components/RoutineView';
import ProblemList from './components/ProblemList';
import ProblemDetail from './components/ProblemDetail';
import NotesView from './components/NotesView';
import {
  fetchProblems, updateProblem as apiUpdateProblem,
  addProblem as apiAddProblem, deleteProblem as apiDeleteProblem,
  fetchAllDaily, saveDaily,
  fetchNotes, addNote as apiAddNote, updateNote as apiUpdateNote, deleteNote as apiDeleteNote,
  fetchPreferences, savePreferences,
} from './api';

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', sub: 'Your daily grind overview' },
  competitive: { title: 'Competitive Programming', sub: 'LeetCode • Codeforces • AtCoder' },
  problems: { title: 'Problem Tracker', sub: 'Track, solve & review coding problems' },
  systemdesign: { title: 'System Design', sub: 'HLD • LLD • Core Concepts' },
  routine: { title: 'Daily Journal', sub: 'Reflect • Learn • Grow' },
  notes: { title: 'Notes', sub: 'Organize your knowledge — Obsidian style' },
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [date, setDate] = useState(todayKey);
  const [allData, setAllData] = useState({});
  const [problems, setProblems] = useState([]);
  const [notes, setNotes] = useState([]);
  const [openProblem, setOpenProblem] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [prefs, setPrefs] = useState({});
  const saveTimer = useRef(null);
  const prefsTimer = useRef(null);

  // Load all data from json-server on mount
  useEffect(() => {
    Promise.all([fetchAllDaily(), fetchProblems(), fetchNotes(), fetchPreferences()])
      .then(([daily, probs, notesData, prefsData]) => {
        setAllData(daily);
        setProblems(probs);
        setNotes(notesData);
        if (prefsData.activeView) setActiveTab(prefsData.activeView);
        setPrefs(prefsData);
        setLoaded(true);
      })
      .catch((e) => {
        console.error('Failed to load data:', e);
        setLoaded(true);
      });
  }, []);

  // Save preferences (debounced)
  const updatePrefs = useCallback((patch) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch };
      clearTimeout(prefsTimer.current);
      prefsTimer.current = setTimeout(() => {
        savePreferences(next).catch(e => console.error('Prefs save failed:', e));
      }, 300);
      return next;
    });
  }, []);

  // Persist activeTab to prefs
  const handleSetActiveTab = useCallback((tab) => {
    setActiveTab(tab);
    updatePrefs({ activeView: tab });
  }, [updatePrefs]);

  // Debounced save for daily data
  const saveDayData = useCallback((dateKey, data) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDaily(dateKey, data).catch((e) => console.error('Save failed:', e));
    }, 400);
  }, []);

  const dayData = allData[date] || {};

  const updateSection = useCallback((section, value) => {
    setAllData((prev) => {
      const updated = { ...(prev[date] || {}), [section]: value };
      saveDayData(date, updated);
      return { ...prev, [date]: updated };
    });
  }, [date, saveDayData]);

  // Problem CRUD — update both local state and API
  const handleUpdateProblem = useCallback((updated) => {
    setProblems((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
    setOpenProblem((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
    apiUpdateProblem(updated).catch((e) => console.error('Problem update failed:', e));
  }, []);

  const handleSetProblems = useCallback((newProblemsOrUpdater) => {
    setProblems((prev) => {
      const next = typeof newProblemsOrUpdater === 'function'
        ? newProblemsOrUpdater(prev)
        : newProblemsOrUpdater;

      // Detect additions and deletions
      const prevIds = new Set(prev.map((p) => p.id));
      const nextIds = new Set(next.map((p) => p.id));

      // New problems
      for (const p of next) {
        if (!prevIds.has(p.id)) {
          apiAddProblem(p).catch((e) => console.error('Add failed:', e));
        }
      }
      // Deleted problems
      for (const p of prev) {
        if (!nextIds.has(p.id)) {
          apiDeleteProblem(p.id).catch((e) => console.error('Delete failed:', e));
        }
      }

      return next;
    });
  }, []);

  // Notes CRUD
  const handleAddNote = useCallback((parentId) => {
    const note = {
      id: `note-${Date.now()}`,
      title: 'Untitled',
      parentId: parentId || null,
      type: 'note',
      content: '',
      rough: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [...prev, note]);
    apiAddNote(note).catch((e) => console.error('Add note failed:', e));
  }, []);

  const handleAddFolder = useCallback((parentId) => {
    const folder = {
      id: `folder-${Date.now()}`,
      title: 'New Folder',
      parentId: parentId || null,
      type: 'folder',
      content: '',
      rough: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [...prev, folder]);
    apiAddNote(folder).catch((e) => console.error('Add folder failed:', e));
  }, []);

  const noteSaveTimer = useRef(null);
  const handleUpdateNote = useCallback((updated) => {
    const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
    setNotes((prev) => prev.map((n) => (n.id === withTimestamp.id ? withTimestamp : n)));
    clearTimeout(noteSaveTimer.current);
    noteSaveTimer.current = setTimeout(() => {
      apiUpdateNote(withTimestamp).catch((e) => console.error('Update note failed:', e));
    }, 400);
  }, []);

  const handleDeleteNote = useCallback((id) => {
    // Delete the item and all children recursively
    setNotes((prev) => {
      const toDelete = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const n of prev) {
          if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
            toDelete.add(n.id);
            changed = true;
          }
        }
      }
      toDelete.forEach((delId) => {
        apiDeleteNote(delId).catch((e) => console.error('Delete note failed:', e));
      });
      return prev.filter((n) => !toDelete.has(n.id));
    });
  }, []);

  // Calculate streak
  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${dy}`;
      const entry = allData[key];
      if (!entry) { if (i > 0) break; else continue; }
      const comp = entry.competitive || {};
      const lc = comp.leetcode || {};
      const cf = comp.codeforces || {};
      const at = comp.atcoder || {};
      const sd = entry.systemDesign || {};
      let score = (lc.easy||0)+(lc.medium||0)+(lc.hard||0)
        +(cf.div1||0)+(cf.div2||0)+(cf.div3||0)+(cf.div4||0)
        +(at.abc||0)+(at.arc||0)+(at.agc||0)
        +(sd.hld?.count||0)+(sd.lld?.count||0)+(sd.concepts?.count||0);
      if (score > 0) count++;
      else if (i > 0) break;
    }
    return count;
  }, [allData]);

  const info = PAGE_TITLES[activeTab];
  const showingProblemDetail = activeTab === 'problems' && openProblem;
  const hideHeader = showingProblemDetail || activeTab === 'notes';

  if (!loaded) {
    return (
      <div className="app-layout">
        <Sidebar activeTab={activeTab} onTabChange={handleSetActiveTab} streak={0} />
        <div className="content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={(tab) => { handleSetActiveTab(tab); setOpenProblem(null); }} streak={streak} />

      <div className="content-area">
        {!hideHeader && (
          <header className="page-header">
            <div>
              <h1 className="page-title">{info.title}</h1>
              <p className="page-subtitle">{info.sub}</p>
            </div>
            {activeTab !== 'problems' && <DateNav date={date} onDateChange={setDate} />}
          </header>
        )}

        <main className={`page-content${showingProblemDetail || activeTab === 'notes' ? ' full-height' : ''}`}>
          {activeTab === 'dashboard' && (
            <DashboardView
              allData={allData}
              date={date}
              onUpdateChecklist={(list) => updateSection('checklist', list)}
            />
          )}
          {activeTab === 'competitive' && (
            <CompetitiveView
              dayData={dayData}
              onUpdate={(v) => updateSection('competitive', v)}
            />
          )}
          {activeTab === 'problems' && !openProblem && (
            <ProblemList
              problems={problems}
              onUpdate={handleSetProblems}
              onOpenProblem={setOpenProblem}
            />
          )}
          {activeTab === 'problems' && openProblem && (
            <ProblemDetail
              problem={openProblem}
              onUpdate={handleUpdateProblem}
              onBack={() => setOpenProblem(null)}
            />
          )}
          {activeTab === 'systemdesign' && (
            <SystemDesignView
              dayData={dayData}
              onUpdate={(v) => updateSection('systemDesign', v)}
            />
          )}
          {activeTab === 'routine' && (
            <RoutineView
              dayData={dayData}
              onUpdate={(v) => updateSection('routine', v)}
            />
          )}
          {activeTab === 'notes' && (
            <NotesView
              notes={notes}
              onAddNote={handleAddNote}
              onAddFolder={handleAddFolder}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              prefs={prefs.notes || {}}
              onPrefsChange={(notePrefs) => updatePrefs({ notes: { ...(prefs.notes || {}), ...notePrefs } })}
            />
          )}
        </main>
      </div>
    </div>
  );
}
