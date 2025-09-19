import type { Notification } from '@prisma/client';

export type NotificationType = 'FRIEND_REQUEST' | 'UPLOAD';
export type NotificationVariant = 'incoming_request' | 'request_accepted' | 'friend_upload';

export interface PersonSummary {
  id: string;
  displayName: string;
  handle: string | null;
  image: string | null;
}

export type NotificationMetadata =
  | {
      variant: 'incoming_request';
      requestId: string;
      from: PersonSummary;
    }
  | {
      variant: 'request_accepted';
      requestId: string;
      by: PersonSummary;
    }
  | {
      variant: 'friend_upload';
      photoId: string;
      photo: {
        caption: string | null;
        filePath: string;
      };
      user: PersonSummary;
    };

export type NotificationRecord = Notification & {
  metadata: string | null;
};

export function encodeNotificationMetadata(metadata: NotificationMetadata): string {
  return JSON.stringify(metadata);
}

export function parseNotificationMetadata(value: string | null): NotificationMetadata | null {
  if (!value) {
    return null;
  }

  try {
    const metadata = JSON.parse(value) as NotificationMetadata & { variant?: string };
    if (!metadata || typeof metadata !== 'object' || !('variant' in metadata)) {
      return null;
    }

    switch (metadata.variant) {
      case 'incoming_request':
      case 'request_accepted':
      case 'friend_upload':
        return metadata as NotificationMetadata;
      default:
        return null;
    }
  } catch (error) {
    console.warn('Failed to parse notification metadata', error);
    return null;
  }
}

export function normaliseStoredImage(image: string | null): string | null {
  if (!image) {
    return null;
  }
  return image.startsWith('/') ? image : `/${image}`;
}

export function ensurePersonSummary(summary: PersonSummary): PersonSummary {
  return {
    ...summary,
    image: normaliseStoredImage(summary.image),
  };
}
