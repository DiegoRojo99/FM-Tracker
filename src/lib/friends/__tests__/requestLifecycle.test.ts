import { describe, expect, it } from 'vitest';
import { getFriendRequestState, normalizeFriendRequestAction } from '../requestLifecycle';

describe('friend request lifecycle helpers', () => {
  it('accepts the supported friend request actions', () => {
    expect(normalizeFriendRequestAction('accept')).toBe('accept');
    expect(normalizeFriendRequestAction('reject')).toBe('reject');
    expect(normalizeFriendRequestAction('block')).toBe('block');
  });

  it('returns the right lifecycle state for request statuses', () => {
    expect(getFriendRequestState('PENDING')).toBe('pending');
    expect(getFriendRequestState('REJECTED')).toBe('resolved');
    expect(getFriendRequestState('BLOCKED')).toBe('blocked');
    expect(getFriendRequestState(undefined)).toBe('unknown');
  });
});
