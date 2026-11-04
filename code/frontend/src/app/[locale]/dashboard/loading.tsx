export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-6xl mx-auto">
      <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-64 bg-white dark:bg-gray-900 rounded-3xl md:col-span-2" />
        <div className="h-64 bg-white dark:bg-gray-900 rounded-3xl" />
      </div>
    </div>
  );
}

