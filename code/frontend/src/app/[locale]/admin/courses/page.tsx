import { getAdminCourses } from '../actions';
import AdminCoursesClient from './AdminCoursesClient';

export default async function AdminCoursesPage() {
  const { data, error } = await getAdminCourses();

  if (error) {
    return <div className="p-8 text-red-500">Error loading courses: {error}</div>;
  }

  return <AdminCoursesClient initialData={data || []} />;
}
