import { prisma } from '@/lib/db/prisma'

export type ServerEventPayload = Record<string, string | number | boolean | null | undefined>

interface TrackServerEventOptions {
  userId?: string | null
  visitorId?: string | null
  payload?: ServerEventPayload
}

// Mirrors `isExcludedAnalyticsUser` in `src/lib/analytics/controls.ts`
// (duplicated rather than imported since that module is 'use client' and
// this helper runs in server-only code paths).
function isExcludedAnalyticsUser(uid: string | null | undefined): boolean {
  if (!uid) return false;
  const excluded = new Set(
    (process.env.NEXT_PUBLIC_ANALYTICS_EXCLUDED_UIDS ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
  );
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
  if (adminUid) excluded.add(adminUid);
  return excluded.has(uid);
}

// Server-side counterpart to `trackEvent` in `src/lib/analytics/events.ts`.
// Writes directly to the first-party `AnalyticsEvent` table so actions that
// happen inside API routes (season logged, trophy won, achievement unlocked,
// challenge started/completed, friend request accepted) are captured even
// though they never go through the client-side tracking call.
//
// Note: per-user local opt-out (localStorage) can't be checked server-side,
// but the admin/excluded-uid exclusion list is still honored for consistency.
// Errors are swallowed and logged only - analytics must never break a
// user-facing request.
export async function trackServerEvent(event: string, options?: TrackServerEventOptions): Promise<void> {
  if (isExcludedAnalyticsUser(options?.userId)) return;

  try {
    await prisma.analyticsEvent.create({
      data: {
        event,
        userId: options?.userId ?? null,
        visitorId: options?.visitorId ?? null,
        payload: options?.payload ?? undefined,
      },
    })
  }
  catch (error) {
    console.error(`Failed to record analytics event "${event}":`, error)
  }
}
