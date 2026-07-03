"use client";

import { Calendar as CalendarIcon, Clock, MoreVertical, Plus, ChevronLeft, ChevronRight, CheckCircle2, Video, X, FileText, Link as LinkIcon, User } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function SchedulePage() {
  const t = useTranslations("User.Schedule");
  const tModal = useTranslations("User.EventModal");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const scheduleItems = [
    {
      time: "08:00",
      meridiem: t('meridiemAM'),
      title: t('class1'),
      type: t('type1'),
      duration: t('duration1'),
      color: "border-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      icon: Video,
      iconColor: "text-blue-500",
      completed: true,
    },
    {
      time: "10:30",
      meridiem: t('meridiemAM'),
      title: t('class2'),
      type: t('type2'),
      duration: t('duration2'),
      color: "border-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      icon: CheckCircle2,
      iconColor: "text-purple-500",
      completed: false,
    },
    {
      time: "14:00",
      meridiem: t('meridiemPM'),
      title: t('class3'),
      type: t('type3'),
      duration: t('duration3'),
      color: "border-rose-500",
      bgColor: "bg-rose-50 dark:bg-rose-900/20",
      icon: Clock,
      iconColor: "text-rose-500",
      completed: false,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('subtitle')}</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-sm self-start sm:self-auto">
          <Plus className="w-5 h-5" />
          {t('addSchedule')}
        </button>
      </div>

      {/* Calendar Strip */}
      <div className="bg-white dark:bg-card-bg p-4 sm:p-6 rounded-3xl border border-gray-100 dark:border-card-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">{t('month')}</h2>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
        
        <div className="flex justify-between items-center overflow-x-auto pb-2 scrollbar-hide gap-2">
          {[t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')].map((day, idx) => (
            <div key={idx} className={`flex flex-col items-center justify-center w-12 h-16 rounded-2xl flex-shrink-0 cursor-pointer transition-colors ${idx === 2 ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
              <span className="text-[10px] font-medium uppercase mb-1">{day}</span>
              <span className="text-lg font-bold">{14 + idx}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-card-bg p-4 sm:p-6 rounded-3xl border border-gray-100 dark:border-card-border shadow-sm">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-6 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-500" />
          {t('todaySchedule')}
        </h2>

        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-12 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
          
          {scheduleItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active cursor-pointer"
                onClick={() => setSelectedEvent(item)}
              >
                
                {/* Icon Marker */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-card-bg bg-white dark:bg-card-bg shadow absolute left-12 md:left-1/2 -translate-x-1/2 z-10">
                  <Icon className={`w-4 h-4 ${item.completed ? 'text-emerald-500' : 'text-gray-400'}`} />
                </div>

                {/* Content Box */}
                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] ml-auto md:ml-0 p-4 rounded-2xl border-l-4 ${item.color} ${item.bgColor} shadow-sm group-hover:shadow-md transition-all`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.time} {item.meridiem}</span>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">{item.title}</h3>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><CheckCircle2 className={`w-3.5 h-3.5 ${item.iconColor}`} /> {item.type}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {item.duration}</span>
                  </div>
                </div>

              </div>
            )
          })}
          
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card-bg w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className={`h-24 ${selectedEvent.bgColor} relative`}>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute -bottom-6 left-6 w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-md flex items-center justify-center">
                <selectedEvent.icon className={`w-6 h-6 ${selectedEvent.iconColor}`} />
              </div>
            </div>
            
            <div className="pt-10 px-6 pb-6">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{selectedEvent.time} {selectedEvent.meridiem}</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 mb-4">{selectedEvent.title}</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tModal('teacher')}</p>
                    <p className="font-semibold text-gray-900 dark:text-white">Thầy Nguyễn Văn A</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tModal('materials')}</p>
                    <p className="font-semibold text-blue-600 hover:underline cursor-pointer">de-cuong-on-tap.pdf</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{tModal('notes')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Nhớ làm bài tập về nhà trang 45 trước khi vào lớp nhé!</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2">
                  <LinkIcon className="w-4 h-4" /> {tModal('joinClass')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
