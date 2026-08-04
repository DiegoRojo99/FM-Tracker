'use client';

import { useEffect, useState } from 'react';
import { formatFeedItemTitle, SocialFeedItem } from '@/lib/social/feed';

export default function SocialFeed() {
  const [items, setItems] = useState<SocialFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFeed = async (nextPage = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const response = await fetch(`/api/social/feed?page=${nextPage}&limit=5`);
      const data = await response.json();
      const nextItems = data.items ?? [];
      setItems((current) => (append ? [...current, ...nextItems] : nextItems));
      setHasMore(Boolean(data.hasMore));
      setPage(nextPage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFeed(1, false).catch(() => {
      setLoading(false);
      setLoadingMore(false);
    });
  }, []);

  if (loading) return <p className="text-sm text-[var(--color-text-muted)]">Loading your social activity…</p>;
  if (items.length === 0) return (
    <div className="rounded-2xl border border-dashed border-[var(--color-surface-border)] bg-[var(--color-dark)]/60 p-6 text-center text-sm text-[var(--color-text-muted)]">
      No activity yet. Add a save, complete a challenge, or connect with friends to start filling this feed.
    </div>
  );

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/80 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">{formatFeedItemTitle(item.type)}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{item.message}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${item.visibility === 'friends' ? 'bg-[var(--color-highlight)]/20 text-[var(--color-highlight)]' : 'bg-emerald-500/15 text-emerald-400'}`}>
              {item.visibility === 'friends' ? 'Friends' : 'Public'}
            </span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--color-highlight)]">
            {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => loadFeed(page + 1, true)}
          disabled={loadingMore}
          className="w-full rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-surface-border)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loadingMore ? 'Loading more…' : 'Show more'}
        </button>
      )}
    </div>
  );
}
