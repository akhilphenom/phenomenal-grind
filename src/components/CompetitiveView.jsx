const COMPETITIVE_DEFAULTS = {
  leetcode: { easy: 0, medium: 0, hard: 0, topics: [], notes: '' },
  codeforces: { div4: 0, div3: 0, div2: 0, div1: 0, contestName: '', rank: '', notes: '' },
  atcoder: { abc: 0, arc: 0, agc: 0, notes: '' },
};

const LEETCODE_TOPICS = [
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
  'Bit Manip',
  'Trie',
  'Union Find',
];

function Counter({ value, onInc, onDec, label, color }) {
  return (
    <div className="counter-box">
      {label && <div className="counter-label" style={color ? { color } : {}}>{label}</div>}
      <div className="counter-controls">
        <button type="button" onClick={onDec}>−</button>
        <span className="counter-value">{value}</span>
        <button type="button" onClick={onInc}>+</button>
      </div>
    </div>
  );
}

function mergeCompetitive(data) {
  const competitive = data?.competitive || {};

  return {
    leetcode: {
      ...COMPETITIVE_DEFAULTS.leetcode,
      ...(competitive.leetcode || {}),
      topics: Array.isArray(competitive.leetcode?.topics) ? competitive.leetcode.topics : [],
    },
    codeforces: {
      ...COMPETITIVE_DEFAULTS.codeforces,
      ...(competitive.codeforces || {}),
    },
    atcoder: {
      ...COMPETITIVE_DEFAULTS.atcoder,
      ...(competitive.atcoder || {}),
    },
  };
}

function safeCount(value) {
  return Math.max(0, Number(value) || 0);
}

export default function CompetitiveView({ dayData, onUpdate }) {
  const competitive = mergeCompetitive(dayData);
  const leetcodeTotal = competitive.leetcode.easy + competitive.leetcode.medium + competitive.leetcode.hard;
  const codeforcesTotal = competitive.codeforces.div4 + competitive.codeforces.div3 + competitive.codeforces.div2 + competitive.codeforces.div1;
  const atcoderTotal = competitive.atcoder.abc + competitive.atcoder.arc + competitive.atcoder.agc;

  const updateCompetitive = (section, patch) => {
    onUpdate({
      ...competitive,
      [section]: {
        ...competitive[section],
        ...patch,
      },
    });
  };

  const updateCounter = (section, key, delta) => {
    updateCompetitive(section, {
      [key]: Math.max(0, safeCount(competitive[section][key]) + delta),
    });
  };

  const toggleTopic = (topic) => {
    const currentTopics = competitive.leetcode.topics;
    const nextTopics = currentTopics.includes(topic)
      ? currentTopics.filter((item) => item !== topic)
      : [...currentTopics, topic];

    updateCompetitive('leetcode', { topics: nextTopics });
  };

  return (
    <div className="competitive-view">
      <section className="competitive-card competitive-card-full competitive-leetcode-card">
        <div className="competitive-card-header">
          <div className="competitive-card-title-wrap">
            <span className="competitive-card-icon" aria-hidden="true">🟡</span>
            <h3 className="competitive-card-title">LeetCode</h3>
          </div>
          <span className="competitive-badge">Primary Focus</span>
        </div>

        <div className="competitive-counter-grid competitive-counter-grid-three">
          <Counter
            label="EASY"
            color="var(--green)"
            value={competitive.leetcode.easy}
            onDec={() => updateCounter('leetcode', 'easy', -1)}
            onInc={() => updateCounter('leetcode', 'easy', 1)}
          />
          <Counter
            label="MEDIUM"
            color="var(--yellow)"
            value={competitive.leetcode.medium}
            onDec={() => updateCounter('leetcode', 'medium', -1)}
            onInc={() => updateCounter('leetcode', 'medium', 1)}
          />
          <Counter
            label="HARD"
            color="var(--red)"
            value={competitive.leetcode.hard}
            onDec={() => updateCounter('leetcode', 'hard', -1)}
            onInc={() => updateCounter('leetcode', 'hard', 1)}
          />
        </div>

        <div className="competitive-total-row">
          <span className="competitive-total-label">Total today:</span>
          <span className="competitive-total-value">{leetcodeTotal}</span>
        </div>

        <div className="competitive-section-block">
          <div className="competitive-section-heading">TOPICS COVERED</div>
          <div className="competitive-topic-pills">
            {LEETCODE_TOPICS.map((topic) => {
              const selected = competitive.leetcode.topics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  className={`competitive-topic-pill${selected ? ' selected' : ''}`}
                  onClick={() => toggleTopic(topic)}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </div>

        <div className="competitive-section-block">
          <label className="competitive-section-heading" htmlFor="leetcode-notes">📝 NOTES</label>
          <textarea
            id="leetcode-notes"
            className="competitive-notes-textarea"
            value={competitive.leetcode.notes}
            onChange={(e) => updateCompetitive('leetcode', { notes: e.target.value })}
            placeholder="Notes, patterns, mistakes, or takeaways..."
          />
        </div>
      </section>

      <div className="competitive-secondary-grid">
        <section className="competitive-card competitive-platform-card">
          <div className="competitive-card-header">
            <div className="competitive-card-title-wrap">
              <span className="competitive-card-icon" aria-hidden="true">🔵</span>
              <h3 className="competitive-card-title">Codeforces</h3>
            </div>
          </div>

          <div className="competitive-counter-grid competitive-counter-grid-four">
            <Counter
              label="DIV 4"
              value={competitive.codeforces.div4}
              onDec={() => updateCounter('codeforces', 'div4', -1)}
              onInc={() => updateCounter('codeforces', 'div4', 1)}
            />
            <Counter
              label="DIV 3"
              color="var(--green)"
              value={competitive.codeforces.div3}
              onDec={() => updateCounter('codeforces', 'div3', -1)}
              onInc={() => updateCounter('codeforces', 'div3', 1)}
            />
            <Counter
              label="DIV 2"
              color="var(--yellow)"
              value={competitive.codeforces.div2}
              onDec={() => updateCounter('codeforces', 'div2', -1)}
              onInc={() => updateCounter('codeforces', 'div2', 1)}
            />
            <Counter
              label="DIV 1"
              color="var(--red)"
              value={competitive.codeforces.div1}
              onDec={() => updateCounter('codeforces', 'div1', -1)}
              onInc={() => updateCounter('codeforces', 'div1', 1)}
            />
          </div>

          <div className="competitive-total-row">
            <span className="competitive-total-label">Total today:</span>
            <span className="competitive-total-value">{codeforcesTotal}</span>
          </div>

          <div className="competitive-section-block">
            <div className="competitive-section-heading">CONTEST INFO</div>
            <div className="competitive-input-grid">
              <input
                className="competitive-text-input"
                type="text"
                value={competitive.codeforces.contestName}
                onChange={(e) => updateCompetitive('codeforces', { contestName: e.target.value })}
                placeholder="Contest name (e.g., CF Round #950)"
              />
              <input
                className="competitive-text-input"
                type="text"
                value={competitive.codeforces.rank}
                onChange={(e) => updateCompetitive('codeforces', { rank: e.target.value })}
                placeholder="Rank"
              />
            </div>
          </div>

          <div className="competitive-section-block">
            <label className="competitive-section-heading" htmlFor="codeforces-notes">📝 NOTES</label>
            <textarea
              id="codeforces-notes"
              className="competitive-notes-textarea"
              value={competitive.codeforces.notes}
              onChange={(e) => updateCompetitive('codeforces', { notes: e.target.value })}
              placeholder="Contest observations, hacks, mistakes, or editorials to revisit..."
            />
          </div>
        </section>

        <section className="competitive-card competitive-platform-card">
          <div className="competitive-card-header">
            <div className="competitive-card-title-wrap">
              <span className="competitive-card-icon" aria-hidden="true">⚪</span>
              <h3 className="competitive-card-title">AtCoder</h3>
            </div>
          </div>

          <div className="competitive-counter-grid competitive-counter-grid-three">
            <Counter
              label="ABC"
              value={competitive.atcoder.abc}
              onDec={() => updateCounter('atcoder', 'abc', -1)}
              onInc={() => updateCounter('atcoder', 'abc', 1)}
            />
            <Counter
              label="ARC"
              value={competitive.atcoder.arc}
              onDec={() => updateCounter('atcoder', 'arc', -1)}
              onInc={() => updateCounter('atcoder', 'arc', 1)}
            />
            <Counter
              label="AGC"
              value={competitive.atcoder.agc}
              onDec={() => updateCounter('atcoder', 'agc', -1)}
              onInc={() => updateCounter('atcoder', 'agc', 1)}
            />
          </div>

          <div className="competitive-total-row">
            <span className="competitive-total-label">Total today:</span>
            <span className="competitive-total-value">{atcoderTotal}</span>
          </div>

          <div className="competitive-section-block">
            <label className="competitive-section-heading" htmlFor="atcoder-notes">📝 NOTES</label>
            <textarea
              id="atcoder-notes"
              className="competitive-notes-textarea"
              value={competitive.atcoder.notes}
              onChange={(e) => updateCompetitive('atcoder', { notes: e.target.value })}
              placeholder="Write notes about topics, speed, or contest learnings..."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
