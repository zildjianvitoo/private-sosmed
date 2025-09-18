'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Bell, LogOut, Menu, Plus, Search } from 'lucide-react';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Feed', href: '/' },
  { name: 'Friends', href: '/friends' },
  { name: 'Discover', href: '/discover' },
  { name: 'Library', href: '/library' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const displayName = user?.name ?? 'Member';
  const handle = user?.handle
    ? `@${user.handle}`
    : user?.email
      ? `@${user.email.split('@')[0]}`
      : '@member';

  const initials = React.useMemo(() => {
    if (displayName) {
      const [first, second] = displayName.split(' ');
      return `${first?.charAt(0) ?? ''}${second?.charAt(0) ?? ''}`.toUpperCase() || 'SP';
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'SP';
  }, [displayName, user?.email]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  const renderNavLinks = (variant: 'desktop' | 'mobile' = 'desktop') => (
    <nav
      className={cn(
        'flex items-center gap-1',
        variant === 'mobile' && 'flex-col items-start gap-3 pt-2',
      )}
    >
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Button
            key={item.name}
            asChild
            variant={isActive ? 'soft' : variant === 'desktop' ? 'ghost' : 'ghost'}
            className={cn(
              'text-sm',
              variant === 'desktop' && 'px-3 py-2',
              variant === 'mobile' && 'w-full justify-start text-base',
            )}
          >
            <Link href={item.href}>{item.name}</Link>
          </Button>
        );
      })}
    </nav>
  );

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl">
      <div className="border-b border-border/70 bg-background/80">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-xs bg-background/95">
                  <SheetHeader className="mb-2">
                    <SheetTitle className="tracking-tight">Private Social</SheetTitle>
                  </SheetHeader>
                  {renderNavLinks('mobile')}
                  <div className="mt-6 flex flex-col gap-4">
                    <Button variant="soft" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      New Post
                    </Button>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Quick Actions
                      </p>
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <button className="text-left font-medium hover:text-foreground">
                          Upload photo
                        </button>
                        <button className="text-left font-medium hover:text-foreground">
                          Find friends
                        </button>
                        <button className="text-left font-medium hover:text-foreground">
                          Account settings
                        </button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold tracking-tight"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/25">
                  SP
                </span>
                <span className="hidden sm:inline">Serenity Pulse</span>
              </Link>
            </div>
            <div className="hidden flex-1 md:flex">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search friends, posts, or tags"
                  className="pl-10 pr-4 shadow-sm"
                  aria-label="Search"
                />
              </div>
            </div>
          </div>

          <div className="hidden md:flex md:flex-1 md:justify-center">
            {renderNavLinks('desktop')}
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 min-w-[1.25rem] px-1 text-[11px]"
              >
                3
              </Badge>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2 py-1 text-left shadow-sm transition hover:border-primary/50">
                  <Avatar className="h-9 w-9">
                    {user?.image ? (
                      <AvatarImage src={user.image} alt={displayName} />
                    ) : (
                      <AvatarFallback>{initials}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="hidden text-sm sm:flex sm:flex-col">
                    <span className="font-semibold text-foreground">{displayName}</span>
                    <span className="text-xs text-muted-foreground">{handle}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">View profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing">Billing</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="border-b border-border/60 bg-background/70 md:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 pb-3">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search" className="pl-10 pr-4" aria-label="Search" />
          </div>
        </div>
      </div>
    </header>
  );
}
