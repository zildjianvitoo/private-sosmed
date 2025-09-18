'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  cancelRequest,
  FriendSummary,
  getFriendRequests,
  getFriends,
  PendingRequest,
  respondToRequest,
  searchUsers,
  SearchResult,
  sendFriendRequest,
  UserSummary,
} from '@/lib/api/friends';

interface FriendsDashboardProps {
  currentUser: {
    id: string;
    displayName: string;
    handle: string | null;
    image: string | null;
  };
  initialFriends: FriendSummary[];
  initialIncoming: PendingRequest[];
  initialOutgoing: PendingRequest[];
  initialSuggestions: SearchResult[];
}

export function FriendsDashboard({
  currentUser,
  initialFriends,
  initialIncoming,
  initialOutgoing,
  initialSuggestions,
}: FriendsDashboardProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [discoverResults, setDiscoverResults] = useState<SearchResult[]>(initialSuggestions);
  const [discoverTitle, setDiscoverTitle] = useState('Suggested creators');

  const friendRequestsQuery = useQuery({
    queryKey: ['friendRequests'],
    queryFn: getFriendRequests,
    initialData: { incoming: initialIncoming, outgoing: initialOutgoing },
  });

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
    initialData: { friends: initialFriends },
  });

  const sendRequestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      setSearchError(null);
    },
    onError: (error: unknown) => {
      setSearchError(error instanceof Error ? error.message : 'Unable to send request');
    },
  });

  const respondToRequestMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'decline' }) =>
      respondToRequest(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (error: unknown) => {
      setSearchError(error instanceof Error ? error.message : 'Unable to update request');
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: cancelRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: unknown) => {
      setSearchError(error instanceof Error ? error.message : 'Unable to cancel request');
    },
  });

  const handleSearch = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const query = searchTerm.trim();
      if (!query) {
        setDiscoverResults(initialSuggestions);
        setDiscoverTitle('Suggested creators');
        setSearchError(null);
        return;
      }

      try {
        const response = await searchUsers(query);
        setDiscoverResults(response.results);
        setDiscoverTitle(`Results for “${query}”`);
        setSearchError(null);
      } catch (error) {
        setSearchError(error instanceof Error ? error.message : 'Search failed');
      }
    },
    [initialSuggestions, searchTerm],
  );

  const pendingIncoming = friendRequestsQuery.data?.incoming ?? [];
  const pendingOutgoing = friendRequestsQuery.data?.outgoing ?? [];
  const friends = friendsQuery.data?.friends ?? [];

  const isSending =
    sendRequestMutation.isPending ||
    respondToRequestMutation.isPending ||
    cancelRequestMutation.isPending;

  const renderAvatar = useCallback((user: UserSummary, fallback?: string) => {
    const initials =
      fallback ??
      (user.displayName
        ?.split(' ')
        .map((part) => part.charAt(0))
        .join('') ||
        'SP');
    return (
      <Avatar className="h-10 w-10">
        {user.image ? (
          <AvatarImage src={user.image} alt={user.displayName} />
        ) : (
          <AvatarFallback>{initials.slice(0, 2).toUpperCase()}</AvatarFallback>
        )}
      </Avatar>
    );
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Friends', value: friends.length },
      { label: 'Pending', value: pendingIncoming.length + pendingOutgoing.length },
    ],
    [friends.length, pendingIncoming.length, pendingOutgoing.length],
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="bg-gradient-to-br from-secondary/40 to-background">
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl font-semibold">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Incoming requests</CardTitle>
            <CardDescription>Respond to friend requests sent to you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingIncoming.length === 0 && (
              <p className="text-sm text-muted-foreground">No incoming requests right now.</p>
            )}
            {pendingIncoming.map((request) => {
              const requester = request.requester!;
              return (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/80 p-3"
                >
                  <div className="flex items-center gap-3">
                    {renderAvatar(requester)}
                    <div>
                      <p className="text-sm font-medium text-foreground">{requester.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {requester.handle ?? 'No handle yet'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        respondToRequestMutation.mutate({ id: request.id, action: 'accept' })
                      }
                      disabled={isSending}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        respondToRequestMutation.mutate({ id: request.id, action: 'decline' })
                      }
                      disabled={isSending}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outgoing requests</CardTitle>
            <CardDescription>Requests you&apos;ve sent and are waiting on.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingOutgoing.length === 0 && (
              <p className="text-sm text-muted-foreground">No pending requests. Nice!</p>
            )}
            {pendingOutgoing.map((request) => {
              const recipient = request.recipient!;
              return (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/80 p-3"
                >
                  <div className="flex items-center gap-3">
                    {renderAvatar(recipient)}
                    <div>
                      <p className="text-sm font-medium text-foreground">{recipient.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {recipient.handle ?? 'Pending handle'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelRequestMutation.mutate(request.id)}
                    disabled={isSending}
                  >
                    Cancel
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Your friends</CardTitle>
            <CardDescription>Connect with people you know and collaborate with.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {friends.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You don&apos;t have any friends yet. Start by sending a request!
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/80 p-3"
                >
                  {renderAvatar(friend)}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{friend.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {friend.handle ?? 'No handle yet'}
                    </p>
                    {friend.bio && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {friend.bio}
                      </p>
                    )}
                  </div>
                  <Badge variant="muted">Friend</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle>Discover creators</CardTitle>
              <CardDescription>
                Search by display name, handle, or email to find new connections.
              </CardDescription>
            </div>
            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Input
                placeholder="Search for people..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="sm:max-w-md"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={sendRequestMutation.isPending}>
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setDiscoverResults(initialSuggestions);
                    setDiscoverTitle('Suggested creators');
                    setSearchError(null);
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
            {searchError && <p className="text-sm text-destructive">{searchError}</p>}
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">{discoverTitle}</h3>
            {discoverResults.length === 0 && (
              <p className="text-sm text-muted-foreground">No profiles matched your search.</p>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {discoverResults.map((result) => {
                const statusBadge =
                  result.status === 'FRIEND'
                    ? { label: 'Friend', variant: 'muted' as const }
                    : result.status === 'PENDING'
                      ? { label: 'Requested', variant: 'outline' as const }
                      : result.status === 'INCOMING'
                        ? { label: 'Incoming request', variant: 'secondary' as const }
                        : null;

                return (
                  <div
                    key={result.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/80 p-3"
                  >
                    <div className="flex items-center gap-3">
                      {renderAvatar(result)}
                      <div>
                        <p className="text-sm font-medium text-foreground">{result.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.handle ?? 'No handle yet'}
                        </p>
                        {result.bio && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {result.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {statusBadge ? (
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => sendRequestMutation.mutate(result.id)}
                          disabled={isSending}
                        >
                          Add friend
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator className="my-2" />
            <p className="text-xs text-muted-foreground">
              Tip: accepting an incoming request instantly creates a friendship and unlocks sharing
              in the main feed.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
