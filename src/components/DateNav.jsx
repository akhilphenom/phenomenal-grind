function toLocalDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DateNav({ date, onDateChange }) {
  const d = new Date(date + 'T12:00:00');
  const label = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const shift = (delta) => {
    const next = new Date(d);
    next.setDate(next.getDate() + delta);
    onDateChange(toLocalDateStr(next));
  };

  const today = toLocalDateStr(new Date());
  const isToday = date === today;

  return (
    <div className="date-nav">
      <button className="date-arrow" onClick={() => shift(-1)}>‹</button>
      <span className="date-label">{label}</span>
      <button className="date-arrow" onClick={() => shift(1)}>›</button>
      <button
        className={`date-today-btn${isToday ? ' current' : ''}`}
        onClick={() => onDateChange(today)}
      >
        Today
      </button>
    </div>
  );
}
