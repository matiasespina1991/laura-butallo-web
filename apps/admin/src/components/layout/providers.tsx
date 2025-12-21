'use client';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { DemoSessionProvider } from '@/contexts/demo-session';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <ActiveThemeProvider initialTheme={activeThemeValue}>
      <DemoSessionProvider>{children}</DemoSessionProvider>
    </ActiveThemeProvider>
  );
}
