import type { FriendRequestStatus } from '../types/prisma/Friends';

export type FriendRequestAction = 'accept' | 'reject' | 'block';

export function normalizeFriendRequestAction(action: string): FriendRequestAction | null {
  if (action === 'accept' || action === 'reject' || action === 'block') return action;
  return null;
}

export function getFriendRequestState(status: FriendRequestStatus | null | undefined): 'pending' | 'resolved' | 'blocked' | 'unknown' {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'REJECTED':
      return 'resolved';
    case 'BLOCKED':
      return 'blocked';
    default:
      return 'unknown';
  }
}
