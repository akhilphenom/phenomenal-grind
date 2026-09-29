import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

function toLocalDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DateNav({ date, onDateChange }) {
  const d = new Date(`${date}T12:00:00`);
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
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous day">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-48 text-center text-sm font-medium">{label}</span>
      <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next day">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant={isToday ? 'secondary' : 'default'} size="sm" onClick={() => onDateChange(today)}>
        Today
      </Button>
    </div>
  );
}
