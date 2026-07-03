import { Link } from "@/i18n/routing";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-background">
      {/* Left Form Side */}
      <div className="flex flex-col justify-between p-8 md:p-12 lg:p-24">
        {/* Header (Logo + Controls) */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">EduAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Auth Content */}
        <div className="flex-1 flex flex-col justify-center mt-12 md:mt-0">
          <div className="w-full max-w-sm mx-auto">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-12 md:mt-0">
          © {new Date().getFullYear()} EduAI. All rights reserved.
        </div>
      </div>

      {/* Right Graphic Side (Hidden on Mobile) */}
      <div className="hidden md:flex flex-col justify-center items-center bg-gray-50 dark:bg-card-bg border-l border-gray-100 dark:border-card-border p-12">
        <div className="max-w-md text-center space-y-6">
          <div className="w-full h-80 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-3xl flex items-center justify-center border border-white/50 dark:border-white/10 shadow-lg relative overflow-hidden backdrop-blur-xl">
            {/* Some decorative abstract shapes */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/40 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-purple-500/40 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 bg-white/60 dark:bg-gray-900/60 p-6 rounded-2xl backdrop-blur-md border border-white/20 dark:border-gray-700/50 shadow-xl max-w-xs w-full text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mb-2"></div>
                  <div className="h-2 w-12 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-2 w-5/6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-2 w-4/6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Learning Platform</h2>
          <p className="text-gray-600 dark:text-gray-400">Join thousands of students and educators transforming the way we learn using artificial intelligence.</p>
        </div>
      </div>
    </div>
  );
}
