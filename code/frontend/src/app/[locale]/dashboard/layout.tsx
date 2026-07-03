import { StudentNavigation } from "@/components/dashboard/StudentNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <StudentNavigation />
      
      {/* Main content wrapper */}
      <div className="md:pl-64 pt-16 md:pt-0 pb-20 md:pb-0 transition-all duration-300">
        <main className="min-h-screen">
          {children}
        </main>
      </div>

    </div>
  );
}
