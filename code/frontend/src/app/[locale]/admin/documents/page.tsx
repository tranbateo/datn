"use client";
import { notify } from "@/lib/toast";

import { API_ENDPOINTS } from "@/constants/api";
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
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";

export default function ResourceLibrary() {
  const t = useTranslations("Admin.Documents");

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const loadDocs = async () => {
    setLoading(true);
    try {
      const { fetchApi } = await import("@/lib/api-client");
      const data = await fetchApi<any[]>(API_ENDPOINTS.DOCUMENTS.LIST);
      setDocuments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { fetchApi } = await import("@/lib/api-client");
      const courses = await fetchApi<any[]>(API_ENDPOINTS.COURSES.LIST);
      let courseId = "";
      if (courses && courses.length > 0) {
        courseId = courses[0].id;
      } else {
        notify("Vui lòng tạo khóa học trước khi upload tài liệu.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      await fetchApi(API_ENDPOINTS.DOCUMENTS.UPLOAD(courseId), {
        method: "POST",
        body: formData,
      });

      notify("Tài liệu đã được tải lên và đang được xử lý nhúng Vector RAG.");
      loadDocs();
    } catch (error) {
      console.error(error);
      notify("Lỗi khi tải tài liệu");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        !searchQuery.trim() ||
        doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.type?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        typeFilter === "ALL" ||
        (typeFilter === "PDF" && doc.type?.toLowerCase().includes("pdf")) ||
        (typeFilter === "OTHER" && !doc.type?.toLowerCase().includes("pdf"));
      return matchesSearch && matchesType;
    });
  }, [documents, searchQuery, typeFilter]);

  const embeddedCount = useMemo(
    () => documents.filter((d) => d.status === "Embedded" || d.status === "READY").length,
    [documents]
  );
  const processingDocs = useMemo(
    () => documents.filter((d) => d.status === "Processing" || d.status === "Pending" || d.status === "PROCESSING"),
    [documents]
  );
  const totalSizeMb = useMemo(
    () => documents.reduce((sum, d) => sum + Number(d.size || 0), 0) / (1024 * 1024),
    [documents]
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Search Header */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors dark:text-white placeholder:text-gray-400 shadow-sm"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Documents Table */}
        <div className="flex-1 w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t("title")}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t("subtitle")}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadDocs}
                className="flex items-center gap-2 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
              </button>
              <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                {uploading ? "Đang tải lên..." : t("uploadFiles")}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.md,.txt"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm flex flex-col min-h-[450px]">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <span className="text-gray-400 mr-2 uppercase tracking-wider text-xs font-bold">{t("filters")}</span>
                <button
                  onClick={() => setTypeFilter("ALL")}
                  className={`px-4 py-1.5 rounded-full transition-colors ${
                    typeFilter === "ALL"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {t("allTypes")} ({documents.length})
                </button>
                <button
                  onClick={() => setTypeFilter("PDF")}
                  className={`px-4 py-1.5 rounded-full transition-colors ${
                    typeFilter === "PDF"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  PDF
                </button>
                <button
                  onClick={() => setTypeFilter("OTHER")}
                  className={`px-4 py-1.5 rounded-full transition-colors ${
                    typeFilter === "OTHER"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  Văn bản / Khác
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t("documentName")}</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t("type")}</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t("size")}</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t("status")}</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t("uploaded")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {loading && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        Đang tải tài liệu...
                      </td>
                    </tr>
                  )}
                  {filteredDocuments.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        Chưa có tài liệu nào phù hợp.
                      </td>
                    </tr>
                  )}
                  {filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className={`${
                        doc.status === "Failed"
                          ? "bg-red-50/30 dark:bg-red-900/10"
                          : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                      } transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            {doc.type?.toLowerCase().includes("pdf") ? (
                              <FileText className="w-4 h-4 text-red-500" />
                            ) : (
                              <FileIcon className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{doc.fileName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">{doc.type}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                        {(Number(doc.size || 0) / 1024 / 1024).toFixed(2)} MB
                      </td>
                      <td className="px-6 py-4">
                        {(doc.status === "Embedded" || doc.status === "READY") && (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã nhúng Vector (Ready)
                          </div>
                        )}
                        {(doc.status === "Processing" || doc.status === "PROCESSING") && (
                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full w-fit">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý
                          </div>
                        )}
                        {doc.status === "Pending" && (
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full w-fit">
                            <Clock className="w-3.5 h-3.5" /> Đang chờ
                          </div>
                        )}
                        {(doc.status === "Failed" || doc.status === "ERROR") && (
                          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-semibold bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full w-fit">
                            <AlertCircle className="w-3.5 h-3.5" /> Lỗi xử lý
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString("vi-VN") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 mt-auto border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 font-medium">
              <div>
                Hiển thị {filteredDocuments.length} / {documents.length} tài liệu học tập
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real Status Panels */}
        <div className="w-full lg:w-80 space-y-6 lg:pt-14">
          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t("pipelineHealth")}</h3>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Tài liệu đã nhúng RAG</span>
                  <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
                    {embeddedCount} / {documents.length}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{
                      width: `${documents.length > 0 ? Math.round((embeddedCount / documents.length) * 100) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Dung lượng tài liệu</span>
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                    {totalSizeMb.toFixed(2)} MB / 500 MB
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(2, Math.round((totalSizeMb / 500) * 100)))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              {t("activeQueue")} ({processingDocs.length})
            </h3>

            {processingDocs.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hiện không có tài liệu nào đang chờ trong hàng đợi xử lý Vector.
              </p>
            ) : (
              <div className="space-y-3">
                {processingDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white truncate pr-2">
                        {doc.fileName}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded uppercase">
                        {doc.status}
                      </span>
                    </div>
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
