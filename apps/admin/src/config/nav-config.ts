import { NavItem } from '@/types';

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Exhibitions',
    url: '/dashboard/exhibitions',
    icon: 'exhibitions',
    shortcut: ['e', 'e'],
    isActive: false,
    items: []
  },
  {
    title: 'Galería',
    url: '/dashboard/media',
    icon: 'media',
    shortcut: ['g', 'g'],
    isActive: false,
    items: []
  },
  {
    title: 'Workspaces',
    url: '/dashboard/workspaces',
    icon: 'workspace',
    isActive: false,
    items: []
  },
  {
    title: 'Teams',
    url: '/dashboard/workspaces/team',
    icon: 'teams',
    isActive: false,
    items: []
  },
  {
    title: 'Product',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: []
  },
  {
    title: 'Kanban',
    url: '/dashboard/kanban',
    icon: 'kanban',
    shortcut: ['k', 'k'],
    isActive: false,
    items: []
  },
  {
    title: 'Pro',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'pro',
    isActive: true,
    items: [
      {
        title: 'Exclusive',
        url: '/dashboard/exclusive',
        icon: 'exclusive',
        shortcut: ['m', 'm']
      }
    ]
  },
  {
    title: 'Account',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'account',
    isActive: true,
    items: [
      // {
      //   title: 'Profile',
      //   url: '/dashboard/profile',
      //   icon: 'profile',
      //   shortcut: ['m', 'm']
      // },
      {
        title: 'Billing',
        url: '/dashboard/billing',
        icon: 'billing',
        shortcut: ['b', 'b']
      },
      {
        title: 'Login',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'login'
      }
    ]
  }
];
