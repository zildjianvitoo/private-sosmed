export interface UserSummary {
  id: string;
  displayName: string;
  handle: string | null;
  image: string | null;
  bio: string | null;
}

export interface FriendSummary extends UserSummary {
  since: string;
}

export interface PendingRequest {
  id: string;
  createdAt?: string;
  requester?: UserSummary;
  recipient?: UserSummary;
}

export interface SearchResult extends UserSummary {
  status: 'FRIEND' | 'PENDING' | 'INCOMING' | 'NONE';
}

export async function getFriendRequests() {
  const response = await fetch('/api/friend-requests', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load friend requests');
  }
  return response.json() as Promise<{
    incoming: PendingRequest[];
    outgoing: PendingRequest[];
  }>;
}

export async function getFriends() {
  const response = await fetch('/api/friends', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load friends');
  }
  return response.json() as Promise<{ friends: FriendSummary[] }>;
}

export async function searchUsers(query: string) {
  const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? 'Search failed');
  }
  return response.json() as Promise<{ results: SearchResult[] }>;
}

export async function sendFriendRequest(recipientId: string) {
  const response = await fetch('/api/friend-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? 'Unable to send request');
  }

  return response.json();
}

export async function respondToRequest(id: string, action: 'accept' | 'decline') {
  const response = await fetch(`/api/friend-requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? 'Unable to update request');
  }

  return response.json();
}

export async function cancelRequest(id: string) {
  const response = await fetch(`/api/friend-requests/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? 'Unable to cancel request');
  }

  return response.json();
}
