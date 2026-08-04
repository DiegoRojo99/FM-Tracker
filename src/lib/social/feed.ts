export type SocialEventType = 'save.milestone' | 'challenge.completed' | 'trophy.added' | 'season.created';

export type SocialFeedItem = {
  id: string;
  type: SocialEventType;
  title: string;
  message: string;
  createdAt: string;
  saveId?: string;
  userId?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
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
