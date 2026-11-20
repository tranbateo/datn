"use client";

import {
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Edit,
  Trash2,
  KeyRound,
  BellRing,
  Phone,
  Link2,
  Unlink,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo, useEffect } from "react";
import { fetchApi } from "@/lib/api-client";
import { notify } from "@/lib/toast";
import { formatClassLabel } from "@/services/users.service";
import { User, Student } from "@/types";
import UserModal from "@/components/admin/UserModal";
import TempPasswordModal, {
  TempPasswordModalData,
} from "@/components/shared/TempPasswordModal";

interface ParentResetRequest {
  id: string;
  userId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  reason?: string | null;
  createdAt: string;
}

export default function AdminParentsClient({
  initialData,
}: {
  initialData: any[];
}) {
  const t = useTranslations("Admin.Parents");
  const [parents, setParents] = useState<any[]>(initialData || []);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [resetRequests, setResetRequests] = useState<ParentResetRequest[]>([]);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [tempPasswordModal, setTempPasswordModal] =
    useState<TempPasswordModalData | null>(null);

  // Link/Unlink student modal state
  const [linkingParent, setLinkingParent] = useState<any | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  const loadResetRequests = () => {
    fetchApi<ParentResetRequest[]>("/admin/password-reset-requests?role=PARENT")
      .then((res) => setResetRequests(Array.isArray(res) ? res : []))
      .catch(() => {});
  };

  useEffect(() => {
    loadResetRequests();
    fetchApi<Student[]>("/admin/users/students")
      .then((res) => setAllStudents(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  const [oneWeekAgoTs] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newThisWeekCount = useMemo(
    () =>
      parents.filter(
        (p) => p.createdAt && new Date(p.createdAt).getTime() >= oneWeekAgoTs,
      ).length,
    [parents, oneWeekAgoTs],
  );

  const filteredParents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return parents.filter((parent) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && parent.isActive) ||
        (statusFilter === "inactive" && !parent.isActive);
      if (!matchesStatus) return false;
      if (!q) return true;
      const childMatch = (parent.parentLinks || []).some(
        (l: any) =>
          l.student?.fullName?.toLowerCase().includes(q) ||
          l.student?.studentCode?.toLowerCase().includes(q),
      );
      return (
        parent.fullName?.toLowerCase().includes(q) ||
        parent.email?.toLowerCase().includes(q) ||
        parent.phone?.toLowerCase().includes(q) ||
        childMatch
      );
    });
  }, [parents, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredParents.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedParents = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredParents.slice(start, start + pageSize);
  }, [filteredParents, safePage]);

  const handleOpenModal = (user?: any) => {
    setSelectedUser(user ? (user as User) : null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (data: Partial<User>) => {
    if (selectedUser) {
      const updatedUser = await fetchApi<any>(
        `/admin/users/${selectedUser.id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
      );
      setParents(
        parents.map((s) =>
          s.id === selectedUser.id ? { ...s, ...data, ...updatedUser } : s,
        ),
      );
    } else {
      const newUser = await fetchApi<any>(`/admin/users`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      setParents([newUser, ...parents]);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phụ huynh này?")) return;
    try {
      await fetchApi(`/admin/users/${id}`, { method: "DELETE" });
      setParents(parents.filter((s) => s.id !== id));
      notify("Đã xóa tài khoản phụ huynh.");
    } catch (err: any) {
      notify(err?.message || "Không thể xóa tài khoản phụ huynh.");
    }
  };

  const handleResetParentPassword = async (
    parentId: string,
    fullName: string,
  ) => {
    if (
      !confirm(
        `Cấp lại mật khẩu tạm mới cho phụ huynh "${fullName}"? Phiên đăng nhập cũ sẽ bị đăng xuất.`,
      )
    ) {
      return;
    }
    setResettingUserId(parentId);
    try {
      const res = await fetchApi<{
        tempPassword: string;
        user: {
          fullName: string;
          email?: string | null;
          phone?: string | null;
        };
      }>(`/admin/users/${parentId}/reset-password`, { method: "POST" });
      setTempPasswordModal({
        fullName: res.user?.fullName || fullName,
        email: res.user?.phone || res.user?.email,
        roleLabel: "Phụ huynh",
        tempPassword: res.tempPassword,
      });
      loadResetRequests();
    } catch (error: any) {
      notify(error?.message || "Không thể cấp lại mật khẩu.");
    } finally {
      setResettingUserId(null);
    }
  };

  const handleLinkStudent = async () => {
    if (!linkingParent || !selectedStudentId) return;
    setSavingLink(true);
    try {
      const updatedParent = await fetchApi<any>(
        `/admin/parents/${linkingParent.id}/link-student`,
        {
          method: "POST",
          body: JSON.stringify({ studentId: selectedStudentId }),
        },
      );
      setParents((prev) =>
        prev.map((p) => (p.id === linkingParent.id ? updatedParent : p)),
      );
      setLinkingParent(updatedParent);
      setSelectedStudentId("");
      notify("Đã liên kết học sinh với phụ huynh thành công!");
    } catch (error: any) {
      notify(error?.message || "Không thể liên kết học sinh.");
    } finally {
      setSavingLink(false);
    }
  };

  const handleUnlinkStudent = async (parentId: string, studentId: string) => {
    if (!confirm("Gỡ liên kết giữa phụ huynh và học sinh này?")) return;
    try {
      await fetchApi(`/admin/parents/${parentId}/link-student/${studentId}`, {
        method: "DELETE",
      });
      setParents((prev) =>
        prev.map((p) =>
          p.id === parentId
            ? {
                ...p,
                parentLinks: (p.parentLinks || []).filter(
                  (l: any) => l.student?.id !== studentId,
                ),
              }
            : p,
        ),
      );
      if (linkingParent?.id === parentId) {
        setLinkingParent((prev: any) =>
          prev
            ? {
                ...prev,
                parentLinks: (prev.parentLinks || []).filter(
                  (l: any) => l.student?.id !== studentId,
                ),
              }
            : null,
        );
      }
      notify("Đã gỡ liên kết.");
    } catch (error: any) {
      notify(error?.message || "Không thể gỡ liên kết.");
    }
  };

  const selectableStudents = useMemo(() => {
    if (!linkingParent) return [];
    const linkedIds = new Set(
      (linkingParent.parentLinks || []).map((l: any) => l.student?.id),
    );
    const q = studentSearch.trim().toLowerCase();
    return allStudents.filter((s) => {
      if (linkedIds.has(s.id)) return false;
      if (!q) return true;
      return (
        s.fullName?.toLowerCase().includes(q) ||
        s.studentCode?.toLowerCase().includes(q) ||
        s.classEnrollments?.[0]?.class?.name?.toLowerCase().includes(q)
      );
    });
  }, [allStudents, linkingParent, studentSearch]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Pending Parent Password Reset Requests */}
        {resetRequests.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
              <BellRing className="w-4 h-4 shrink-0" />
              Có {resetRequests.length} yêu cầu cấp lại mật khẩu từ Phụ huynh
              đang chờ xử lý
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
                      {req.phone && (
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {req.phone}
                        </span>
                      )}
                      {req.email && (
                        <span className="text-xs text-gray-500">
                          {req.email}
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
                    disabled={resettingUserId === req.userId}
                    onClick={() =>
                      handleResetParentPassword(req.userId, req.fullName)
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 disabled:opacity-50 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    {resettingUserId === req.userId
                      ? "Đang cấp..."
                      : "Cấp mật khẩu tạm"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
              {t("title")}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm tên PH, SĐT, email hoặc tên con..."
                className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> {t("addParent")}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
          {/* Filters */}
          <div className="border-b border-gray-100 dark:border-card-border p-4 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg">
                <Filter className="w-4 h-4" /> {t("filters")}
              </span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[130px]"
              >
                <option value="all">{t("anyStatus")}</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            {(searchTerm || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className="text-sm font-medium text-primary hover:text-primary-hover px-2"
              >
                {t("clearFilters")}
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {paginatedParents.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Chưa có dữ liệu phụ huynh phù hợp
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-card-border text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold bg-gray-50/50 dark:bg-gray-800/20">
                    <th className="px-6 py-4">{t("parentName")}</th>
                    <th className="px-6 py-4">SĐT / Liên hệ</th>
                    <th className="px-6 py-4">{t("linkedStudents")}</th>
                    <th className="px-6 py-4">{t("status")}</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-card-border">
                  {paginatedParents.map((parent: any) => (
                    <tr
                      key={parent.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                            {parent.fullName ? parent.fullName.charAt(0) : "P"}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">
                              {parent.fullName || "Chưa cập nhật"}
                            </div>
                            <div className="text-xs text-gray-400">
                              Tạo ngày{" "}
                              {new Date(parent.createdAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          {parent.phone ? (
                            <div className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {parent.phone}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Chưa có SĐT
                            </span>
                          )}
                          {parent.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {parent.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {parent.parentLinks && parent.parentLinks.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {parent.parentLinks.map(
                              (link: any, index: number) => {
                                const clsName =
                                  link.student?.classEnrollments?.[0]?.class
                                    ?.name;
                                return (
                                  <span
                                    key={link.student?.id || index}
                                    className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg font-medium"
                                  >
                                    <span>
                                      {link.student?.fullName || "Học sinh"}
                                    </span>
                                    {(clsName || link.student?.grade) && (
                                      <span className="text-[11px] font-bold opacity-80">
                                        (
                                        {formatClassLabel(
                                          clsName,
                                          link.student?.grade,
                                        )}
                                        )
                                      </span>
                                    )}
                                  </span>
                                );
                              },
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded font-medium">
                            Chưa liên kết con
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            parent.isActive
                              ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          {parent.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setLinkingParent(parent);
                              setSelectedStudentId("");
                              setStudentSearch("");
                            }}
                            title="Quản lý liên kết con"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleResetParentPassword(
                                parent.id,
                                parent.fullName || parent.phone || "Phụ huynh",
                              )
                            }
                            disabled={resettingUserId === parent.id}
                            title="Cấp lại mật khẩu tạm"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenModal(parent)}
                            title="Chỉnh sửa"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(parent.id)}
                            title="Xóa"
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-100 dark:border-card-border p-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div>
              Hiển thị {paginatedParents.length} / {filteredParents.length} phụ
              huynh (Trang {safePage}/{totalPages})
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 rounded-lg bg-primary text-white font-medium text-xs shadow-sm">
                {safePage}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Quick Stats */}
      <div className="w-full lg:w-72 space-y-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {t("quickStats")}
        </h3>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
            {t("totalParents")}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
            {parents.length}
          </h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-4">
            <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
            {t("newThisWeek")}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
            {newThisWeekCount}
          </h3>
        </div>
      </div>

      {/* Manage Parent–Student Links Modal */}
      {linkingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-indigo-600" /> Liên kết Học
                  sinh — {linkingParent.fullName}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {linkingParent.phone || linkingParent.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLinkingParent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-gray-500">
                  Học sinh đang liên kết (
                  {linkingParent.parentLinks?.length || 0})
                </h4>
                {linkingParent.parentLinks &&
                linkingParent.parentLinks.length > 0 ? (
                  <div className="space-y-2">
                    {linkingParent.parentLinks.map((link: any) => {
                      const clsName =
                        link.student?.classEnrollments?.[0]?.class?.name;
                      return (
                        <div
                          key={link.student?.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 text-sm"
                        >
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {link.student?.fullName}
                            </span>{" "}
                            <span className="text-xs text-gray-500">
                              ({link.student?.studentCode || "-"} •{" "}
                              {formatClassLabel(clsName, link.student?.grade)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleUnlinkStudent(
                                linkingParent.id,
                                link.student?.id,
                              )
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1 rounded-lg"
                          >
                            <Unlink className="w-3.5 h-3.5" /> Gỡ
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    Chưa liên kết với học sinh nào.
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase text-gray-500">
                  Thêm liên kết học sinh mới
                </h4>
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Lọc nhanh theo tên, mã HS, lớp..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                />
                <div className="flex gap-2">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="">-- Chọn học sinh --</option>
                    {selectableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentCode || "-"} •{" "}
                        {formatClassLabel(
                          s.classEnrollments?.[0]?.class?.name,
                          Number(s.grade) || undefined,
                        )}
                        )
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedStudentId || savingLink}
                    onClick={handleLinkStudent}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {savingLink ? "Đang gán..." : "Liên kết"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
        role="PARENT"
      />
      <TempPasswordModal
        data={tempPasswordModal}
        onClose={() => setTempPasswordModal(null)}
      />
    </div>
  );
}
