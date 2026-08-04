export type SocialEventType = 'save.milestone' | 'challenge.completed' | 'trophy.added' | 'season.created';
export type SocialFeedVisibility = 'public' | 'friends';

export type SocialFeedItem = {
  id: string;
  type: SocialEventType;
  title: string;
  message: string;
  createdAt: string;
  visibility?: SocialFeedVisibility;
  saveId?: string;
  userId?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export type SocialFeedQuery = {
  page?: number;
  limit?: number;
  viewerIsFriend?: boolean;
};

export type SocialFeedResult = {
  items: SocialFeedItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export function formatFeedItemTitle(type: SocialEventType): string {
  switch (type) {
    case 'save.milestone':
      return 'Save milestone';
    case 'challenge.completed':
      return 'Challenge completed';
    case 'trophy.added':
      return 'Trophy unlocked';
    case 'season.created':
      return 'Season added';
    default:
      return 'Activity';
  }
}

export function formatFeedItemMessage(type: SocialEventType, fallback: string): string {
  switch (type) {
    case 'save.milestone':
      return fallback || 'A save milestone was reached.';
    case 'challenge.completed':
      return fallback || 'A challenge was completed.';
    case 'trophy.added':
      return fallback || 'A trophy was added to the save.';
    case 'season.created':
      return fallback || 'A new season was added to the save.';
    default:
      return fallback;
  }
}

export function buildSocialFeedItems(items: SocialFeedItem[], query: SocialFeedQuery = {}): SocialFeedResult {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.max(1, query.limit ?? 10);
  const viewerIsFriend = query.viewerIsFriend ?? true;

  const visibleItems = items
    .filter((item) => item.visibility !== 'friends' || viewerIsFriend)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    items: visibleItems.slice(start, end),
    total: visibleItems.length,
    page,
    limit,
    hasMore: end < visibleItems.length,
  };
}
