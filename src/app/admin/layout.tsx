import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-app min-h-screen bg-slate-50 text-slate-900">
      {children}
    </div>
  );
}
