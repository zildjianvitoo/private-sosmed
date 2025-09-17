'use client';

import * as React from 'react';
import { Laptop, Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
] as const;

type ThemeValue = (typeof THEMES)[number]['value'];

function applyTheme(value: ThemeValue) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  if (value === 'system') {
    root.dataset.theme = '';
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.dataset.theme = 'dark';
    } else {
      root.dataset.theme = 'light';
    }
  } else {
    root.dataset.theme = value;
  }

  localStorage.setItem('theme-preference', value);
}

function getInitialTheme(): ThemeValue {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('theme-preference') as ThemeValue) ?? 'system';
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<ThemeValue>(() => getInitialTheme());

  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [theme]);

  const ActiveIcon = React.useMemo(() => {
    return THEMES.find((item) => item.value === theme)?.icon ?? Sun;
  }, [theme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          className="rounded-full border border-border/60 bg-background/80 shadow-sm"
        >
          <ActiveIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as ThemeValue)}
        >
          {THEMES.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
