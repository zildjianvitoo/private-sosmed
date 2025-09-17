import * as React from 'react';

import { cn } from '@/lib/utils';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm',
        variant === 'default' && 'border-primary/30 bg-primary/10 text-primary-foreground/90',
        variant === 'destructive' &&
          'border-destructive/40 bg-destructive/10 text-destructive-foreground',
        className,
      )}
      {...props}
    />
  ),
);
Alert.displayName = 'Alert';

export { Alert };
