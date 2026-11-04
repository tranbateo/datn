"use client";

import { useTranslations } from "next-intl";
import { Upload, FileText, Search, CheckCircle2, Clock, Trash2, EyeOff, Eye, Loader2, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { teacherService } from "@/services/teacher.service";
import { fetchApi } from "@/lib/api-client";

interface DocumentData {
  id: string | number;
  name: string;
  courseTitle?: string;
  size: string;
  status: string;
  rawStatus?: string;
  date: string;
}

export default function TeacherDocumentsPage() {
  const t = useTranslations("Teacher.Documents");
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function loadDocuments() {
    setLoading(true);
    try {
      const [docsData, coursesData] = await Promise.all([
        teacherService.getDocuments(),
        teacherService.getCourses(),
      ]);
      if (docsData) setDocuments(docsData);
      if (Array.isArray(coursesData)) {
        setCourses(coursesData);
        if (coursesData.length > 0 && !selectedCourseId) {
          setSelectedCourseId(String(coursesData[0].id));
        }
      }
    } catch (error) {
      console.error("Failed to load documents", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      if (!searchTerm) return true;
      return (
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [documents, searchTerm]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedCourseId) {
      alert("Vui lòng chọn Khóa học / Lớp và file PDF tài liệu!");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      await fetchApi(`/documents/upload?courseId=${encodeURIComponent(selectedCourseId)}`, {
        method: "POST",
        body: formData,
      });
      setIsUploadOpen(false);
      setSelectedFile(null);
      await loadDocuments();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Tải lên tài liệu thất bại.");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleStatus = async (doc: DocumentData) => {
    const nextStatus = doc.status === "ready" ? "ARCHIVED" : "READY";
    try {
      await teacherService.updateDocumentStatus(doc.id, nextStatus);
      await loadDocuments();
    } catch (err) {
      console.error(err);
      alert("Không thể cập nhật trạng thái tài liệu.");
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này và toàn bộ vector RAG liên quan?")) return;
    try {
      await teacherService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      alert("Không thể xóa tài liệu.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{t('title')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4" /> {t('upload')} (PDF)
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
        <div className="border-b border-gray-100 dark:border-card-border p-4 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search')}
              className="pl-9 pr-4 py-2 w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs">Tên tài liệu (PDF)</th>
                <th className="px-6 py-4 font-semibold text-xs">Lớp / Khóa học</th>
                <th className="px-6 py-4 font-semibold text-xs">Trạng thái RAG (BR-DOC-001)</th>
                <th className="px-6 py-4 font-semibold text-xs">Ngày tải lên</th>
                <th className="px-6 py-4 font-semibold text-xs text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Đang tải tài liệu...
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Chưa có tài liệu nào. Hãy tải lên file PDF để học sinh hỏi đáp RAG!
                  </td>
                </tr>
              ) : filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                    {doc.courseTitle || 'Tài liệu chung'}
                  </td>
                  <td className="px-6 py-4">
                    {doc.status === "ready" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã xuất bản (READY)
                      </span>
                    ) : doc.rawStatus === "ARCHIVED" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        <EyeOff className="w-3.5 h-3.5" /> Đã gỡ (ARCHIVED)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <Clock className="w-3.5 h-3.5 animate-pulse" /> {t('processing')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{doc.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(doc)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                        title={doc.status === "ready" ? "Gỡ xuất bản tài liệu" : "Xuất bản lại tài liệu"}
                      >
                        {doc.status === "ready" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 hover:text-red-700 transition-colors"
                        title="Xóa tài liệu & Vector RAG"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-card-bg rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tải tài liệu học tập (PDF)</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chọn Lớp / Khóa học áp dụng *
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-primary"
                  required
                >
                  <option value="">-- Chọn khóa học --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  File PDF (Tối đa 20MB - BR-DOC-001) *
                </label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-xl disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Đang tải lên & Băm Vector..." : "Tải lên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
