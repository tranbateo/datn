import { getAdminSettings } from '../actions';
import AdminSettingsClient from './AdminSettingsClient';

export default async function AdminSettingsPage() {
  const { data, error } = await getAdminSettings();

  if (error) {
    return <div className="p-8 text-red-500">Error loading settings: {error}</div>;
  }

  return <AdminSettingsClient initialData={data || {}} />;
}
