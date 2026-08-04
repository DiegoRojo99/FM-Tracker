'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/AuthProvider';
import { getRouteAccess } from '@/lib/auth/routeProtection';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userLoading } = useAuth();

  useEffect(() => {
    if (userLoading) return;

    const access = getRouteAccess(pathname);
    const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID;

    if (access === 'admin' && (!user || user.uid !== adminUID)) {
      router.replace('/');
      return;
    }

    if (access === 'user' && !user) router.replace('/login');
  }, [pathname, router, user, userLoading]);

  if (userLoading) return null;
  return <>{children}</>;
}
