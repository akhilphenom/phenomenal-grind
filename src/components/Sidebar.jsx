import {
  BookOpenText,
  Boxes,
  Braces,
  Flame,
  Gauge,
  NotebookPen,
  Settings2,
  Target,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Gauge },
  { id: 'competitive', label: 'Competitive', icon: Braces },
  { id: 'problems', label: 'Problems', icon: BookOpenText },
  { id: 'adhoc', label: 'Adhoc Problems', icon: Target },
  { id: 'systemdesign', label: 'System Design', icon: Boxes },
  { id: 'routine', label: 'Journal', icon: NotebookPen },
  { id: 'notes', label: 'Notes', icon: Settings2 },
];

export default function Sidebar({ activeTab, onTabChange, streak }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[180px] flex-col border-r bg-card/95 px-3 py-4 backdrop-blur">
      <button
        type="button"
        className="mb-5 flex items-center gap-2 rounded-lg px-2 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onTabChange('dashboard')}
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Flame className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-bold tracking-tight">Phenomenal</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Grind</span>
        </span>
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            className={cn(
              'h-9 w-full justify-start px-2 text-muted-foreground',
              activeTab === id && 'bg-accent text-accent-foreground'
            )}
            onClick={() => onTabChange(id)}
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{label}</span>
          </Button>
        ))}
      </nav>

      <Badge variant="secondary" className="justify-center gap-1 py-1.5">
        <Flame className="h-3.5 w-3.5 text-orange-400" />
        <strong>{streak}</strong> day streak
      </Badge>
    </aside>
  );
}
