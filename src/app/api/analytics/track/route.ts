import { NextRequest } from 'next/server';
import { withOptionalAuth } from '@/lib/auth/withAuth';
import { trackServerEvent } from '@/lib/analytics/server';
import { badRequest, success } from '@/lib/api/response';

// Ingests first-party analytics events from the client. This exists because
// the Vercel Hobby plan doesn't visualize custom events at all - see the
// Growth & Engagement Roadmap (docs/roadmap/Growth-Engagement-Roadmap.md).
// Accepts both anonymous (pre-signup) and authenticated requests.
export async function POST(request: NextRequest) {
  return withOptionalAuth(request, async (uid) => {
    let body: { event?: unknown; payload?: unknown; visitorId?: unknown };
    try {
      body = await request.json();
    }
    catch {
      return badRequest('Invalid JSON body');
    }

    if (typeof body.event !== 'string' || body.event.length === 0) {
      return badRequest('event is required');
    }

    const payload = body.payload && typeof body.payload === 'object'
      ? body.payload as Record<string, string | number | boolean | null | undefined>
      : undefined;
    const visitorId = typeof body.visitorId === 'string' ? body.visitorId : null;

    await trackServerEvent(body.event, { userId: uid, visitorId, payload });

    return success({ tracked: true });
  });
}
