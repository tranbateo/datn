"use client";

import { notify } from "@/lib/toast";
import { API_ENDPOINTS } from "@/constants/api";
import { fetchApi } from "@/lib/api-client";
import {
  Search,
  Upload,
  FileText,
  File as FileIcon,
  RefreshCw,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";

function parseSizeToMb(raw?: string | number | null): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw > 1000 ? raw / (1024 * 1024) : raw;
  }
  if (typeof raw === "string") {
    const upper = raw.trim().toUpperCase();
    const match = upper.match(/[\d.]+/);
    if (!match) return 0;
    const val = Number(match[0]);
    if (!Number.isFinite(val)) return 0;
    if (upper.includes("GB")) return val * 1024;
    if (upper.includes("KB")) return val / 1024;
    if (upper.includes("MB")) return val;
    return val > 1000 ? val / (1024 * 1024) : val;
  }
  return 0;
}

export default function ResourceLibrary() {
  const t = useTranslations("Admin.Documents");

  const [documents, setDocuments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsRes, coursesRes] = await Promise.all([
        fetchApi<any[]>(API_ENDPOINTS.DOCUMENTS.LIST).catch(() => []),
        fetchApi<any[]>("/admin/courses").catch(() => []),
      ]);
      setDocuments(Array.isArray(docsRes) ? docsRes : []);
      const cList = Array.isArray(coursesRes) ? coursesRes : [];
      setCourses(cList);
      if (!selectedCourseId && cList.length > 0) {
        setSelectedCourseId(cList[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchApi<any[]>(API_ENDPOINTS.DOCUMENTS.LIST).catch(() => []),
      fetchApi<any[]>("/admin/courses").catch(() => []),
    ])
      .then(([docsRes, coursesRes]) => {
        if (!active) return;
        setDocuments(Array.isArray(docsRes) ? docsRes : []);
        const cList = Array.isArray(coursesRes) ? coursesRes : [];
        setCourses(cList);
        if (cList.length > 0) setSelectedCourseId(cList[0].id);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedCourseId) {
      notify("Vui lòng chọn Khóa học / Môn học trước khi tải tài liệu PDF lên.");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetchApi<{ message?: string }>(
        API_ENDPOINTS.DOCUMENTS.UPLOAD(selectedCourseId),
        {
          method: "POST",
          body: formData,
        },
      );

      notify(
        res?.message ||
          "Tài liệu đã được tải lên và tách nội dung cho Học sinh & Gia sư AI.",
      );
      await loadData();
    } catch (error: any) {
      console.error(error);
      notify(error?.message || "Lỗi khi tải tài liệu (chỉ nhận file PDF chuẩn ≤ 20MB).");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteDocument = async (doc: any) => {
    if (
      !confirm(
        `Gỡ bỏ tài liệu "${doc.fileName}"? Tệp PDF gốc và toàn bộ đoạn kiến thức RAG liên quan sẽ bị xóa vĩnh viễn.`,
      )
    ) {
      return;
    }
    setDeletingId(doc.id);
    try {
      await fetchApi(`/documents/${doc.id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      notify("Đã gỡ tài liệu và dọn sạch vector RAG.");
    } catch (err: any) {
      notify(err?.message || "Không thể xóa tài liệu.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesSearch =
        !q ||
        doc.fileName?.toLowerCase().includes(q) ||
        doc.course?.title?.toLowerCase().includes(q) ||
        doc.course?.subject?.name?.toLowerCase().includes(q) ||
        doc.course?.teacher?.fullName?.toLowerCase().includes(q);
      const matchesType =
        typeFilter === "ALL" ||
        (typeFilter === "PDF" && doc.type?.toLowerCase().includes("pdf")) ||
        (typeFilter === "OTHER" && !doc.type?.toLowerCase().includes("pdf"));
      return matchesSearch && matchesType;
    });
  }, [documents, searchQuery, typeFilter]);

  const embeddedCount = useMemo(
    () =>
      documents.filter((d) => d.status === "Embedded" || d.status === "READY")
        .length,
    [documents],
  );
  const processingDocs = useMemo(
    () =>
      documents.filter(
        (d) =>
          d.status === "Processing" ||
          d.status === "Pending" ||
          d.status === "PROCESSING",
      ),
    [documents],
  );
  const totalSizeMb = useMemo(
    () => documents.reduce((sum, d) => sum + parseSizeToMb(d.size), 0),
    [documents],
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t("title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {t("subtitle")} — Kiểm duyệt, xem trực tiếp PDF và quản lý kho kiến
            thức RAG toàn trường.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            aria-label="Chọn khóa học để tải tài liệu"
            className="px-3 py-2.5 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 max-w-xs"
          >
            <option value="">-- Chọn khóa học đích --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                [Khối {c.grade || "?"}] {c.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-2 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-3.5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />{" "}
            Làm mới
          </button>

          <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploading ? "Đang tải & tách trang..." : "Tải PDF vào khóa đã chọn"}
            <input
              type="file"
              className="hidden"
              accept=".pdf,application/pdf"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Documents Table */}
        <div className="flex-1 w-full space-y-4">
          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm flex flex-col min-h-[450px]">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <button
                  type="button"
                  onClick={() => setTypeFilter("ALL")}
                  className={`px-3.5 py-1.5 rounded-full transition-colors ${
                    typeFilter === "ALL"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {t("allTypes")} ({documents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter("PDF")}
                  className={`px-3.5 py-1.5 rounded-full transition-colors ${
                    typeFilter === "PDF"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter("OTHER")}
                  className={`px-3.5 py-1.5 rounded-full transition-colors ${
                    typeFilter === "OTHER"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  Khác
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên file, môn học, giáo viên..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-xs">
                      {t("documentName")}
                    </th>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-xs">
                      Khóa học / GV
                    </th>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-xs">
                      {t("size")}
                    </th>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-xs">
                      {t("status")}
                    </th>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-xs">
                      {t("uploaded")}
                    </th>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-xs text-right">
                      Kiểm duyệt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        Đang tải tài liệu...
                      </td>
                    </tr>
                  )}
                  {filteredDocuments.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        Chưa có tài liệu nào phù hợp.
                      </td>
                    </tr>
                  )}
                  {filteredDocuments.map((doc) => {
                    const sizeMb = parseSizeToMb(doc.size);
                    return (
                      <tr
                        key={doc.id}
                        className={`${
                          doc.status === "Failed"
                            ? "bg-red-50/30 dark:bg-red-900/10"
                            : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                        } transition-colors`}
                      >
                        <td className="px-5 py-4 max-w-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                              {doc.type?.toLowerCase().includes("pdf") ? (
                                <FileText className="w-4 h-4 text-red-500" />
                              ) : (
                                <FileIcon className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                            <span
                              className="font-medium text-gray-800 dark:text-gray-200 truncate"
                              title={doc.fileName}
                            >
                              {doc.fileName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 max-w-[220px]">
                          <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                            {doc.course?.title || "Chưa gắn khóa học"}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {doc.course?.subject?.name
                              ? `${doc.course.subject.name}`
                              : ""}
                            {doc.course?.grade
                              ? ` • Khối ${doc.course.grade}`
                              : ""}
                            {doc.course?.teacher?.fullName
                              ? ` • ${doc.course.teacher.fullName}`
                              : ""}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400 font-medium text-xs">
                          {sizeMb > 0 ? `${sizeMb.toFixed(2)} MB` : doc.size || "-"}
                        </td>
                        <td className="px-5 py-4">
                          {(doc.status === "Embedded" ||
                            doc.status === "READY") && (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </div>
                          )}
                          {(doc.status === "Processing" ||
                            doc.status === "PROCESSING") && (
                            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full w-fit">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                              Đang xử lý
                            </div>
                          )}
                          {doc.status === "Pending" && (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full w-fit">
                              <Clock className="w-3.5 h-3.5" /> Đang chờ
                            </div>
                          )}
                          {(doc.status === "Failed" ||
                            doc.status === "ERROR") && (
                            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-semibold bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full w-fit">
                              <AlertCircle className="w-3.5 h-3.5" /> Lỗi xử lý
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400 text-xs">
                          {doc.uploadedAt
                            ? new Date(doc.uploadedAt).toLocaleString("vi-VN")
                            : "-"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {doc.hasFile && (
                              <a
                                href={`/api/proxy/documents/${doc.id}/file`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Xem PDF gốc"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              type="button"
                              disabled={deletingId === doc.id}
                              onClick={() => handleDeleteDocument(doc)}
                              title="Xóa / Gỡ tài liệu"
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 mt-auto border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
              <div>
                Hiển thị {filteredDocuments.length} / {documents.length} tài
                liệu học tập
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status Panels */}
        <div className="w-full lg:w-72 space-y-5">
          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-5">
              {t("pipelineHealth")}
            </h3>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-end mb-1.5 text-xs">
                  <span className="font-semibold text-gray-600 dark:text-gray-300">
                    Đã nhúng RAG
                  </span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">
                    {embeddedCount} / {documents.length}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{
                      width: `${documents.length > 0 ? Math.round((embeddedCount / documents.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1.5 text-xs">
                  <span className="font-semibold text-gray-600 dark:text-gray-300">
                    Dung lượng lưu trữ
                  </span>
                  <span className="font-bold text-blue-700 dark:text-blue-400">
                    {totalSizeMb.toFixed(2)} MB / 500 MB
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(2, Math.round((totalSizeMb / 500) * 100)))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              {t("activeQueue")} ({processingDocs.length})
            </h3>

            {processingDocs.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hiện không có tài liệu nào đang chờ xử lý.
              </p>
            ) : (
              <div className="space-y-2">
                {processingDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50 flex justify-between items-center gap-2"
                  >
                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {doc.fileName}
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded uppercase shrink-0">
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
