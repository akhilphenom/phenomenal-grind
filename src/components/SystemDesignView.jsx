const HLD_SYSTEMS = [
  'URL Shortener',
  'Twitter',
  'Instagram',
  'WhatsApp',
  'YouTube',
  'Netflix',
  'Uber',
  'Dropbox',
  'Google Maps',
  'Rate Limiter',
  'Cache System',
  'Notifications',
  'Search Engine',
  'E-commerce',
];

const LLD_PATTERNS = [
  'SOLID',
  'Design Patterns',
  'OOP',
  'Parking Lot',
  'Elevator',
  'Chess',
  'BookMyShow',
  'Splitwise',
  'Snake Game',
  'ATM',
  'State Machine',
  'Pub/Sub',
];

const CORE_TOPICS = [
  'CAP Theorem',
  'Load Balancing',
  'Caching',
  'DB Sharding',
  'Consistent Hash',
  'Message Queues',
  'CDN',
  'API Gateway',
  'Microservices',
  'SQL vs NoSQL',
  'Replication',
  'Consensus',
];

const DEFAULT_SYSTEM_DESIGN = {
  hld: { count: 0, systems: [], notes: '' },
  lld: { count: 0, patterns: [], notes: '' },
  concepts: { count: 0, topics: [], notes: '' },
};

function Counter({ value, onInc, onDec }) {
  return (
    <div className="counter-controls">
      <button type="button" onClick={onDec}>−</button>
      <span className="counter-value">{value}</span>
      <button type="button" onClick={onInc}>+</button>
    </div>
  );
}

function normalizeSystemDesign(systemDesign) {
  return {
    hld: { ...DEFAULT_SYSTEM_DESIGN.hld, ...(systemDesign?.hld || {}) },
    lld: { ...DEFAULT_SYSTEM_DESIGN.lld, ...(systemDesign?.lld || {}) },
    concepts: { ...DEFAULT_SYSTEM_DESIGN.concepts, ...(systemDesign?.concepts || {}) },
  };
}

function toggleItem(list, item) {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

function SectionCard({
  title,
  emoji,
  counterLabel,
  value,
  onInc,
  onDec,
  tagLabel,
  items,
  selectedItems,
  onToggle,
  notes,
  notesPlaceholder,
  onNotesChange,
}) {
  return (
    <div className="sd-card">
      <div className="sd-header">
        <h2>
          <span>{emoji}</span>
          <span>{title}</span>
        </h2>
      </div>

      <div className="sd-counter-row">
        <span>{counterLabel}</span>
        <Counter value={value} onInc={onInc} onDec={onDec} />
      </div>

      <div className="sd-block-label">{tagLabel}</div>
      <div className="sd-pills">
        {items.map((item) => {
          const active = selectedItems.includes(item);
          return (
            <button
              key={item}
              type="button"
              className={`sd-pill${active ? ' active' : ''}`}
              onClick={() => onToggle(item)}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className="sd-block-label">📝 NOTES</div>
      <textarea
        className="sd-notes"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder={notesPlaceholder}
      />
    </div>
  );
}

export default function SystemDesignView({ dayData, onUpdate }) {
  const systemDesign = normalizeSystemDesign(dayData?.systemDesign);

  const updateSystemDesign = (next) => {
    onUpdate(next);
  };

  const updateSection = (section, patch) => {
    updateSystemDesign({
      ...systemDesign,
      [section]: {
        ...systemDesign[section],
        ...patch,
      },
    });
  };

  return (
    <div className="sd-section">
      <style>{`
        .sd-section {
          color: var(--text);
        }

        .sd-page-title {
          margin-bottom: 20px;
        }

        .sd-page-title h1 {
          margin: 0;
          font-size: 2rem;
          line-height: 1.1;
        }

        .sd-page-title p {
          margin: 6px 0 0;
          color: var(--text-muted);
        }

        .sd-layout {
          display: grid;
          gap: 16px;
        }

        .sd-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .sd-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.02) inset;
        }

        .sd-header {
          margin-bottom: 16px;
        }

        .sd-header h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-size: 1.1rem;
        }

        .sd-counter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border: 1px solid var(--border);
          border-radius: calc(var(--radius) - 4px);
          background: var(--surface2);
          margin-bottom: 16px;
        }

        .counter-controls {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .counter-controls button {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          cursor: pointer;
          font-size: 1rem;
        }

        .counter-controls button:hover,
        .sd-pill:hover {
          border-color: var(--accent);
        }

        .counter-value {
          min-width: 18px;
          text-align: center;
          font-weight: 700;
        }

        .sd-block-label {
          margin: 0 0 10px;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.08em;
        }

        .sd-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
        }

        .sd-pill {
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--text);
          border-radius: 999px;
          padding: 8px 12px;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .sd-pill.active {
          background: color-mix(in srgb, var(--accent) 18%, var(--surface));
          border-color: var(--accent);
          color: var(--accent);
        }

        .sd-notes {
          width: 100%;
          min-height: 120px;
          resize: vertical;
          border-radius: calc(var(--radius) - 4px);
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--text);
          padding: 12px 14px;
          font: inherit;
          outline: none;
          box-sizing: border-box;
        }

        .sd-notes::placeholder {
          color: var(--text-muted);
        }

        .sd-notes:focus {
          border-color: var(--accent);
        }

        @media (max-width: 900px) {
          .sd-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="sd-layout">
        <SectionCard
          title="High-Level Design (HLD)"
          emoji="🏗️"
          counterLabel="Systems studied today"
          value={systemDesign.hld.count}
          onInc={() => updateSection('hld', { count: systemDesign.hld.count + 1 })}
          onDec={() => updateSection('hld', { count: Math.max(0, systemDesign.hld.count - 1) })}
          tagLabel="SYSTEMS COVERED"
          items={HLD_SYSTEMS}
          selectedItems={systemDesign.hld.systems}
          onToggle={(item) => updateSection('hld', { systems: toggleItem(systemDesign.hld.systems, item) })}
          notes={systemDesign.hld.notes}
          notesPlaceholder="Key architecture decisions, trade-offs, patterns..."
          onNotesChange={(notes) => updateSection('hld', { notes })}
        />

        <div className="sd-grid">
          <SectionCard
            title="Low-Level Design (LLD)"
            emoji="🔧"
            counterLabel="Components designed today"
            value={systemDesign.lld.count}
            onInc={() => updateSection('lld', { count: systemDesign.lld.count + 1 })}
            onDec={() => updateSection('lld', { count: Math.max(0, systemDesign.lld.count - 1) })}
            tagLabel="PATTERNS & CONCEPTS"
            items={LLD_PATTERNS}
            selectedItems={systemDesign.lld.patterns}
            onToggle={(item) => updateSection('lld', { patterns: toggleItem(systemDesign.lld.patterns, item) })}
            notes={systemDesign.lld.notes}
            notesPlaceholder="Class diagrams, patterns used, code snippets..."
            onNotesChange={(notes) => updateSection('lld', { notes })}
          />

          <SectionCard
            title="Core Concepts"
            emoji="🌐"
            counterLabel="Concepts reviewed today"
            value={systemDesign.concepts.count}
            onInc={() => updateSection('concepts', { count: systemDesign.concepts.count + 1 })}
            onDec={() => updateSection('concepts', { count: Math.max(0, systemDesign.concepts.count - 1) })}
            tagLabel="TOPICS"
            items={CORE_TOPICS}
            selectedItems={systemDesign.concepts.topics}
            onToggle={(item) => updateSection('concepts', { topics: toggleItem(systemDesign.concepts.topics, item) })}
            notes={systemDesign.concepts.notes}
            notesPlaceholder="Concepts, definitions, trade-offs learned..."
            onNotesChange={(notes) => updateSection('concepts', { notes })}
          />
        </div>
      </div>
    </div>
  );
}
