import { getAdminAiModels } from '../actions';
import AdminAiModelsClient from './AdminAiModelsClient';

export default async function AdminAiModelsPage() {
  const { data, error } = await getAdminAiModels();

  if (error) {
    return <div className="p-8 text-red-500">Error loading ai models: {error}</div>;
  }

  return <AdminAiModelsClient initialData={data || []} />;
}
