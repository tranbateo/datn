'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2, User, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function TeacherSettingsPage() {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const t = useTranslations("Teacher.Settings");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { fetchApi } = await import('@/lib/api-client');
        const data = await fetchApi<any>('/users/profile');

        setName(data.fullName || '');
        setAvatarUrl(data.avatarUrl || '');
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const { fetchApi } = await import('@/lib/api-client');
      const payload: Record<string, string> = {
        fullName: name,
        avatarUrl: avatarUrl
      };
      
      if (password) {
        payload.password = password;
      }

      await fetchApi('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      setSuccess(true);
      if (password) setPassword(''); // clear password after successful save
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 py-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t("title")}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t("subtitle")}</p>
      </div>      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="bg-emerald-100 dark:bg-emerald-900/50 p-1 rounded-full">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">{t("successTitle")}</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400/80">{t("successMessage")}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Form */}
        <div className="md:col-span-2">
          <Card className="rounded-3xl shadow-sm border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <form onSubmit={handleSave} className="p-8">
              
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{t("profileTitle")}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t("profileSubtitle")}</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("fullName")}</Label>
                  <Input 
                    id="name"
                    placeholder={t("fullNamePlaceholder")} 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 focus:bg-white dark:bg-slate-800/50 dark:focus:bg-slate-800 transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl" className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("avatarUrl")}</Label>
                  <Input 
                    id="avatarUrl"
                    placeholder={t("avatarUrlPlaceholder")} 
                    value={avatarUrl} 
                    onChange={e => setAvatarUrl(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 focus:bg-white dark:bg-slate-800/50 dark:focus:bg-slate-800 transition-colors"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">{t("changePassword")}</h4>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("newPassword")}</Label>
                    <Input 
                      id="password"
                      type="password"
                      placeholder={t("newPasswordPlaceholder")} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 focus:bg-white dark:bg-slate-800/50 dark:focus:bg-slate-800 transition-colors"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={saving}
                  className="mt-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all font-medium"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("savingBtn")}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> {t("saveBtn")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Preview */}
        <div className="md:col-span-1">
          <Card className="rounded-3xl shadow-sm border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-8">
            <CardHeader>
              <CardTitle className="text-lg">{t("avatarPreview")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-indigo-900 bg-gray-100 flex items-center justify-center mb-4">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="128px" />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
