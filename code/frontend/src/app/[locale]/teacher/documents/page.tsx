"use client";

import { useTranslations } from "next-intl";
import { Upload, FileText, Search, MoreVertical, CheckCircle2, Clock } from "lucide-react";

import { useState, useEffect } from "react";
import { teacherService } from "@/services/teacher.service";

interface DocumentData {
  id: string | number;
  name: string;
  size: string;
  status: string;
  date: string;
}

export default function TeacherDocumentsPage() {
  const t = useTranslations("Teacher.Documents");
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocuments() {
      try {
        const data = await teacherService.getDocuments();
        if (data) setDocuments(data);
      } catch (error) {
        console.error("Failed to load documents", error);
      } finally {
        setLoading(false);
      }
    }
    loadDocuments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{t('title')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
            <Upload className="w-4 h-4" /> {t('upload')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
        <div className="border-b border-gray-100 dark:border-card-border p-4 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={t('search')}
              className="pl-9 pr-4 py-2 w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs">Document Name</th>
                <th className="px-6 py-4 font-semibold text-xs">Size</th>
                <th className="px-6 py-4 font-semibold text-xs">Status</th>
                <th className="px-6 py-4 font-semibold text-xs">Upload Date</th>
                <th className="px-6 py-4 font-semibold text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Đang tải tài liệu...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Chưa có tài liệu nào.
                  </td>
                </tr>
              ) : documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{doc.size}</td>
                  <td className="px-6 py-4">
                    {doc.status === "ready" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('ready')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <Clock className="w-3.5 h-3.5 animate-pulse" /> {t('processing')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{doc.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
