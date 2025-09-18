export interface FeedPhoto {
  id: string;
  caption: string | null;
  filePath: string;
  createdAt: string;
  relativeCreatedAt: string;
  owner: {
    id: string;
    displayName: string;
    handle: string | null;
    image: string | null;
    bio: string | null;
  };
}

export interface FeedPageData {
  photos: FeedPhoto[];
  nextCursor: string | null;
}

export async function fetchPhotos(cursor?: string) {
  const url = new URL('/api/photos', window.location.origin);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load photos');
  }

  return (await response.json()) as FeedPageData;
}

export async function uploadPhoto(formData: FormData) {
  const response = await fetch('/api/photos', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to upload photo');
  }

  return response.json();
}
