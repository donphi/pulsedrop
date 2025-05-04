// lib/config.ts
import {
    HomeIcon, UsersIcon, FolderIcon, CalendarIcon, DocumentDuplicateIcon, ChartPieIcon,
    Cog6ToothIcon, ServerIcon, SignalIcon, GlobeAltIcon, ChartBarSquareIcon
  } from '@heroicons/react/24/outline';
  
  export const dashboardNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Team', href: '/team', icon: UsersIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'Documents', href: '/documents', icon: DocumentDuplicateIcon },
    { name: 'Reports', href: '/reports', icon: ChartPieIcon },
  ];
  
  export const settingsNavigation = [
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Deployments', href: '/deployments', icon: ServerIcon },
    { name: 'Activity', href: '/activity', icon: SignalIcon },
    { name: 'Domains', href: '/domains', icon: GlobeAltIcon },
    { name: 'Usage', href: '/usage', icon: ChartBarSquareIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];
  
  export const secondaryNavigation = [
    { name: 'Account', href: '/settings', section: 'account' },
    { name: 'Notifications', href: '/settings/notifications' },
    { name: 'Billing', href: '/settings/billing' },
    { name: 'Teams', href: '/settings/teams' },
    { name: 'Integrations', href: '/settings/integrations' },
  ];

export const footerNavigation = [
    { name: 'Login', href: '/login' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms & Conditions', href: '/terms-and-conditions' },
  ];