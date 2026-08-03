import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { getAllUsers } from '@/lib/db/users';

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const users = await getAllUsers();
    return new Response(JSON.stringify(users), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }, { requireAdmin: true });
}