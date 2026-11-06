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

async function sendToFirstPartyAnalytics(event: EventName, payload?: EventPayload) {
  const visitorId = getOrCreateVisitorId();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Attach the Firebase ID token when a user is signed in so the server can
  // verify and record a real userId, instead of silently logging the event
  // as anonymous. Without this, every client-tracked event (login_success,
  // session_start, save_created, etc.) was stored with userId = null,
  // which breaks activation/retention queries in the Growth dashboard.
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error(`Failed to attach auth token to analytics event "${event}":`, error);
    }
  }

  return fetch('/api/analytics/track', {
    method: 'POST',
    headers,
    body: JSON.stringify({ event, payload, visitorId }),
    keepalive: true,
  }).catch((error) => {
    console.error(`Failed to send analytics event "${event}":`, error);
  });
}
