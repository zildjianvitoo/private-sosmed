import type { Notification } from '@prisma/client';

import {
  ensurePersonSummary,
  normaliseStoredImage,
  NotificationMetadata,
} from '@/lib/notifications';

export type ClientNotificationType = 'friend_request' | 'upload';

export interface ClientNotificationBase {
  id: string;
  type: ClientNotificationType;
  createdAt: string;
  readAt: string | null;
  isRead: boolean;
}

export interface FriendRequestIncomingNotification extends ClientNotificationBase {
  variant: 'incoming_request';
  data: {
    requestId: string;
    from: ReturnType<typeof ensurePersonSummary>;
  };
}

export interface FriendRequestAcceptedNotification extends ClientNotificationBase {
  variant: 'request_accepted';
  data: {
    requestId: string;
    by: ReturnType<typeof ensurePersonSummary>;
  };
}

export interface FriendUploadNotification extends ClientNotificationBase {
  variant: 'friend_upload';
  data: {
    photoId: string;
    photo: {
      caption: string | null;
      fileUrl: string;
      filePath: string;
    };
    user: ReturnType<typeof ensurePersonSummary>;
  };
}

export type ClientNotification =
  | FriendRequestIncomingNotification
  | FriendRequestAcceptedNotification
  | FriendUploadNotification;

function toClientType(type: string): ClientNotificationType {
  return type === 'UPLOAD' ? 'upload' : 'friend_request';
}

export function serializeNotification(notification: Notification): ClientNotification | null {
  const metadata = safeParseMetadata(notification.metadata);
  if (!metadata) {
    return null;
  }

  const base: ClientNotificationBase = {
    id: notification.id,
    type: toClientType(notification.type),
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    isRead: Boolean(notification.readAt),
  };

  switch (metadata.variant) {
    case 'incoming_request':
      return {
        ...base,
        variant: 'incoming_request',
        data: {
          requestId: metadata.requestId,
          from: ensurePersonSummary(metadata.from),
        },
      } satisfies FriendRequestIncomingNotification;
    case 'request_accepted':
      return {
        ...base,
        type: 'friend_request',
        variant: 'request_accepted',
        data: {
          requestId: metadata.requestId,
          by: ensurePersonSummary(metadata.by),
        },
      } satisfies FriendRequestAcceptedNotification;
    case 'friend_upload':
      return {
        ...base,
        type: 'upload',
        variant: 'friend_upload',
        data: {
          photoId: metadata.photoId,
          photo: {
            caption: metadata.photo.caption ?? null,
            filePath: metadata.photo.filePath,
            fileUrl: normaliseStoredImage(metadata.photo.filePath) ?? metadata.photo.filePath,
          },
          user: ensurePersonSummary(metadata.user),
        },
      } satisfies FriendUploadNotification;
    default:
      return null;
  }
}

export function serializeNotifications(notifications: Notification[]): ClientNotification[] {
  return notifications
    .map((notification) => serializeNotification(notification))
    .filter((notification): notification is ClientNotification => Boolean(notification));
}

function safeParseMetadata(value: string | null): NotificationMetadata | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as NotificationMetadata & { variant?: string };
    if (!parsed || typeof parsed !== 'object' || !('variant' in parsed)) {
      return null;
    }
    if (
      parsed.variant === 'incoming_request' ||
      parsed.variant === 'request_accepted' ||
      parsed.variant === 'friend_upload'
    ) {
      return parsed as NotificationMetadata;
    }
    return null;
  } catch (error) {
    console.warn('Failed to parse notification metadata', error);
    return null;
  }
}
