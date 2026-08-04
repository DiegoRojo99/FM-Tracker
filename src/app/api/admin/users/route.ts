import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { getAllUsers } from '@/lib/db/users';
import { ok } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const users = await getAllUsers();
    return ok(users);
  }, { requireAdmin: true });
}