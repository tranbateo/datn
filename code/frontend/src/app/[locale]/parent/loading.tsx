export default function ParentLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-indigo-200/50 dark:bg-indigo-900/30 rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-80 bg-white dark:bg-slate-900 rounded-3xl lg:col-span-2" />
        <div className="h-80 bg-white dark:bg-slate-900 rounded-3xl" />
      </div>
    </div>
  );
}

