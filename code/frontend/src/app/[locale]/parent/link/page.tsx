'use client';

import { useState, useEffect } from 'react';
import { parentService, ParentDashboardData } from '@/services/parent.service';
import { formatClassLabel } from '@/services/users.service';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Loader2, Users, School, UserCheck } from 'lucide-react';

export default function ParentLinkPage() {
  const [loading, setLoading] = useState(true);
  const [linkedStudents, setLinkedStudents] = useState<ParentDashboardData['students']>([]);

  useEffect(() => {
    const loadLinkedStudents = async () => {
      try {
        const res = await parentService.getDashboard();
        if (res?.students) {
          setLinkedStudents(res.students);
        }
      } catch (err) {
        console.error('Failed to load linked students:', err);
      } finally {
        setLoading(false);
      }
    };
    void loadLinkedStudents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 py-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Danh sách Con đang theo học
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Thông tin liên kết giữa Phụ huynh và Học sinh được Nhà trường đồng bộ tự động theo danh sách lớp chính khóa.
        </p>
      </div>

      <Card className="rounded-3xl shadow-sm border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Học sinh liên kết ({linkedStudents.length})
          </h2>
        </div>

        {linkedStudents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
            Hiện chưa có học sinh nào được gán với tài khoản của Quý phụ huynh. Vui lòng liên hệ Giáo viên chủ nhiệm hoặc Quản trị viên nhà trường để được cập nhật.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {linkedStudents.map(({ student }) => (
              <div key={student.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
                        <School className="w-3.5 h-3.5" /> {student.school.name}
                      </span>
                    )}
                    {student.homeroomTeacher && (
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> GVCN: {student.homeroomTeacher.fullName}
                      </span>
                    )}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 w-fit">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã đồng bộ từ Nhà trường
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
