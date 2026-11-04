export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-4 w-80 bg-gray-100 dark:bg-gray-800/60 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white dark:bg-card-bg border border-gray-100 dark:border-card-border rounded-2xl p-5" />
        ))}
      </div>
      <div className="h-96 bg-white dark:bg-card-bg border border-gray-100 dark:border-card-border rounded-2xl p-6" />
    </div>
  );
}

