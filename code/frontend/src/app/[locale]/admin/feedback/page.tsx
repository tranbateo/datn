import { getAdminFeedback } from '../actions';
import AdminFeedbackClient from './AdminFeedbackClient';

export default async function AdminFeedbackPage() {
  const { data, error } = await getAdminFeedback();

  if (error) {
    return <div className="p-8 text-red-500">Error loading feedback: {error}</div>;
  }

  return <AdminFeedbackClient initialData={data || []} />;
}
