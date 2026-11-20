"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BellRing,
  Send,
  KeyRound,
  Users,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  CheckCheck,
  Clock,
  GraduationCap,
} from "lucide-react";
import { teacherService } from "@/services/teacher.service";
import { fetchApi } from "@/lib/api-client";
import { notify } from "@/lib/toast";
import TempPasswordModal, {
  TempPasswordModalData,
} from "@/components/shared/TempPasswordModal";

interface ClassOption {
  id: string;
  name: string;
  grade: number;
  role: "GVCN" | "GVBM";
  subjectName?: string;
  studentsCount: number;
}

interface StudentOption {
  id: string;
  name: string;
  studentCode?: string | null;
  className?: string | null;
  isHomeroomTeacher?: boolean;
}

interface ResetRequestItem {
  id: string;
  userId: string;
  fullName: string;
  studentCode?: string | null;
  email?: string | null;
  className?: string | null;
  reason?: string | null;
  createdAt: string;
}

interface ScopedParentItem {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  students: Array<{
    id: string;
    fullName: string;
    studentCode?: string | null;
    className: string;
    teacherRole: "GVCN" | "GVBM";
  }>;
}

interface ProposalItem {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  parent?: { id: string; fullName?: string | null; phone?: string | null };
  student?: { id: string; fullName?: string | null; studentCode?: string | null };
}

interface InboxNotification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatMessageItem {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

const QUICK_TEMPLATES = [
  {
    label: "Nhắc ôn tập kiểm tra",
    title: "Nhắc nhở ôn tập bài kiểm tra sắp tới",
    body: "Kính gửi Quý phụ huynh và các em học sinh, tuần này lớp sẽ có bài kiểm tra định kỳ. Mong Quý phụ huynh nhắc nhở con ôn lại bài giảng trong mục Bài giảng và làm đề luyện tập trên hệ thống AI Tutor.",
  },
  {
    label: "Cảnh báo kết quả học tập",
    title: "Trao đổi về tình hình học tập của học sinh",
    body: "Kính gửi Quý phụ huynh, giáo viên ghi nhận gần đây em cần củng cố thêm kiến thức nền tảng và hoàn thành đầy đủ bài luyện tập. Mong gia đình phối hợp đôn đốc em ôn tập cùng Gia sư AI mỗi ngày 15-20 phút.",
  },
  {
    label: "Thông báo lớp chủ nhiệm",
    title: "Thông báo sinh hoạt & nề nếp lớp chủ nhiệm",
    body: "Kính gửi Quý phụ huynh lớp chủ nhiệm, giáo viên thông báo lịch tổng kết tuần và dặn dò chuẩn bị bài vở cho tuần học mới. Rất mong nhận được sự đồng hành của Quý phụ huynh.",
  },
];

function TeacherNotificationsContent() {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get("tab");
  const resolvedInitialTab: "send" | "password-resets" | "parents" =
    initialTabParam === "password-resets"
      ? "password-resets"
      : initialTabParam === "parents"
        ? "parents"
        : "send";

  const [activeTab, setActiveTab] = useState<
    "send" | "password-resets" | "parents"
  >(resolvedInitialTab);
  const [prevUrlTab, setPrevUrlTab] = useState(resolvedInitialTab);
  if (resolvedInitialTab !== prevUrlTab) {
    setPrevUrlTab(resolvedInitialTab);
    setActiveTab(resolvedInitialTab);
  }
  const [loading, setLoading] = useState(true);

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [resetRequests, setResetRequests] = useState<ResetRequestItem[]>([]);
  const [parents, setParents] = useState<ScopedParentItem[]>([]);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [inbox, setInbox] = useState<InboxNotification[]>([]);

  // Send notification form state
  const [targetType, setTargetType] = useState<"CLASS" | "STUDENT">("CLASS");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [audience, setAudience] = useState<"PARENTS" | "STUDENTS" | "BOTH">(
    "BOTH",
  );
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [sending, setSending] = useState(false);

  // Password reset state
  const [resettingStudentId, setResettingStudentId] = useState<string | null>(
    null,
  );
  const [tempPasswordModal, setTempPasswordModal] =
    useState<TempPasswordModalData | null>(null);

  // Parent chat state
  const [selectedParent, setSelectedParent] = useState<ScopedParentItem | null>(
    null,
  );
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const loadAll = async (withSpinner = false) => {
    if (withSpinner) setLoading(true);
    try {
      const [
        classesRes,
        studentsRes,
        resetsRes,
        parentsRes,
        proposalsRes,
        inboxRes,
      ] = await Promise.all([
        teacherService.getClasses().catch(() => ({
          homeroomClasses: [],
          subjectClasses: [],
        })),
        teacherService.getStudents().catch(() => []),
        teacherService.getPasswordResetRequests().catch(() => []),
        teacherService.getParents().catch(() => []),
        teacherService.getProposals().catch(() => []),
        fetchApi<InboxNotification[]>("/notifications").catch(() => []),
      ]);

      const mergedClasses = new Map<string, ClassOption>();
      for (const hr of (classesRes as any)?.homeroomClasses || []) {
        mergedClasses.set(hr.id, {
          id: hr.id,
          name: hr.name,
          grade: hr.grade,
          role: "GVCN",
          studentsCount: hr.studentsCount || 0,
        });
      }
      for (const sc of (classesRes as any)?.subjectClasses || []) {
        const cid = sc.classId || sc.id;
        if (!mergedClasses.has(cid)) {
          mergedClasses.set(cid, {
            id: cid,
            name: sc.className || sc.name,
            grade: sc.grade,
            role: "GVBM",
            subjectName: sc.subjectName,
            studentsCount: sc.studentsCount || 0,
          });
        }
      }

      const classList = Array.from(mergedClasses.values()).sort(
        (a, b) => a.grade - b.grade || a.name.localeCompare(b.name),
      );
      setClasses(classList);
      if (classList.length > 0) {
        setSelectedClassId((prev) => prev || classList[0].id);
      }

      const studentList = Array.isArray(studentsRes)
        ? (studentsRes as StudentOption[])
        : [];
      setStudents(studentList);
      if (studentList.length > 0) {
        setSelectedStudentId((prev) => prev || studentList[0].id);
      }

      setResetRequests(
        Array.isArray(resetsRes) ? (resetsRes as ResetRequestItem[]) : [],
      );
      const parentList = Array.isArray(parentsRes)
        ? (parentsRes as ScopedParentItem[])
        : [];
      setParents(parentList);
      if (parentList.length > 0) {
        setSelectedParent((prev) => prev || parentList[0]);
      }

      setProposals(
        Array.isArray(proposalsRes) ? (proposalsRes as ProposalItem[]) : [],
      );
      setInbox(Array.isArray(inboxRes) ? inboxRes : []);
    } catch (err) {
      console.error("Failed to load teacher notifications center:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAll(false);
  }, []);

  useEffect(() => {
    if (!selectedParent) return;
    let active = true;
    teacherService
      .getMessages(selectedParent.id)
      .then((msgs) => {
        if (active) setChatMessages(Array.isArray(msgs) ? msgs : []);
      })
      .catch(() => {
        if (active) setChatMessages([]);
      })
      .finally(() => {
        if (active) setChatLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedParent]);

  const isHomeroomTeacher = useMemo(
    () =>
      classes.some((c) => c.role === "GVCN") ||
      students.some((s) => s.isHomeroomTeacher),
    [classes, students],
  );

  const pendingProposalsCount = useMemo(
    () => proposals.filter((p) => p.status === "PENDING").length,
    [proposals],
  );

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) return;
    if (targetType === "CLASS" && !selectedClassId) {
      notify("Vui lòng chọn lớp học cần gửi thông báo.");
      return;
    }
    if (targetType === "STUDENT" && !selectedStudentId) {
      notify("Vui lòng chọn học sinh cần gửi thông báo.");
      return;
    }

    setSending(true);
    try {
      const res = await teacherService.sendNotification({
        targetType,
        classId: targetType === "CLASS" ? selectedClassId : undefined,
        studentId: targetType === "STUDENT" ? selectedStudentId : undefined,
        audience,
        title: notifTitle.trim(),
        body: notifBody.trim(),
      });
      notify(res.message || "Đã gửi thông báo thành công!");
      setNotifTitle("");
      setNotifBody("");
    } catch (err: any) {
      notify(err?.message || "Không thể gửi thông báo.");
    } finally {
      setSending(false);
    }
  };

  const handleResetStudentPassword = async (req: ResetRequestItem) => {
    if (
      !confirm(
        `Cấp lại mật khẩu tạm mới cho học sinh "${req.fullName}"? Phiên cũ sẽ bị đăng xuất và mật khẩu tạm sẽ tự gửi sang tài khoản Phụ huynh đã liên kết (nếu có).`,
      )
    ) {
      return;
    }
    setResettingStudentId(req.userId);
    try {
      const res = await teacherService.resetHomeroomStudentPassword(req.userId);
      setTempPasswordModal({
        fullName: res?.user?.fullName || req.fullName,
        studentCode: res?.user?.studentCode || req.studentCode,
        email: res?.user?.email || req.email,
        className: res?.user?.className || req.className,
        roleLabel: "Học sinh lớp chủ nhiệm",
        tempPassword: res.tempPassword,
        notifiedParents: res?.notifiedParents || [],
      });
      await loadAll();
    } catch (err: any) {
      notify(err?.message || "Không thể cấp lại mật khẩu.");
    } finally {
      setResettingStudentId(null);
    }
  };

  const handleProposalAction = async (
    proposalId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    try {
      await teacherService.updateProposalStatus(proposalId, status);
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status } : p)),
      );
      notify(
        status === "APPROVED"
          ? "Đã chấp thuận kiến nghị của phụ huynh."
          : "Đã phản hồi từ chối kiến nghị.",
      );
    } catch (err: any) {
      notify(err?.message || "Không thể cập nhật trạng thái kiến nghị.");
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParent || !chatInput.trim()) return;
    setSendingChat(true);
    try {
      const sent = await teacherService.sendMessage(
        selectedParent.id,
        chatInput.trim(),
      );
      setChatMessages((prev) => [...prev, sent]);
      setChatInput("");
    } catch (err: any) {
      notify(err?.message || "Không thể gửi tin nhắn.");
    } finally {
      setSendingChat(false);
    }
  };

  const handleMarkAllInboxRead = async () => {
    setInbox((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetchApi("/notifications/read-all", { method: "PATCH" });
    } catch {
      // Ignore error
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Thông báo & Phối hợp Phụ huynh
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Gửi thông báo nhắc học tập tới Phụ huynh & Học sinh trong lớp phụ
            trách, xử lý yêu cầu cấp lại mật khẩu (GVCN) và trao đổi trực tiếp
            với gia đình.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("send")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "send"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50"
          }`}
        >
          <BellRing className="w-4 h-4" />
          Gửi thông báo Lớp / Phụ huynh
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("password-resets")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "password-resets"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Yêu cầu cấp mật khẩu (GVCN)
          {resetRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-500 text-white">
              {resetRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("parents")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "parents"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Liên lạc & Kiến nghị Phụ huynh
          {pendingProposalsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-700">
              {pendingProposalsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: SEND NOTIFICATION + INBOX */}
      {activeTab === "send" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Compose Notification Form */}
          <div className="lg:col-span-7 bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Soạn thông báo gửi Phụ huynh & Học sinh
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Thông báo gửi tới Phụ huynh sẽ hiển thị ngay đầu Cổng Phụ huynh;
                thông báo gửi tới Học sinh sẽ hiện ở Chuông thông báo của học
                sinh.
              </p>
            </div>

            {/* Quick templates */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Mẫu nhanh:
              </span>
              {QUICK_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNotifTitle(tpl.title);
                    setNotifBody(tpl.body);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Phạm vi gửi
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTargetType("CLASS")}
                      className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                        targetType === "CLASS"
                          ? "bg-white dark:bg-gray-900 text-emerald-700 shadow-xs"
                          : "text-gray-500"
                      }`}
                    >
                      Cả lớp
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType("STUDENT")}
                      className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                        targetType === "STUDENT"
                          ? "bg-white dark:bg-gray-900 text-emerald-700 shadow-xs"
                          : "text-gray-500"
                      }`}
                    >
                      Từng học sinh
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Đối tượng nhận
                  </label>
                  <select
                    value={audience}
                    onChange={(e) =>
                      setAudience(
                        e.target.value as "PARENTS" | "STUDENTS" | "BOTH",
                      )
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="BOTH">Cả Phụ huynh & Học sinh</option>
                    <option value="PARENTS">Chỉ Phụ huynh liên kết</option>
                    <option value="STUDENTS">Chỉ Học sinh</option>
                  </select>
                </div>
              </div>

              {targetType === "CLASS" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Chọn lớp học phụ trách *
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">-- Chọn lớp --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Khối {c.grade} •{" "}
                        {c.role === "GVCN"
                          ? "Lớp Chủ nhiệm"
                          : `GVBM ${c.subjectName || ""}`}{" "}
                        • {c.studentsCount} HS)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Chọn học sinh *
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">-- Chọn học sinh --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.studentCode ? ` (${s.studentCode})` : ""}
                        {s.className ? ` - ${s.className}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tiêu đề thông báo *
                </label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="Ví dụ: Nhắc nhở hoàn thành bài luyện tập Chương II"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Nội dung chi tiết *
                </label>
                <textarea
                  rows={4}
                  required
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  placeholder="Nhập nội dung cần trao đổi hoặc nhắc nhở phụ huynh & học sinh..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? "Đang gửi thông báo..." : "Gửi thông báo ngay"}
              </button>
            </form>
          </div>

          {/* Teacher Inbox Notifications */}
          <div className="lg:col-span-5 bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-blue-600" />
                Thông báo đến ({inbox.length})
              </h3>
              {inbox.some((n) => !n.isRead) && (
                <button
                  type="button"
                  onClick={handleMarkAllInboxRead}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
                </button>
              )}
            </div>

            {inbox.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">
                Chưa có thông báo nào gửi tới bạn.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {inbox.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                      n.isRead
                        ? "bg-gray-50/60 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800"
                        : "bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/70 dark:border-blue-900/50"
                    }`}
                  >
                    <div className="font-bold text-gray-900 dark:text-white">
                      {n.title}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {n.body}
                    </p>
                    <div className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HOMEROOM TEACHER PASSWORD RESET REQUESTS */}
      {activeTab === "password-resets" && (
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                Yêu cầu cấp lại mật khẩu từ Học sinh lớp chủ nhiệm
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Khi bạn bấm Cấp mật khẩu tạm, hệ thống sẽ tự thu hồi phiên cũ,
                bắt buộc học sinh đổi mật khẩu mới và tự động gửi mật khẩu tạm
                sang tài khoản Phụ huynh đã liên kết (nếu có).
              </p>
            </div>
          </div>

          {!isHomeroomTeacher ? (
            <div className="py-10 text-center space-y-2 text-sm text-gray-500">
              <GraduationCap className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="font-semibold text-gray-700 dark:text-gray-300">
                Bạn hiện chỉ phụ trách giảng dạy bộ môn (không kiêm nhiệm GVCN).
              </p>
              <p className="text-xs text-gray-400">
                Theo quy định phân quyền nhà trường, chỉ Giáo viên chủ nhiệm của
                lớp hoặc Quản trị viên nhà trường mới có quyền cấp lại mật khẩu
                cho học sinh.
              </p>
            </div>
          ) : resetRequests.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Hiện không có yêu cầu cấp lại mật khẩu nào đang chờ xử lý từ lớp
              chủ nhiệm của bạn.
            </div>
          ) : (
            <div className="space-y-3">
              {resetRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {req.fullName}
                      </span>
                      {req.studentCode && (
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                          {req.studentCode}
                        </span>
                      )}
                      {req.className && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          {req.className}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Gửi lúc {new Date(req.createdAt).toLocaleString("vi-VN")}
                      {req.reason ? ` • Ghi chú: "${req.reason}"` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={resettingStudentId === req.userId}
                    onClick={() => handleResetStudentPassword(req)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 disabled:opacity-50 transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                    {resettingStudentId === req.userId
                      ? "Đang cấp mật khẩu..."
                      : "Cấp mật khẩu tạm"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PARENT MESSAGING & PROPOSALS */}
      {activeTab === "parents" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Direct Chat with Linked Parents */}
          <div className="lg:col-span-7 bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Nhắn tin với Phụ huynh đã liên kết ({parents.length})
              </h3>
            </div>

            {parents.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                Chưa có Phụ huynh nào liên kết tài khoản với học sinh trong lớp
                bạn phụ trách.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-12 min-h-[380px]">
                <div className="sm:col-span-5 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                  {parents.map((p) => {
                    const isSelected = selectedParent?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setChatLoading(true);
                          setSelectedParent(p);
                        }}
                        className={`w-full text-left p-3.5 transition-colors ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/30"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        <div className="font-bold text-sm text-gray-900 dark:text-white">
                          {p.fullName}
                        </div>
                        {p.phone && (
                          <div className="text-xs text-gray-500">{p.phone}</div>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.students.map((st) => (
                            <span
                              key={st.id}
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                            >
                              PH em {st.fullName} ({st.className})
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="sm:col-span-7 flex flex-col h-[380px]">
                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50 dark:bg-gray-900/40">
                    {chatLoading ? (
                      <div className="py-10 flex justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="py-10 text-center text-xs text-gray-400">
                        Chưa có tin nhắn nào với phụ huynh{" "}
                        <strong>{selectedParent?.fullName}</strong>. Hãy gửi lời
                        chào hoặc trao đổi tình hình học tập của con!
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isFromParent =
                          msg.senderId === selectedParent?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isFromParent ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                                isFromParent
                                  ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                                  : "bg-blue-600 text-white"
                              }`}
                            >
                              <p>{msg.content}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form
                    onSubmit={handleSendChatMessage}
                    className="p-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 bg-white dark:bg-card-bg"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Nhắn cho PH ${selectedParent?.fullName || ""}...`}
                      className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={sendingChat || !chatInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
                    >
                      Gửi
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Proposals from Parents */}
          <div className="lg:col-span-5 bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
              Kiến nghị / Đề xuất từ Phụ huynh ({proposals.length})
            </h3>

            {proposals.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">
                Chưa có kiến nghị nào từ phụ huynh gửi tới bạn.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {proposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">
                          {prop.title}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          PH: {prop.parent?.fullName || "Phụ huynh"}
                          {prop.student?.fullName
                            ? ` • HS: ${prop.student.fullName}`
                            : ""}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          prop.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700"
                            : prop.status === "REJECTED"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {prop.status === "APPROVED"
                          ? "Đã duyệt"
                          : prop.status === "REJECTED"
                            ? "Từ chối"
                            : "Chờ xử lý"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {prop.content}
                    </p>
                    {prop.status === "PENDING" && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleProposalAction(prop.id, "APPROVED")
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Chấp thuận
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleProposalAction(prop.id, "REJECTED")
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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

export default function TeacherNotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <TeacherNotificationsContent />
    </Suspense>
  );
}
