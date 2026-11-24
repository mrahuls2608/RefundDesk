'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { SkeletonList } from '@/components/ui';
import { homeFor, useAuth } from '@/lib/auth/AuthProvider';
import type { Role } from '@/lib/api/types';

/** Client-side guard. The API enforces roles anyway; this only avoids showing pages a user can't use. */
export function RouteGuard({ roles, children }: { roles: readonly Role[]; children: ReactNode }) {
  const { ready, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = Boolean(user && roles.includes(user.role));

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!roles.includes(user.role)) router.replace(homeFor(user.role));
  }, [ready, user, roles, router, pathname]);

  if (!ready || !allowed) {
    return (
      <div className="mx-auto max-w-content p-4">
        <SkeletonList rows={3} label="Checking your session" />
      </div>
    );
  }
  return <>{children}</>;
}
