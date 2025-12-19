import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Laura Butallo Studio · Admin',
  description: 'Dashboard para gestionar el portfolio de Laura Butallo.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}
