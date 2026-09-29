import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Checkbox({ checked, className, ...props }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary shadow outline-none focus-visible:ring-2 focus-visible:ring-ring', checked && 'bg-primary text-primary-foreground', className)}
      {...props}
    >
      {checked && <Check className="h-3 w-3" />}
    </button>
  );
}
