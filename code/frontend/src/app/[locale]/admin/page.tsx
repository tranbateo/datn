import { getDashboardStats } from './actions';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboard() {
  const { data, error } = await getDashboardStats();

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm font-medium">
        Không thể tải dữ liệu tổng quan Quản trị viên: {error}
      </div>
    );
  }

  return <AdminDashboardClient data={data} />;
}
