'use client';

import { useEffect, useState } from 'react';
import { SocialFeedItem } from '@/lib/social/feed';

export default function SocialFeed() {
  const [items, setItems] = useState<SocialFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      const response = await fetch('/api/social/feed');
      const data = await response.json();
      setItems(data.items ?? []);
      setLoading(false);
    }

    loadFeed().catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[var(--color-text-muted)]">Loading activity…</p>;
  if (items.length === 0) return <p className="text-sm text-[var(--color-text-muted)]">No activity yet.</p>;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/80 p-4">
          <p className="text-sm font-semibold text-white">{item.title}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{item.message}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--color-highlight)]">
            {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
