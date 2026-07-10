"use client";

import { APP_ROUTES } from '@/constants/routes';
import { useState } from "react";
import { Link } from "@/i18n/routing";
import { GraduationCap, ArrowRight, Bot, Sparkles, ScanLine, Trophy } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";

export default function WelcomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const t = useTranslations("User.Welcome");

  const slides = [
    {
      id: "ai-chat",
      title: t('slide1Title'),
      description: t('slide1Desc'),
      icon: <Bot className="w-16 h-16 text-blue-500 mb-6" />,
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      id: "ocr-scan",
      title: t('slide2Title'),
      description: t('slide2Desc'),
      icon: <ScanLine className="w-16 h-16 text-purple-500 mb-6" />,
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      id: "progress",
      title: t('slide3Title'),
      description: t('slide3Desc'),
      icon: <Trophy className="w-16 h-16 text-amber-500 mb-6" />,
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl overflow-hidden relative min-h-[600px] flex flex-col">
        
        {/* Header / Skip */}
        <div className="flex items-center justify-between p-6 z-10 relative">
          <Link href={APP_ROUTES.HOME} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="font-bold text-gray-900 dark:text-white">AI Tutor</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {currentSlide < slides.length ? (
              <button 
                onClick={() => setCurrentSlide(slides.length)}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t('skip')}
              </button>
            ) : (
              <span className="text-sm font-medium text-blue-600">{t('help')}</span>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          
          {currentSlide < slides.length ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-right-8 duration-500" key={currentSlide}>
              <div className={`w-32 h-32 rounded-full ${slides[currentSlide].bgColor} flex items-center justify-center mb-8 relative`}>
                {slides[currentSlide].icon}
                <Sparkles className="absolute top-0 right-0 w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{slides[currentSlide].title}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {slides[currentSlide].description}
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-40 h-40 bg-blue-100 dark:bg-blue-900/30 rounded-3xl mb-8 flex items-center justify-center relative overflow-hidden">
                <Bot className="w-20 h-20 text-blue-600 dark:text-blue-400 z-10" />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-transparent dark:from-blue-800/50 opacity-50"></div>
              </div>
              <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100 dark:border-blue-800">{t('version')}</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">{t('welcomeTo')}<br/><span className="text-blue-600">AI Tutor</span></h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                {t('intro')}
              </p>
              
              <div className="w-full space-y-3">
                <Link href={APP_ROUTES.REGISTER} className="flex items-center justify-center w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 group">
                  {t('register')}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href={APP_ROUTES.LOGIN} className="flex items-center justify-center w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 py-3.5 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {t('login')}
                </Link>
              </div>

              <div className="mt-8 w-full flex items-center gap-4">
                <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
                <span className="text-xs font-medium text-gray-400 uppercase">{t('orContinueWith')}</span>
                <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </button>
                <button className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer / Navigation */}
        <div className="p-8 pt-0">
          {currentSlide < slides.length && (
            <div className="flex flex-col items-center">
              {/* Pagination Dots */}
              <div className="flex gap-2 mb-8">
                {slides.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-200 dark:bg-gray-700'}`}
                  ></div>
                ))}
              </div>
              <button 
                onClick={handleNext}
                className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {t('next')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
          <p className="text-center text-[10px] text-gray-400 mt-6 font-medium">{t('footer')}</p>
        </div>

      </div>
    </div>
  );
}
