import { useMemo } from 'react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'competitive', label: 'Competitive', icon: '⟨/⟩' },
  { id: 'problems', label: 'Problems', icon: '📋' },
  { id: 'adhoc', label: 'Adhoc Problems', icon: '🎯' },
  { id: 'systemdesign', label: 'System Design', icon: '⚙' },
  { id: 'routine', label: 'Journal', icon: '📓' },
  { id: 'notes', label: 'Notes', icon: '🗒️' },
];

export default function Sidebar({ activeTab, onTabChange, streak }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand" onClick={() => onTabChange('dashboard')}>
        <span className="brand-icon">🔥</span>
        <div>
          <div className="brand-name">Phenomenal</div>
          <div className="brand-sub">GRIND</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item${activeTab === item.id ? ' active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="streak-badge">🔥 <strong>{streak}</strong> day streak</span>
      </div>
    </aside>
  );
}
