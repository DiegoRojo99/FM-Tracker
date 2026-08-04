import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { ok } from '@/lib/api/response';
import { SocialFeedItem } from '@/lib/social/feed';

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '10');

    const feed: SocialFeedItem[] = [
      {
        id: 'feed-1',
        type: 'save.milestone',
        title: 'Save milestone',
        message: 'A new save milestone was reached.',
        createdAt: new Date().toISOString(),
        saveId: 'demo-save',
      },
      {
        id: 'feed-2',
        type: 'challenge.completed',
        title: 'Challenge completed',
        message: 'A challenge was completed in your latest save.',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        saveId: 'demo-save',
      },
      {
        id: 'feed-3',
        type: 'trophy.added',
        title: 'Trophy unlocked',
        message: 'A trophy was added to your save history.',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        saveId: 'demo-save',
      },
    ];

    const paged = feed.slice((page - 1) * limit, page * limit);

    return ok({
      items: paged,
      page,
      limit,
      hasMore: page * limit < feed.length,
    });
  });
}
