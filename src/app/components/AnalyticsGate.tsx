'use client'

import { Analytics } from '@vercel/analytics/react'
import { useAuth } from '@/app/components/AuthProvider'
import { shouldTrackAnalytics } from '@/lib/analytics/controls'

export default function AnalyticsGate() {
  const { user, userLoading } = useAuth();

  // Wait until auth is resolved to avoid counting excluded users on initial load.
  if (userLoading) return null;
  if (!shouldTrackAnalytics(user?.uid ?? null)) return null;

  return <Analytics />
}
