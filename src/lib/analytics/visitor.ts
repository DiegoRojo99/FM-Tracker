'use client'

import Cookies from 'js-cookie'

const VISITOR_ID_COOKIE = 'fm_tracker_visitor_id'
const VISITOR_ID_TTL_DAYS = 365

// Anonymous, non-PII id used to stitch together the pre-signup funnel
// (landing page -> login/add-save view -> signup) since those events happen
// before we have a userId. Not used for anything beyond in-house analytics.
export function getOrCreateVisitorId(): string | null {
  if (typeof window === 'undefined') return null

  const existing = Cookies.get(VISITOR_ID_COOKIE)
  if (existing) return existing

  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  Cookies.set(VISITOR_ID_COOKIE, id, { expires: VISITOR_ID_TTL_DAYS, sameSite: 'Lax' })
  return id
}
