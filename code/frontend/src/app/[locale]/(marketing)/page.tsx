import { Link } from "@/i18n/routing";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import WelcomePage from "../welcome/page";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <>
      {/* Mobile and Tablet View: Welcome Screen (hidden on Desktop lg: screens) */}
      <div className="lg:hidden fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 overflow-y-auto">
        <WelcomePage />
      </div>

      {/* Desktop View: Marketing Landing Page (hidden on Mobile/Tablet) */}
      <div className="hidden lg:flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 lg:pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>{t('badge')}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
            {t('title1')} <br className="hidden sm:block" />
            <span className="text-primary">{t('title2')}</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg leading-relaxed">
            {t('description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/login?tab=register" className="inline-flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-medium transition-colors">
              {t('startNow')} <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="inline-flex justify-center items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 rounded-xl font-medium transition-colors">
              <PlayCircle className="w-5 h-5 text-gray-400 dark:text-gray-500" /> {t('watchDemo')}
            </button>
          </div>
        </div>
        
        {/* Hero Right: Placeholder for illustration */}
        <div className="relative">
          <div className="w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-white/50 dark:border-gray-700 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-3xl"></div>
            {/* Can place generated image here later */}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full border-y border-gray-100 dark:border-gray-800 bg-white dark:bg-card-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
            <div className="pt-4 md:pt-0">
              <div className="text-4xl font-bold text-primary mb-2">{t('stat1Value')}</div>
              <div className="text-gray-500 dark:text-gray-400 font-medium">{t('stat1Label')}</div>
            </div>
            <div className="pt-8 md:pt-0">
              <div className="text-4xl font-bold text-primary mb-2">{t('stat2Value')}</div>
              <div className="text-gray-500 dark:text-gray-400 font-medium">{t('stat2Label')}</div>
            </div>
            <div className="pt-8 md:pt-0">
              <div className="text-4xl font-bold text-primary mb-2">{t('stat3Value')}</div>
              <div className="text-gray-500 dark:text-gray-400 font-medium">{t('stat3Label')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Demo Section */}
      <section className="w-full bg-gradient-to-b from-blue-50/50 to-white dark:from-gray-900 dark:to-background py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('chatDemoTitle')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t('chatDemoDesc')}
          </p>
          
          {/* Mac-like Window Mockup */}
          <div className="w-full rounded-2xl bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border shadow-xl overflow-hidden text-left">
            {/* Header bar */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-card-border px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-24 py-1 text-xs text-gray-400 font-medium flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm border border-gray-300 dark:border-gray-600"></span>
                app.aitutor.edu.vn/chat
              </div>
            </div>
            {/* Chat Body */}
            <div className="p-6 sm:p-8 space-y-6 bg-gray-50/50 dark:bg-card-bg">
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%] shadow-sm">
                  <p className="text-sm">Làm sao để giải phương trình bậc 2: x² - 5x + 6 = 0?</p>
                </div>
              </div>
              
              {/* AI message */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-6 py-5 w-full shadow-sm">
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                    Để giải phương trình <strong>x² - 5x + 6 = 0</strong>, chúng ta có thể dùng phương pháp phân tích thành nhân tử hoặc dùng công thức nghiệm (Delta).
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-600 dark:text-gray-400 mb-4 border border-gray-100 dark:border-gray-800">
                    <p>Δ = b² - 4ac</p>
                    <p>Δ = (-5)² - 4(1)(6) = 25 - 24 = 1</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded text-xs font-medium border border-purple-100 dark:border-purple-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                    <span>📖 SGK Toán 9</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
