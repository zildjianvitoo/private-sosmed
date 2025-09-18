export function normaliseFriendshipPair(userId: string, otherUserId: string) {
  if (userId === otherUserId) {
    throw new Error('Cannot create friendship with yourself');
  }

  const [userAId, userBId] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

  return { userAId, userBId } as const;
}

export type FriendshipStatus = 'FRIEND' | 'PENDING' | 'INCOMING' | 'NONE';
