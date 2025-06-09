// lib/config.ts
import {
    HomeIcon, UsersIcon, FolderIcon, CalendarIcon, DocumentDuplicateIcon, ChartPieIcon,
    Cog6ToothIcon, ServerIcon, SignalIcon, GlobeAltIcon, ChartBarSquareIcon
  } from '@heroicons/react/24/outline';
  
  /**
   * Strava API and webhook sync configuration
   * Controls timing and behavior of data synchronization
   */
  export const stravaSync = {
    // Initial sync settings when user first connects
    initialSync: {
      // Number of days of historical data to fetch
      daysToFetch: 7,
      
      // Maximum number of activities to fetch during initial sync
      maxActivities: 200,
      
      // Batch size for processing activities
      batchSize: 10,
      
      // Delay between batches to respect rate limits (ms)
      batchDelay: 1000,
    },
    
    // Webhook settings
    webhook: {
      // Maximum time to respond to webhook events (ms)
      responseTimeout: 1500,
      
      // Maximum retry attempts for failed webhook processing
      maxRetries: 3,
      
      // Delay between retry attempts (ms)
      retryDelay: 5000,
    },
    
    // API request settings
    api: {
      // Timeout for Strava API requests (ms)
      requestTimeout: 10000,
      
      // Base delay for exponential backoff on rate limit errors (ms)
      baseRetryDelay: 1000,
      
      // Maximum retry attempts for API requests
      maxRetries: 3,
    },
    
    // Polling fallback (as backup to webhooks)
    polling: {
      // Whether to enable polling as fallback
      enabled: true,
      
      // Interval between polls (ms) - 4 hours
      interval: 14_400_000,
      
      // Number of recent activities to check in each poll
      activityLimit: 10,
    },
    
    // Activity data settings
    activity: {
      // Whether to fetch detailed activity data
      fetchDetails: true,
      
      // Whether to fetch activity streams (time-series data)
      fetchStreams: true,
      
      // Stream types to fetch (time-series data)
      streamTypes: ['time', 'heartrate', 'latlng', 'altitude', 'cadence', 'watts'],
      
      // Whether to process heart rate data into separate table
      processHeartRate: true,
    },
  };
  
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
    { name: 'Privacy Policy', href: '/legal/privacy' },
    { name: 'Terms & Conditions', href: '/legal/terms' },
  ];