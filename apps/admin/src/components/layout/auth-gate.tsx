'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthSession } from '@/contexts/auth-session';

export default function AuthGate({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, authReady } = useAuthSession();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = pathname.startsWith('/auth');

  useEffect(() => {
    if (!authReady) {
      return;
    }
    if (isAuthRoute && user) {
      router.replace('/dashboard/overview');
      return;
    }
    if (!isAuthRoute && !user) {
      router.replace('/auth/sign-in');
    }
  }, [authReady, isAuthRoute, router, user]);

  if (isAuthRoute) {
    return children;
  }

  if (!authReady || !user) {
    return (
      <div className='text-muted-foreground flex min-h-[60vh] items-center justify-center text-sm'>
        Checking access...
      </div>
    );
  }

  return children;
}
