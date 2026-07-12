import { getDashboardStats } from './actions';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboard() {
  const { data, error } = await getDashboardStats();

  if (error || !data) {
    return <div className="p-6 text-red-500">Error loading dashboard: {error}</div>;
  }

  return <AdminDashboardClient data={data} />;
}
