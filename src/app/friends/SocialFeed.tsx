'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatFeedItemTitle, SocialFeedItem } from '@/lib/social/feed';
import { useAuth } from '@/app/components/AuthProvider';

export default function SocialFeed() {
  const { user } = useAuth();
  const [items, setItems] = useState<SocialFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFeed = useCallback(async (nextPage = 1, append = false) => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/social/feed?page=${nextPage}&limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load social feed');
      }

      const data = await response.json();
      const nextItems = data.items ?? [];
      setItems((current) => (append ? [...current, ...nextItems] : nextItems));
      setHasMore(Boolean(data.hasMore));
      setPage(nextPage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadFeed(1, false).catch(() => {
      setLoading(false);
      setLoadingMore(false);
    });
  }, [user, loadFeed]);

  if (loading) return <p className="text-sm text-[var(--color-text-muted)]">Loading your social activity…</p>;
  if (items.length === 0) return (
    <div className="fm-inset border-dashed p-5 text-center text-sm text-[var(--color-text-muted)]">
      No activity yet. Add a save, complete a challenge, or connect with friends to start filling this feed.
    </div>
  );

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="fm-inset p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 break-words">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">{formatFeedItemTitle(item.type)}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{item.message}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${item.visibility === 'friends' ? 'bg-[var(--color-highlight)]/20 text-[var(--color-highlight)]' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'}`}>
              {item.visibility === 'friends' ? 'Friends' : 'Public'}
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => loadFeed(page + 1, true)}
          disabled={loadingMore}
          className="fm-secondary w-full"
        >
          {loadingMore ? 'Loading more…' : 'Show more'}
        </button>
      )}
    </div>
  );
}
