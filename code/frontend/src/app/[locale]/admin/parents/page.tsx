import { getAdminParents } from '../actions';
import AdminParentsClient from './AdminParentsClient';

export default async function AdminParentsPage() {
  const { data, error } = await getAdminParents();

  if (error) {
    return <div className="p-8 text-red-500">Error loading parents: {error}</div>;
  }

  return <AdminParentsClient initialData={data || []} />;
}
