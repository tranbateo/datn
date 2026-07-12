'use client';

import { useState, useEffect } from 'react';
import { parentService, ParentDashboardData } from '@/services/parent.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, Bell, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ParentDashboardPage() {
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("ParentUI.Dashboard");

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await parentService.getDashboard();
        setData(result);
      } catch (error) {
        console.error('Failed to load dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="animate-spin w-10 h-10 text-indigo-500" /></div>;
  }

  if (!data?.students?.length) {
    return (
      <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-white">{t("noLinkedAccount")}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{t("noLinkedAccountDesc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t("title")}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t("subtitle")}</p>
        </div>
      </div>
      
      <Tabs defaultValue={data.students[0].student.id} className="w-full">
        {data.students.length > 1 && (
          <TabsList className="mb-6 flex overflow-x-auto">
            {data.students.map(({ student }) => (
              <TabsTrigger key={student.id} value={student.id} className="min-w-[120px]">
                {student.fullName}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {data.students.map(({ student, recentQuizzes, upcomingEvents, recentNotifications }) => {
          // Format chart data
          const chartData = recentQuizzes.map((q) => ({
            name: q.quiz?.title || 'Bài tập',
            score: q.score,
            date: new Date(q.startedAt).toLocaleDateString('vi-VN')
          })).reverse();

          return (
            <TabsContent key={student.id} value={student.id} className="space-y-6 mt-0 focus-visible:outline-none focus-visible:ring-0">
              {/* Student Header */}
              <div className="bg-indigo-600 dark:bg-indigo-900 rounded-3xl p-6 flex items-center gap-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <TrendingUp className="w-48 h-48" />
                </div>
                <div className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold border-4 border-indigo-400/30 shadow-inner shrink-0">
                  {student.fullName.charAt(0)}
                </div>
                <div className="relative z-10 text-white">
                  <h2 className="text-2xl font-bold mb-1">{student.fullName}</h2>
                  <div className="flex flex-wrap gap-3 text-indigo-100 text-sm font-medium">
                    <span className="bg-white/20 px-3 py-1 rounded-full">{t("grade")} {student.grade || '?'}</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full">{t("level")} {student.gamificationProfile?.level || 1}</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full">{student.gamificationProfile?.xp || 0} XP</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Chart */}
                <Card className="lg:col-span-2 rounded-3xl shadow-sm border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-500" /> {t("scoreChart")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chartData.length > 0 ? (
                      <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              cursor={{ fill: '#f1f5f9' }}
                            />
                            <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={50} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                        <p className="text-slate-500 dark:text-slate-400 text-sm italic">{t("noExams")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Right Column: Schedule & Notifications */}
                <div className="space-y-6">
                  
                  {/* Schedule */}
                  <Card className="rounded-3xl shadow-sm border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" /> {t("upcomingClasses")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {upcomingEvents && upcomingEvents.length > 0 ? (
                        upcomingEvents.slice(0, 4).map(event => (
                          <div key={event.id} className="flex gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className={`w-1 rounded-full shrink-0 ${event.color || 'bg-indigo-500'}`}></div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">{event.title}</h4>
                              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                <Clock className="w-3 h-3" /> 
                                {new Date(event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - 
                                {new Date(event.startTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-sm italic py-4 text-center">{t("noUpcomingClasses")}</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Notifications */}
                  <Card className="rounded-3xl shadow-sm border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5 text-amber-500" /> {t("notifications")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recentNotifications && recentNotifications.length > 0 ? (
                        recentNotifications.map(notification => (
                          <div key={notification.id} className="flex gap-3 items-start border-b border-slate-100 dark:border-slate-800 last:border-0 pb-3 last:pb-0">
                            <div className="mt-1 bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-full text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{notification.title}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notification.body}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                {new Date(notification.createdAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-sm italic py-4 text-center">{t("noNotifications")}</p>
                      )}
                    </CardContent>
                  </Card>

                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
