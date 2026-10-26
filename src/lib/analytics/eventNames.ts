// Shared, environment-agnostic event name constants. Kept separate from
// `events.ts` (client-only: imports the Firebase client SDK) so server-side
// library code (src/lib/db/*) can reference event names without pulling in
// client-only dependencies.
export const AnalyticsEvents = {
  LoginSuccess: 'login_success',
  LoginFailed: 'login_failed',
  SignupCompleted: 'signup_completed',
  SessionStart: 'session_start',
  PageView: 'page_view',
  SaveCreated: 'save_created',
  SaveDeleted: 'save_deleted',
  SeasonLogged: 'season_logged',
  TrophyRecorded: 'trophy_recorded',
  AchievementUnlocked: 'achievement_unlocked',
  ChallengeStarted: 'challenge_started',
  ChallengeCompleted: 'challenge_completed',
  FriendRequestSent: 'friend_request_sent',
  FriendRequestAccepted: 'friend_request_accepted',
} as const

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]
