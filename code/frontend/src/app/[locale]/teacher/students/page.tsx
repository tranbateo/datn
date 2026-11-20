"use client";
import { notify } from "@/lib/toast";

import { Search, Filter, Download, Users, TrendingUp, AlertTriangle, Edit, X, KeyRound, BellRing, FileText, Send, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";
import { teacherService } from "@/services/teacher.service";
import TempPasswordModal, { TempPasswordModalData } from "@/components/shared/TempPasswordModal";

interface HomeroomResetRequest {
  id: string;
  userId: string;
  fullName: string;
  studentCode?: string | null;
  email?: string | null;
  className?: string | null;
  reason?: string | null;
  createdAt: string;
}

interface StudentData {
  id: string;
  name: string;
  studentCode?: string | null;
  email: string;
  grade: string;
  classId?: string | null;
  className?: string | null;
  isHomeroomTeacher?: boolean;
  subjects?: string[];
  level?: number;
  streak?: number;
  initials: string;
  color?: string;
  lastActivity: string | null;
  latestAttemptId?: string | null;
  latestQuizTitle?: string | null;
  latestScore?: number | null;
  progress: number;
  status: string;
  enrolledAt?: string;
}

export default function TeacherStudentsPage() {
  const t = useTranslations("Teacher.Students");
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Manual Grade Override state (FR-QUIZ-007)
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [newScore, setNewScore] = useState<number>(80);
  const [scoreReason, setScoreReason] = useState("");
  const [savingScore, setSavingScore] = useState(false);

  // Homeroom Teacher Password Reset state
  const [resetRequests, setResetRequests] = useState<HomeroomResetRequest[]>([]);
  const [resettingStudentId, setResettingStudentId] = useState<string | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<TempPasswordModalData | null>(null);

  // Student Full Attempt History Modal
  const [historyModal, setHistoryModal] = useState<{
    student: { id: string; fullName: string; studentCode?: string | null; className: string };
    attempts: Array<{
      id: string;
      quizTitle: string;
      subjectName: string;
      canEditScore: boolean;
      score: number;
      totalQuestions: number;
      completedAt: string;
    }>;
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Quick Remind Student / Parent Modal
  const [remindStudent, setRemindStudent] = useState<StudentData | null>(null);
  const [remindTitle, setRemindTitle] = useState("");
  const [remindBody, setRemindBody] = useState("");
  const [remindAudience, setRemindAudience] = useState<"STUDENTS" | "PARENTS" | "BOTH">("STUDENTS");
  const [sendingRemind, setSendingRemind] = useState(false);

  // Derive quick stats
  const activeToday = students.filter(s => s.lastActivity && new Date(s.lastActivity).toDateString() === new Date().toDateString()).length;
  const newThisWeek = students.filter(s => s.enrolledAt && (new Date().getTime() - new Date(s.enrolledAt).getTime()) < 7 * 24 * 60 * 60 * 1000).length;
  const studentsAtRisk = students.filter(s => s.status === 'At Risk').length;

  async function loadStudents() {
    setLoading(true);
    try {
      const [data, requestsData] = await Promise.all([
        teacherService.getStudents(),
        teacherService.getPasswordResetRequests().catch(() => []),
      ]);
      if (data) {
        setStudents(data as unknown as StudentData[]);
      }
      setResetRequests(Array.isArray(requestsData) ? (requestsData as HomeroomResetRequest[]) : []);
    } catch (error) {
      console.error("Failed to load students", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStudents();
  }, []);

  const handleResetHomeroomStudentPassword = async (studentId: string, fullName: string, className?: string | null) => {
    if (!confirm(`Cấp lại mật khẩu tạm mới cho học sinh "${fullName}" (lớp chủ nhiệm)? Phiên đăng nhập cũ sẽ bị đăng xuất.`)) {
      return;
    }
    setResettingStudentId(studentId);
    try {
      const res = await teacherService.resetHomeroomStudentPassword(studentId);
      setTempPasswordModal({
        fullName: res?.user?.fullName || fullName,
        studentCode: res?.user?.studentCode,
        email: res?.user?.email,
        className: res?.user?.className || className || null,
        roleLabel: "Học sinh lớp chủ nhiệm",
        tempPassword: res.tempPassword,
        notifiedParents: res?.notifiedParents || [],
      });
      await loadStudents();
    } catch (error: any) {
      notify(error?.message || "Không thể cấp lại mật khẩu cho học sinh.");
    } finally {
      setResettingStudentId(null);
    }
  };

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.className) set.add(s.className);
      else if (s.grade) set.add(s.grade);
    });
    return Array.from(set);
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        !searchTerm ||
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentCode?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass =
        selectedClass === "all" ||
        s.className === selectedClass ||
        s.grade === selectedClass;

      const matchesStatus =
        selectedStatus === "all" ||
        s.status === selectedStatus;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, searchTerm, selectedClass, selectedStatus]);

  const handleExportHomeroomCredentials = () => {
    const homeroomStudent = students.find((s) => s.isHomeroomTeacher && s.classId);
    const query = homeroomStudent?.classId ? `?classId=${homeroomStudent.classId}` : '';
    window.open(`/api/proxy/schools/export/credentials${query}`, '_blank');
  };

  const handleOpenScoreModal = (student: StudentData, customAttempt?: { id: string; quizTitle: string; score: number }) => {
    setEditingStudent(
      customAttempt
        ? {
            ...student,
            latestAttemptId: customAttempt.id,
            latestQuizTitle: customAttempt.quizTitle,
            latestScore: customAttempt.score,
          }
        : student,
    );
    setNewScore(customAttempt ? customAttempt.score : student.latestScore ?? student.progress ?? 80);
    setScoreReason("");
  };

  const handleOpenStudentHistory = async (student: StudentData) => {
    setLoadingHistory(true);
    try {
      const res = await teacherService.getStudentAttempts(student.id);
      setHistoryModal(res);
    } catch (error: any) {
      notify(error?.message || "Không thể tải lịch sử bài làm của học sinh.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const buildRemindDraft = (
    student: StudentData,
    audience: "STUDENTS" | "PARENTS" | "BOTH",
  ) => {
    if (audience === "STUDENTS") {
      return {
        title: `Nhắc nhở học tập riêng cho em ${student.name}`,
        body: `Chào em ${student.name}, thầy/cô thấy kết quả luyện tập gần đây của em cần cố gắng thêm. Em hãy xem lại Bài giảng, hỏi Gia sư AI phần chưa hiểu và làm lại bài luyện tập để cải thiện điểm số nhé!`,
      };
    }
    if (audience === "PARENTS") {
      return {
        title: `Thông báo tình hình học tập của em ${student.name}`,
        body: `Kính gửi Quý phụ huynh em ${student.name} (${student.className || student.grade}), sau khi đã nhắc nhở em trên lớp nhưng kết quả học tập vẫn cần cải thiện, mong gia đình phối hợp đôn đốc em ôn bài và hoàn thành bài luyện tập trên AI Tutor.`,
      };
    }
    return {
      title: `Nhắc nhở tình hình học tập của em ${student.name}`,
      body: `Kính gửi Quý phụ huynh và em ${student.name} (${student.className || student.grade}), giáo viên trao đổi về tình hình ôn tập và làm bài gần đây. Mong gia đình và em cùng phối hợp ôn lại bài giảng và làm bài luyện tập trên AI Tutor.`,
    };
  };

  const handleOpenRemindModal = (student: StudentData) => {
    setRemindStudent(student);
    setRemindAudience("STUDENTS");
    const draft = buildRemindDraft(student, "STUDENTS");
    setRemindTitle(draft.title);
    setRemindBody(draft.body);
  };

  const handleSendQuickRemind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remindStudent || !remindTitle.trim() || !remindBody.trim()) return;
    setSendingRemind(true);
    try {
      const res = await teacherService.sendNotification({
        targetType: "STUDENT",
        studentId: remindStudent.id,
        audience: remindAudience,
        title: remindTitle.trim(),
        body: remindBody.trim(),
      });
      notify(res.message || "Đã gửi thông báo nhắc nhở!");
      setRemindStudent(null);
    } catch (error: any) {
      notify(error?.message || "Không thể gửi thông báo.");
    } finally {
      setSendingRemind(false);
    }
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent?.latestAttemptId || !scoreReason.trim()) return;
    setSavingScore(true);
    try {
      await teacherService.overrideAttemptScore(
        editingStudent.latestAttemptId,
        Number(newScore),
        scoreReason.trim()
      );
      setEditingStudent(null);
      await loadStudents();
    } catch (error: any) {
      notify(error?.message || "Không thể cập nhật điểm bài làm.");
    } finally {
      setSavingScore(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-10">
      {/* Main Content - Table */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{t('title')}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên, mã HS, email..."
                className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {students.some((s) => s.isHomeroomTeacher) && (
              <button
                onClick={handleExportHomeroomCredentials}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap shadow-sm"
                title="Xuất danh sách tài khoản lớp chủ nhiệm"
              >
                <Download className="w-4 h-4" /> Xuất TK Lớp CN
              </button>
            )}
          </div>
        </div>

        {resetRequests.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
              <BellRing className="w-4 h-4 shrink-0" />
              Có {resetRequests.length} yêu cầu cấp lại mật khẩu từ Học sinh lớp chủ nhiệm
            </div>
            <div className="space-y-2">
              {resetRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-gray-900/90 border border-amber-200/70 dark:border-amber-900/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                      <span>{req.fullName}</span>
                      {req.studentCode && (
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {req.studentCode}
                        </span>
                      )}
                      {req.className && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {req.className}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Gửi lúc {new Date(req.createdAt).toLocaleString("vi-VN")}
                      {req.reason ? ` • Ghi chú: "${req.reason}"` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={resettingStudentId === req.userId}
                    onClick={() =>
                      handleResetHomeroomStudentPassword(req.userId, req.fullName, req.className)
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 disabled:opacity-50 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    {resettingStudentId === req.userId ? "Đang cấp..." : "Cấp mật khẩu tạm"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
          {/* Filters */}
          <div className="border-b border-gray-100 dark:border-card-border p-4 flex items-center justify-between overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg">
                <Filter className="w-4 h-4" /> {t('filter')}
              </span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]"
              >
                <option value="all">Tất cả lớp</option>
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[120px]"
              >
                <option value="all">{t('anyStatus')}</option>
                <option value="Active">{t('active')}</option>
                <option value="At Risk">{t('atRisk')}</option>
              </select>
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedClass("all");
                setSelectedStatus("all");
              }}
              className="text-sm font-medium text-primary hover:text-primary-hover px-2"
            >
              {t('clearFilters')}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-card-border text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold bg-gray-50/50 dark:bg-gray-800/20">
                  <th className="px-6 py-4">{t('studentName')}</th>
                  <th className="px-6 py-4">Lớp / Vai trò GV</th>
                  <th className="px-6 py-4">Level & Streak</th>
                  <th className="px-6 py-4">{t('lastActivity')}</th>
                  <th className="px-6 py-4">Điểm TB ({t('progress')})</th>
                  <th className="px-6 py-4">{t('status')}</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-card-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Đang tải danh sách học sinh...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Chưa có học sinh nào phù hợp.
                    </td>
                  </tr>
                ) : filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${student.color || 'bg-indigo-500'} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                          {student.initials || 'HS'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                            {student.name}
                            {student.studentCode && (
                              <span className="text-[11px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                                {student.studentCode}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-700 dark:text-gray-200 font-semibold">
                          {student.className || student.grade}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {student.isHomeroomTeacher ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              GVCN (Toàn bộ môn)
                            </span>
                          ) : (
                            student.subjects?.map((subj, idx) => (
                              <span key={idx} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                GVBM: {subj}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Lv {student.level || 1}</span>
                        <span className="text-xs text-orange-500 flex items-center gap-1">
                          Chuỗi: {student.streak || 0} ngày
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div>{student.lastActivity ? new Date(student.lastActivity).toLocaleDateString('vi-VN') : 'Chưa có'}</div>
                      {student.latestQuizTitle && (
                        <div className="text-[11px] text-gray-400 truncate max-w-[140px]" title={student.latestQuizTitle}>
                          {student.latestQuizTitle}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden min-w-[80px]">
                          <div 
                            className={`h-full rounded-full ${student.progress > 80 ? 'bg-emerald-500' : student.progress > 40 ? 'bg-amber-500' : 'bg-gray-400'}`} 
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        student.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50' : 
                        student.status === 'At Risk' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50' : 
                        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                      }`}>
                        {student.status === 'Active' ? t('active') : student.status === 'At Risk' ? t('atRisk') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleOpenStudentHistory(student)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 transition-colors"
                          title="Xem lịch sử toàn bộ bài làm của học sinh"
                        >
                          <FileText className="w-3.5 h-3.5" /> Bài làm
                        </button>
                        <button
                          onClick={() => handleOpenRemindModal(student)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 transition-colors"
                          title="Nhắc nhở riêng Học sinh trước hoặc thông báo Phụ huynh"
                        >
                          <BellRing className="w-3.5 h-3.5" /> Nhắc nhở
                        </button>
                        {student.isHomeroomTeacher && (
                          <button
                            onClick={() =>
                              handleResetHomeroomStudentPassword(
                                student.id,
                                student.name,
                                student.className || student.grade,
                              )
                            }
                            disabled={resettingStudentId === student.id}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 transition-colors disabled:opacity-50"
                            title="GVCN cấp lại mật khẩu tạm cho học sinh lớp chủ nhiệm"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            {resettingStudentId === student.id ? "Đang cấp..." : "Cấp MK"}
                          </button>
                        )}
                        {student.latestAttemptId && (
                          <button
                            onClick={() => handleOpenScoreModal(student)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 transition-colors"
                            title="Chỉnh sửa điểm bài kiểm tra gần nhất (FR-QUIZ-007)"
                          >
                            <Edit className="w-3.5 h-3.5" /> Sửa điểm
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 dark:border-card-border p-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div>Hiển thị {filteredStudents.length} / {students.length} học sinh</div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Quick Stats */}
      <div className="w-full lg:w-72 space-y-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('quickStats')}</h3>
        
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{t('activeToday')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{activeToday}</h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{t('newThisWeek')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{newThisWeek}</h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-red-100 dark:border-red-900/30 p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-bl-full -z-10"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{t('studentsAtRisk')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{studentsAtRisk}</h3>
        </div>
      </div>

      {/* Manual Score Override Modal (FR-QUIZ-007) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Điều chỉnh điểm bài làm (FR-QUIZ-007)
              </h3>
              <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveScore} className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm">
                <div className="font-bold text-gray-900 dark:text-white">{editingStudent.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Bài kiểm tra: <span className="font-semibold">{editingStudent.latestQuizTitle || "Bài làm gần nhất"}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Điểm hiện tại: <span className="font-bold text-blue-600">{editingStudent.latestScore ?? editingStudent.progress}%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Điểm mới (Thang 0 - 100) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={newScore}
                  onChange={(e) => setNewScore(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lý do điều chỉnh điểm (Bắt buộc lưu Audit Log) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={scoreReason}
                  onChange={(e) => setScoreReason(e.target.value)}
                  placeholder="VD: Chấm phúc khảo câu tự luận số 5, cộng thêm 10 điểm..."
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingScore || !scoreReason.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  {savingScore ? "Đang lưu..." : "Lưu điểm & Ghi Audit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Student Full Attempts History Modal */}
      {(historyModal || loadingHistory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {loadingHistory || !historyModal ? (
              <div className="p-14 flex justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Lịch sử bài làm: {historyModal.student.fullName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {historyModal.student.studentCode ? `Mã: ${historyModal.student.studentCode} • ` : ""}
                      {historyModal.student.className} • {historyModal.attempts.length} bài đã nộp
                    </p>
                  </div>
                  <button
                    onClick={() => setHistoryModal(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 divide-y divide-gray-100 dark:divide-gray-800">
                  {historyModal.attempts.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-500">
                      Học sinh chưa hoàn thành bài luyện tập nào trong phạm vi bạn phụ trách.
                    </div>
                  ) : (
                    historyModal.attempts.map((att) => {
                      const matchedStudent = students.find((s) => s.id === historyModal.student.id);
                      return (
                        <div key={att.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {att.quizTitle}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {att.subjectName} • {att.totalQuestions} câu •{" "}
                              {new Date(att.completedAt).toLocaleString("vi-VN")}
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                                att.score >= 80
                                  ? "bg-emerald-50 text-emerald-700"
                                  : att.score >= 60
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {att.score}%
                            </span>
                            {att.canEditScore && matchedStudent && (
                              <button
                                type="button"
                                onClick={() => {
                                  setHistoryModal(null);
                                  handleOpenScoreModal(matchedStudent, {
                                    id: att.id,
                                    quizTitle: att.quizTitle,
                                    score: att.score,
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold"
                              >
                                <Edit className="w-3 h-3" /> Sửa điểm
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quick Remind Parent Modal */}
      {remindStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-emerald-600" />
                Nhắc nhở học tập: {remindStudent.name}
              </h3>
              <button
                onClick={() => setRemindStudent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendQuickRemind} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Đối tượng nhận
                </label>
                <select
                  value={remindAudience}
                  onChange={(e) => {
                    const nextAud = e.target.value as "STUDENTS" | "PARENTS" | "BOTH";
                    setRemindAudience(nextAud);
                    if (remindStudent) {
                      const draft = buildRemindDraft(remindStudent, nextAud);
                      setRemindTitle(draft.title);
                      setRemindBody(draft.body);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                >
                  <option value="STUDENTS">1. Chỉ nhắc riêng Học sinh trước (chưa báo Phụ huynh)</option>
                  <option value="PARENTS">2. Báo riêng Phụ huynh liên kết (khi HS chưa tiến bộ)</option>
                  <option value="BOTH">3. Gửi đồng thời cả Phụ huynh & Học sinh</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  required
                  value={remindTitle}
                  onChange={(e) => setRemindTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Nội dung nhắc nhở *
                </label>
                <textarea
                  rows={4}
                  required
                  value={remindBody}
                  onChange={(e) => setRemindBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRemindStudent(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={sendingRemind}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingRemind ? "Đang gửi..." : "Gửi thông báo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TempPasswordModal
        data={tempPasswordModal}
        onClose={() => setTempPasswordModal(null)}
      />
    </div>
  );
}
