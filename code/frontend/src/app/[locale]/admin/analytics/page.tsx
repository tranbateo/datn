import { getAnalyticsStats } from './actions';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const { data, error } = await getAnalyticsStats();

  if (error || !data) {
    return <div className="p-6 text-red-500">Error loading analytics: {error}</div>;
  }

  return <AnalyticsClient data={data} />;
}
