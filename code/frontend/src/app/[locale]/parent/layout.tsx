'use client';

import { ParentNavigation } from '@/components/parent/ParentNavigation';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <ParentNavigation />
      
      {/* Main content wrapper */}
      <div className="md:pl-64 pt-16 md:pt-0 pb-20 md:pb-0 transition-all duration-300">
        <main className="min-h-screen">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
