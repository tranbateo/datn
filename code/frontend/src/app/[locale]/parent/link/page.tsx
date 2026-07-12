'use client';

import { useState } from 'react';
import { parentService } from '@/services/parent.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ParentLinkPage() {
  const [linkCode, setLinkCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslations("ParentUI.Link");

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCode || linkCode.length !== 6) {
      setError('Vui lòng nhập đúng 6 số mã liên kết.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await parentService.linkStudent(linkCode);
      setSuccess(true);
      setLinkCode('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể liên kết tài khoản. Vui lòng kiểm tra lại mã.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 py-8">
      
      {/* Success State */}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 flex items-start gap-4 mb-8">
          <div className="bg-emerald-100 dark:bg-emerald-900 p-2 rounded-full mt-1 shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-lg">{t("successTitle")}</h3>
            <p className="text-emerald-700 dark:text-emerald-400/80 mt-1">{t("successMessage")}</p>
            <button 
              onClick={() => setSuccess(false)}
              className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Liên kết thêm học sinh khác
            </button>
          </div>
        </div>
      )}

      <Card className="rounded-3xl shadow-sm border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
            <LinkIcon className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("title")}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
            {t("subtitle")}
          </p>

          <form onSubmit={handleLink} className="mt-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="linkCode" className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("inputLabel")}</Label>
              <Input 
                id="linkCode"
                placeholder={t("inputPlaceholder")} 
                value={linkCode}
                onChange={(e) => setLinkCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                className="text-lg tracking-widest text-center py-6 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-800/50 dark:focus:bg-slate-800 transition-colors"
                maxLength={6}
              />
              {error && <p className="text-sm text-red-500 font-medium mt-2">{error}</p>}
            </div>

            <Button 
              type="submit" 
              disabled={loading || linkCode.length !== 6}
              className="w-full py-6 rounded-xl text-base font-medium bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {t("submitBtn")}
            </Button>
          </form>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 p-8 sm:p-10 border-t border-blue-100 dark:border-blue-800/30">
          <h3 className="font-semibold text-blue-900 dark:text-blue-400 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5" /> {t("guideTitle")}
          </h3>
          <ul className="space-y-3 text-sm text-blue-800/80 dark:text-blue-300/80">
            <li>{t("guideStep1")}</li>
            <li>{t("guideStep2")} <strong className="font-bold text-blue-900 dark:text-blue-300">{t("guideStep2Bold")}</strong></li>
            <li>{t("guideStep3")} <strong className="font-bold text-blue-900 dark:text-blue-300">{t("guideStep3Bold")}</strong></li>
            <li>{t("guideStep4")}</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
