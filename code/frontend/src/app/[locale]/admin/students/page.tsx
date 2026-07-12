import { getAdminStudents } from '../actions';
import AdminStudentsClient from './AdminStudentsClient';

export default async function AdminStudentsPage() {
  const { data, error } = await getAdminStudents();

  if (error) {
    return <div className="p-8 text-red-500">Error loading students: {error}</div>;
  }

  return <AdminStudentsClient initialData={data || []} />;
}
