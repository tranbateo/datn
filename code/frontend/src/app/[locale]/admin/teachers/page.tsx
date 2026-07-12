import { getAdminTeachers } from '../actions';
import AdminTeachersClient from './AdminTeachersClient';

export default async function AdminTeachersPage() {
  const { data, error } = await getAdminTeachers();

  if (error) {
    return <div className="p-8 text-red-500">Error loading teachers: {error}</div>;
  }

  return <AdminTeachersClient initialData={data || []} />;
}
