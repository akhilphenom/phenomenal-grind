import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

export function Card({ className, asChild = false, children, ...props }) {
  const Comp = asChild ? Slot : 'div';
  return <Comp className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)} {...props}>{children}</Comp>;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}
