'use client';

import { useState, useEffect } from 'react';
import { parentService, ParentDashboardData } from '@/services/parent.service';
import { formatClassLabel } from '@/services/users.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notify } from '@/lib/toast';
import {
  CheckCircle2,
  Loader2,
  Users,
  School,
  UserCheck,
  Link2,
  Unlink,
  ShieldCheck,
} from 'lucide-react';

export default function ParentLinkPage() {
  const [loading, setLoading] = useState(true);
  const [linkedStudents, setLinkedStudents] = useState<
    ParentDashboardData['students']
  >([]);
  const [linkCode, setLinkCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [confirmUnlinkId, setConfirmUnlinkId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reloadStudents = async () => {
    try {
      const res = await parentService.getDashboard();
      setLinkedStudents(res?.students || []);
    } catch (err) {
      console.error('Failed to reload linked students:', err);
    }
  };

  useEffect(() => {
    let active = true;
    parentService
      .getDashboard()
      .then((res) => {
        if (active) {
          setLinkedStudents(res?.students || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load linked students:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = linkCode.trim();
    if (!cleaned) {
      setErrorMessage('Vui lòng nhập mã liên kết 6 số từ tài khoản của con.');
      return;
    }

    setLinking(true);
    setErrorMessage(null);
    try {
      const res = await parentService.linkStudent(cleaned);
      setLinkCode('');
      notify(
        `Liên kết thành công với học sinh ${res?.student?.fullName || ''}!`,
      );
      await reloadStudents();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Mã liên kết không hợp lệ hoặc đã hết hạn.';
      setErrorMessage(msg);
      notify(msg);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkStudent = async (studentId: string, fullName: string) => {
    setUnlinkingId(studentId);
    try {
      await parentService.unlinkStudent(studentId);
      setConfirmUnlinkId(null);
      notify(`Đã hủy liên kết với học sinh ${fullName}.`);
      await reloadStudents();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Không thể hủy liên kết lúc này.';
      notify(msg);
    } finally {
      setUnlinkingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 py-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Quản lý Liên kết Tài khoản Con
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Danh sách học sinh được Nhà trường đồng bộ tự động theo hồ sơ lớp học.
          Phụ huynh cũng có thể chủ động liên kết thêm con bằng mã 6 số dùng một
          lần (hiệu lực 15 phút).
        </p>
      </div>

      {/* Link new student via 6-digit one-time code (BR-LINK-001) */}
      <Card className="rounded-3xl shadow-sm border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Liên kết thêm học sinh bằng mã xác nhận
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Hướng dẫn: Học sinh đăng nhập Cổng Học sinh → Cài đặt → Tạo mã
              liên kết Phụ huynh (6 chữ số, dùng 1 lần trong 15 phút), sau đó
              nhập vào ô bên dưới.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleLinkStudent}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Nhập mã 6 số (VD: 482910)"
            value={linkCode}
            onChange={(e) => {
              setLinkCode(e.target.value.replace(/\D/g, '').slice(0, 6));
              if (errorMessage) setErrorMessage(null);
            }}
            className="sm:max-w-xs font-mono tracking-widest text-base"
          />
          <Button
            type="submit"
            disabled={linking || linkCode.trim().length < 6}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {linking ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4 mr-2" />
            )}
            Xác nhận liên kết
          </Button>
        </form>

        {errorMessage && (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {errorMessage}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Mã liên kết tự động vô hiệu ngay sau khi sử dụng thành công để bảo
            vệ quyền riêng tư dữ liệu học sinh.
          </span>
        </div>
      </Card>

      {/* Linked students list */}
      <Card className="rounded-3xl shadow-sm border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Học sinh đang liên kết ({linkedStudents.length})
          </h2>
        </div>

        {linkedStudents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
            Hiện chưa có học sinh nào được liên kết với tài khoản của Quý phụ
            huynh. Vui lòng nhập mã 6 số từ tài khoản của con hoặc liên hệ Giáo
            viên chủ nhiệm / Quản trị viên nhà trường.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {linkedStudents.map(({ student }) => {
              const isConfirming = confirmUnlinkId === student.id;
              const isUnlinking = unlinkingId === student.id;
              return (
                <div
                  key={student.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      <span>{student.fullName}</span>
                      {student.studentCode && (
                        <span className="text-xs font-mono bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded">
                          Mã HS: {student.studentCode}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {formatClassLabel(student.className, student.grade)}
                      </span>
                      {student.school?.name && (
                        <span className="flex items-center gap-1">
                          <School className="w-3.5 h-3.5" />{' '}
                          {student.school.name}
                        </span>
                      )}
                      {student.homeroomTeacher && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" /> GVCN:{' '}
                          {student.homeroomTeacher.fullName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đang theo dõi
                    </span>

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isUnlinking}
                          onClick={() =>
                            handleUnlinkStudent(student.id, student.fullName)
                          }
                          className="h-8 text-xs"
                        >
                          {isUnlinking ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Xác nhận hủy'
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isUnlinking}
                          onClick={() => setConfirmUnlinkId(null)}
                          className="h-8 text-xs"
                        >
                          Giữ lại
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmUnlinkId(student.id)}
                        className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Unlink className="w-3.5 h-3.5 mr-1" /> Hủy liên kết
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
