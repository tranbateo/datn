"use client";

import { APP_ROUTES } from '@/constants/routes';
import { useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Camera, User, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { fetchApi } from "@/lib/api-client";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("User.Onboarding");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchApi<any>('/users/profile');
        if (profile) {
          setFullName(profile.fullName || "");
          if (profile.grade) setGrade(profile.grade);
          // Currently no gender/subjects in Prisma User by default, but keeping states just in case
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleNext = async () => {
    if (step === 1) {
      if (!fullName) return; // Basic validation
      setStep(2);
    } else {
      setIsSubmitting(true);
      try {
        await fetchApi('/users/profile', {
          method: 'PATCH',
          body: JSON.stringify({
            fullName,
            grade
          })
        });
        router.push(APP_ROUTES.DASHBOARD);
      } catch (error) {
        console.error("Failed to update profile", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const toggleSubject = (subject: string) => {
    if (subjects.includes(subject)) {
      setSubjects(subjects.filter(s => s !== subject));
    } else {
      setSubjects([...subjects, subject]);
    }
  };

  const grades = [
    { num: 1, label: t('primary') }, { num: 2, label: t('primary') }, { num: 3, label: t('primary') },
    { num: 4, label: t('primary') }, { num: 5, label: t('primary') }, { num: 6, label: t('middle') },
    { num: 7, label: t('middle') }, { num: 8, label: t('middle') }, { num: 9, label: t('middle') },
    { num: 10, label: t('high') }, { num: 11, label: t('high') }, { num: 12, label: t('high') },
  ];

  const availableSubjects = [
    { id: "toan", name: t('math'), icon: "📐" },
    { id: "ly", name: t('physics'), icon: "🔬" },
    { id: "hoa", name: t('chemistry'), icon: "⚗️" },
    { id: "van", name: t('literature'), icon: "📖" },
    { id: "anh", name: t('english'), icon: "🌐" },
    { id: "sinh", name: t('biology'), icon: "🧬" },
    { id: "su", name: t('history'), icon: "📜" },
    { id: "dia", name: t('geography'), icon: "🌍" },
    { id: "tin", name: t('computer'), icon: "💻" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl overflow-hidden min-h-[600px] flex flex-col relative border border-gray-100 dark:border-gray-800 mt-4">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : step === 1 ? (
          // STEP 1: Basic Info
          <div className="flex-1 flex flex-col p-8 animate-in slide-in-from-right-8 duration-500 relative">
            <Link href={APP_ROUTES.DASHBOARD} className="absolute top-8 left-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-500 mb-2">{t('createProfile')}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('tellUsMore')}</p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-200 dark:border-blue-800 flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-300 dark:text-blue-700" />
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors border-2 border-white dark:border-gray-900">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6 flex-1">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('nickname')}</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('nicknamePlaceholder')}
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('gender')}</label>
                <div className="grid grid-cols-3 gap-3">
                  {[{id: 'Nam', label: t('male')}, {id: 'Nữ', label: t('female')}, {id: 'Khác', label: t('other')}].map(g => (
                    <button 
                      key={g.id}
                      onClick={() => setGender(g.id)}
                      className={`py-3 rounded-2xl text-sm font-medium border transition-colors flex items-center justify-center gap-2
                        ${gender === g.id 
                          ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-400' 
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      {g.id === 'Nam' && '♂'}
                      {g.id === 'Nữ' && '♀'}
                      {g.id === 'Khác' && '⚧'}
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleNext}
              className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-auto"
            >
              {t('continue')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // STEP 2: Grade & Subjects
          <div className="flex-1 flex flex-col p-8 animate-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-500 mb-3">{t('welcome')}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {t('letUsKnow')}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-8 scrollbar-hide pb-20">
              
              {/* Grade Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 dark:text-white">{t('whatGrade')}</h2>
                  <span className="text-[10px] font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-md">{t('select1')}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {grades.map(g => (
                    <button 
                      key={g.num}
                      onClick={() => setGrade(g.num)}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all
                        ${grade === g.num 
                          ? 'border-blue-600 bg-blue-50 shadow-sm dark:bg-blue-900/20 dark:border-blue-500 scale-105' 
                          : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700'
                        }
                      `}
                    >
                      <span className={`text-xl font-bold ${grade === g.num ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>{g.num}</span>
                      <span className={`text-[10px] mt-1 ${grade === g.num ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-gray-400'}`}>{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 dark:text-white">{t('subjectsNeeded')}</h2>
                  <span className="text-[10px] font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-md">{t('selectMultiple')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSubjects.map(sub => {
                    const isSelected = subjects.includes(sub.id);
                    return (
                      <button 
                        key={sub.id}
                        onClick={() => toggleSubject(sub.id)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium flex items-center gap-2 transition-all
                          ${isSelected 
                            ? 'border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                            : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        <span>{sub.icon}</span>
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white dark:from-gray-900 dark:via-gray-900 to-transparent">
              <button 
                onClick={handleNext}
                disabled={!grade || isSubmitting}
                className={`w-full py-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2
                  ${grade && !isSubmitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20' 
                    : 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed shadow-none'
                  }
                `}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t('finish')}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
