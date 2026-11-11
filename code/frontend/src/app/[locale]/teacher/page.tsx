import { getTeacherDashboardStats } from './actions';
import TeacherDashboardClient from './TeacherDashboardClient';

export default async function TeacherDashboard() {
  const { data, error } = await getTeacherDashboardStats();

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm font-medium">
        Không thể tải dữ liệu bảng điều khiển Giáo viên: {error}
      </div>
    );
  }

  return <TeacherDashboardClient data={data} />;
}
