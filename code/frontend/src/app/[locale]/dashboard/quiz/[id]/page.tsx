"use client";

import { APP_ROUTES } from '@/constants/routes';
 

import { useState, use } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Clock, X, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('User.Quiz');
  const router = useRouter();
  const resolvedParams = use(params);
  const [selectedOption, setSelectedOption] = useState<string | null>('B');

  const options = [
    { id: 'A', text: "y' = x" },
    { id: 'B', text: "y' = 2x" },
    { id: 'C', text: "y' = x² / 3" },
    { id: 'D', text: "y' = 2" },
  ];

  const handleNext = () => {
    router.push(`/dashboard/quiz/${resolvedParams.id}/result`);
  };

  const handleClose = () => {
    router.push(APP_ROUTES.PRACTICE);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] p-4 sm:p-6 lg:p-8 flex justify-center">
      <div className="w-full max-w-md bg-white dark:bg-card-bg rounded-3xl shadow-sm border border-gray-100 dark:border-card-border overflow-hidden flex flex-col h-[calc(100vh-2rem)] sm:h-auto sm:min-h-[600px]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full font-bold text-sm border border-blue-100 dark:border-blue-900/50">
            <Clock className="w-4 h-4" /> 14:22
          </div>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>

        {/* Progress Bar */}
        <div className="px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-900 dark:text-white">{t('questionNum')} 3</span>
            <span className="text-xs font-medium text-gray-500">2/10</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '30%' }}></div>
          </div>
        </div>

        {/* Question Area */}
        <div className="p-4 sm:px-6 flex-1 flex flex-col">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 mb-6 shadow-inner">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Tính đạo hàm của hàm số y = x²
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('instruction')}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 flex-1">
            {options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' 
                      : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-card-bg hover:border-blue-200 dark:hover:border-blue-800/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>
                    {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-bold">{opt.id}</span>}
                  </div>
                  <span className={`text-left font-medium ${isSelected ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                    {opt.text}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-card-bg">
          <button 
            onClick={handleNext}
            disabled={!selectedOption}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl text-sm font-bold transition-all shadow-sm"
          >
            {t('nextButton')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
