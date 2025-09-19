'use client';

import type { ClientNotification } from '@/lib/serializers/notification';

export interface NotificationsResponse {
  notifications: ClientNotification[];
  unreadCount: number;
}

export async function fetchNotifications(limit = 15): Promise<NotificationsResponse> {
  const url = new URL('/api/notifications', window.location.origin);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return (await response.json()) as NotificationsResponse;
}

export async function markNotificationsRead(options: { ids?: string[]; markAll?: boolean }) {
  const response = await fetch('/api/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new Error('Failed to update notifications');
  }

  return response.json() as Promise<{ updated: number }>;
}
