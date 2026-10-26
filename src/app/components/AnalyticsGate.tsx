'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Analytics } from '@vercel/analytics/react'
import { useAuth } from '@/app/components/AuthProvider'
import { shouldTrackAnalytics } from '@/lib/analytics/controls'
import { AnalyticsEvents, trackEvent } from '@/lib/analytics/events'

const SESSION_START_FLAG = 'fm_tracker_session_started'

export default function AnalyticsGate() {
  const { user, userLoading } = useAuth();
  const pathname = usePathname();

  // Fires once per browser tab/session when an authenticated user is first
  // detected. Used as the start of the post-signup retention funnel.
  useEffect(() => {
    if (userLoading || !user) return;
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem(SESSION_START_FLAG)) return;

    window.sessionStorage.setItem(SESSION_START_FLAG, '1');
    trackEvent(AnalyticsEvents.SessionStart, {}, { userId: user.uid });
  }, [user, userLoading]);

  // Fires once per route change (including for anonymous visitors) to feed
  // the top-of-funnel view (landing page -> /login or /add-save -> signup).
  useEffect(() => {
    if (userLoading) return;
    trackEvent(AnalyticsEvents.PageView, { path: pathname }, { userId: user?.uid ?? null });
  }, [pathname, userLoading, user?.uid]);

  // Wait until auth is resolved to avoid counting excluded users on initial load.
  if (userLoading) return null;
  if (!shouldTrackAnalytics(user?.uid ?? null)) return null;

  return <Analytics />
}
