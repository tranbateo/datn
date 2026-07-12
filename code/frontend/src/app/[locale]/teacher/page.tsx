import { getTeacherDashboardStats } from './actions';
import TeacherDashboardClient from './TeacherDashboardClient';

export default async function TeacherDashboard() {
  const { data, error } = await getTeacherDashboardStats();

  if (error || !data) {
    return <div className="p-6 text-red-500">Error loading dashboard: {error}</div>;
  }

  return <TeacherDashboardClient data={data} />;
}
