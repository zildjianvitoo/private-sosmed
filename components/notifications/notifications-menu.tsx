'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Loader2 } from 'lucide-react';

import { fetchNotifications, markNotificationsRead } from '@/lib/api/notifications';
import type { ClientNotification } from '@/lib/serializers/notification';
import { formatRelativeTime } from '@/lib/time';
import { cn } from '@/lib/utils';
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
import { Separator } from '@/components/ui/separator';

function getPerson(notification: ClientNotification) {
  switch (notification.variant) {
    case 'incoming_request':
      return notification.data.from;
    case 'request_accepted':
      return notification.data.by;
    case 'friend_upload':
      return notification.data.user;
    default:
      return null;
  }
}

function getMessage(notification: ClientNotification) {
  switch (notification.variant) {
    case 'incoming_request':
      return `${notification.data.from.displayName} sent you a friend request`;
    case 'request_accepted':
      return `${notification.data.by.displayName} accepted your friend request`;
    case 'friend_upload':
      return `${notification.data.user.displayName} shared a new photo`;
    default:
      return 'New activity';
  }
}

function getHref(notification: ClientNotification) {
  switch (notification.variant) {
    case 'incoming_request':
      return '/friends';
    case 'request_accepted':
      return `/profile/${notification.data.by.id}`;
    case 'friend_upload':
      return `/profile/${notification.data.user.id}`;
    default:
      return '/';
  }
}

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SP'
  );
}

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(20),
    refetchInterval: 45_000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => markNotificationsRead({ markAll: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  useEffect(() => {
    if (open && unreadCount > 0 && !markAllMutation.isPending) {
      markAllMutation.mutate();
    }
  }, [open, unreadCount, markAllMutation]);

  const items = useMemo(
    () => notificationsQuery.data?.notifications ?? [],
    [notificationsQuery.data?.notifications],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-[1.25rem] px-1 text-[11px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
          <span>Notifications</span>
          {notificationsQuery.isFetching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto py-1">
          {items.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {notificationsQuery.isLoading
                ? 'Loading...'
                : 'Nothing new yet. You’re all caught up!'}
            </div>
          )}
          {items.map((notification) => {
            const person = getPerson(notification);
            const message = getMessage(notification);
            const href = getHref(notification);
            const initials = getInitials(person?.displayName ?? 'Serenity Pulse');
            const relativeTime = formatRelativeTime(new Date(notification.createdAt));

            return (
              <DropdownMenuItem key={notification.id} asChild className="p-0">
                <Link
                  href={href}
                  className={cn(
                    'flex gap-3 px-4 py-3 text-sm transition hover:bg-muted/70',
                    !notification.isRead && 'bg-muted/40',
                  )}
                >
                  <Avatar className="h-10 w-10">
                    {person?.image ? (
                      <AvatarImage src={person.image} alt={person.displayName} />
                    ) : (
                      <AvatarFallback>{initials}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="text-sm leading-tight text-foreground">{message}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{relativeTime} ago</span>
                      {notification.variant === 'incoming_request' && (
                        <Badge variant="outline">Action needed</Badge>
                      )}
                      {notification.variant === 'friend_upload' && (
                        <Badge variant="outline">New photo</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>
        <Separator className="opacity-40" />
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
          <span>Updates refresh automatically</span>
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['notifications'] })}
            className="font-medium text-primary hover:underline"
          >
            Refresh
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
