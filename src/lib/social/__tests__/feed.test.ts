import { describe, expect, it } from 'vitest';
import { buildSocialFeedItems, type SocialFeedItem } from '../feed';

const sampleItems: SocialFeedItem[] = [
  {
    id: 'older',
    type: 'save.milestone',
    title: 'Save milestone',
    message: 'A save milestone was reached.',
    createdAt: '2024-01-01T10:00:00.000Z',
    visibility: 'public',
  },
  {
    id: 'newest',
    type: 'challenge.completed',
    title: 'Challenge completed',
    message: 'A challenge was completed.',
    createdAt: '2024-01-02T10:00:00.000Z',
    visibility: 'public',
  },
  {
    id: 'friends-only',
    type: 'trophy.added',
    title: 'Trophy unlocked',
    message: 'A trophy was added.',
    createdAt: '2024-01-03T10:00:00.000Z',
    visibility: 'friends',
  },
];

describe('buildSocialFeedItems', () => {
  it('sorts the newest items first and applies pagination', () => {
    const result = buildSocialFeedItems(sampleItems, { page: 1, limit: 2 });

    expect(result.total).toBe(3);
    expect(result.hasMore).toBe(true);
    expect(result.items.map((item) => item.id)).toEqual(['friends-only', 'newest']);
  });

  it('hides friend-only entries for non-friends', () => {
    const result = buildSocialFeedItems(sampleItems, { page: 1, limit: 10, viewerIsFriend: false });

    expect(result.items.map((item) => item.id)).toEqual(['newest', 'older']);
  });
});
