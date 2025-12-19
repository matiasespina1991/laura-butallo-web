'use client';

import { useMemo } from 'react';
import type { NavItem } from '@/types';

/**
 * Simplified navigation hook.
 * Firebase auth/analytics will drive visibility later; for now everything stays visible.
 */
export function useFilteredNavItems(items: NavItem[]) {
  return useMemo(() => items, [items]);
}
