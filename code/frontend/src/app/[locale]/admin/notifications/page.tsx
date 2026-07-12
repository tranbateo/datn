import { getAdminNotifications } from '../actions';
import AdminNotificationsClient from './AdminNotificationsClient';

export default async function AdminNotificationsPage() {
  const { data, error } = await getAdminNotifications();

  if (error) {
    return <div className="p-8 text-red-500">Error loading notifications: {error}</div>;
  }

  return <AdminNotificationsClient initialData={data || []} />;
}
