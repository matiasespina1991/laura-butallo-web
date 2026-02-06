'use client';

import { usePathname } from 'next/navigation';

export default function RouteFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className='animate-in fade-in duration-400 flex min-h-0 flex-1 flex-col'
    >
      {children}
    </div>
  );
}
