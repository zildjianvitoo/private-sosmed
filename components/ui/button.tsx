import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'soft' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const buttonVariants: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-primary text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  ghost: 'bg-transparent text-foreground hover:bg-muted/60',
  outline: 'border border-border bg-background hover:bg-muted/80',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  soft: 'bg-primary/10 text-primary hover:bg-primary/15',
  link: 'text-primary underline-offset-4 hover:underline',
};

const buttonSizes: Record<NonNullable<ButtonProps['size']>, string> = {
  default: 'h-11 px-5 py-2 text-sm',
  sm: 'h-9 px-4 text-xs',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
          buttonVariants[variant],
          buttonSizes[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };
