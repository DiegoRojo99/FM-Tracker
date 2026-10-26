import { track } from '@vercel/analytics'
import { auth } from '@/lib/db/firebase'
import { shouldTrackAnalytics } from '@/lib/analytics/controls'
import { getOrCreateVisitorId } from '@/lib/analytics/visitor'
import { AnalyticsEvents, type AnalyticsEventName } from '@/lib/analytics/eventNames'

export { AnalyticsEvents }

type EventName = AnalyticsEventName
type EventPayload = Record<string, string | number | boolean | null | undefined>

interface TrackEventOptions {
  userId?: string | null
}

export function trackEvent(event: EventName, payload?: EventPayload, options?: TrackEventOptions) {
  const uid = options?.userId ?? auth.currentUser?.uid ?? null;
  if (!shouldTrackAnalytics(uid)) return;

  // Vercel's basic (Hobby-plan) analytics dashboard doesn't visualize custom
  // events, so this call is kept mostly for parity/free page-view counts.
  track(event, payload);

  // First-party event, used for the funnel/retention views under /admin.
  void sendToFirstPartyAnalytics(event, payload);
}

function sendToFirstPartyAnalytics(event: EventName, payload?: EventPayload) {
  const visitorId = getOrCreateVisitorId();
  return fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, payload, visitorId }),
    keepalive: true,
  }).catch((error) => {
    console.error(`Failed to send analytics event "${event}":`, error);
  });
}
