'use client'

const ANALYTICS_OPT_OUT_KEY = 'fm_tracker_analytics_opt_out'

function parseExcludedUidList(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((uid) => uid.trim())
      .filter(Boolean)
  );
}

export function isAnalyticsOptedOutLocally(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === 'true'; } 
  catch { return false; }
}

export function isExcludedAnalyticsUser(uid: string | null | undefined): boolean {
  if (!uid) return false;
  const excludedFromEnv = parseExcludedUidList(process.env.NEXT_PUBLIC_ANALYTICS_EXCLUDED_UIDS);
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
  if (adminUid) excludedFromEnv.add(adminUid);
  return excludedFromEnv.has(uid)
}

export function shouldTrackAnalytics(uid: string | null | undefined): boolean {
  if (typeof window === 'undefined') return false;
  if (isAnalyticsOptedOutLocally()) return false;
  if (isExcludedAnalyticsUser(uid)) return false;
  return true;
}
