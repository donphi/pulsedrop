// frontend/app/dashboard/layout.tsx
import { type ReactNode } from 'react';
import DashboardLayoutComponent from '@/components/layouts/DashboardLayout'; // Renamed import to avoid naming conflict

/**
 * Layout for the main dashboard sections.
 * Wraps page content with the shared Dashboard UI (sidebar, header).
 * @param {object} props - Component props.
 * @param {ReactNode} props.children - Page content to render within the layout.
 * @returns {JSX.Element} The dashboard layout structure.
 */
export default function DashboardLayout({ children }: { children: ReactNode }): JSX.Element {
  return <DashboardLayoutComponent>{children}</DashboardLayoutComponent>;
}