import { track } from '@vercel/analytics'
import { auth } from '@/lib/db/firebase'
import { shouldTrackAnalytics } from '@/lib/analytics/controls'

export const AnalyticsEvents = {
  LoginSuccess: 'login_success',
  LoginFailed: 'login_failed',
  SaveCreated: 'save_created',
  SaveDeleted: 'save_deleted',
  FriendRequestSent: 'friend_request_sent',
} as const

type EventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]
type EventPayload = Record<string, string | number | boolean | null | undefined>

interface TrackEventOptions {
  userId?: string | null
}

export function trackEvent(event: EventName, payload?: EventPayload, options?: TrackEventOptions) {
  const uid = options?.userId ?? auth.currentUser?.uid ?? null;
  if (!shouldTrackAnalytics(uid)) return;
  track(event, payload);
}
