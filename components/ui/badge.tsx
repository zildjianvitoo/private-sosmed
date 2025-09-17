import * as React from 'react';

import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'muted' | 'destructive';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex min-h-6 items-center justify-center rounded-full border px-2.5 text-xs font-medium',
        variant === 'default' && 'border-transparent bg-primary/15 text-primary',
        variant === 'secondary' && 'border-transparent bg-secondary text-secondary-foreground',
        variant === 'outline' && 'border border-border text-foreground',
        variant === 'muted' && 'border-transparent bg-muted text-muted-foreground',
        variant === 'destructive' &&
          'border-transparent bg-destructive text-destructive-foreground',
        className,
      )}
      {...props}
    />
  );
}
