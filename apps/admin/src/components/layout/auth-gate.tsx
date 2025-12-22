'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDemoSession } from '@/contexts/demo-session';

export default function AuthGate({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, authReady } = useDemoSession();
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
    return null;
  }

  return children;
}
