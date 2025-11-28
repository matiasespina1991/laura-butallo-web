'use client';
import './globals.css';

import PageTransition from './components/PageTransition';
import { AnimatePresence } from 'framer-motion';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <PageTransition>{children}</PageTransition>
    </AnimatePresence>
  );
}
