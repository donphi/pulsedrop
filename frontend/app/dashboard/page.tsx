// app/dashboard/page.tsx
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="text-xl font-bold">Dashboard Content Here</div>
    </DashboardLayout>
  );
}