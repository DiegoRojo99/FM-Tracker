import { track } from '@vercel/analytics'

export const AnalyticsEvents = {
  LoginSuccess: 'login_success',
  LoginFailed: 'login_failed',
  SaveCreated: 'save_created',
  SaveDeleted: 'save_deleted',
  FriendRequestSent: 'friend_request_sent',
} as const

type EventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]
type EventPayload = Record<string, string | number | boolean | null | undefined>

export function trackEvent(event: EventName, payload?: EventPayload) {
  track(event, payload)
}
