"use client";

import { Search, Upload, FolderSearch, FileText, File as FileIcon, Trash2, RefreshCw, CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

export default function ResourceLibrary() {
  const t = useTranslations("Admin.Documents");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadDocs = async () => {
    try {
      const { fetchApi } = await import('@/lib/api-client');
      const data = await fetchApi('/documents');
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocs();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { fetchApi } = await import('@/lib/api-client');
      // Fetch course or use placeholder
      const courses = await fetchApi('/courses');
      let courseId = '';
      if (courses && courses.length > 0) {
        courseId = courses[0].id;
      } else {
        alert('Vui lòng tạo khóa học trước khi upload tài liệu.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      
      await fetchApi(`/documents/upload/${courseId}`, {
        method: 'POST',
        body: formData,
      });

      alert('Tài liệu đã được tải lên và đang được xử lý trong nền.');
      loadDocs();
    } catch (error) {
      console.error(error);
      alert('Lỗi khi tải tài liệu');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder={t('searchPlaceholder')}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors dark:text-white placeholder:text-gray-400 shadow-sm"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Documents Table */}
        <div className="flex-1 w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-white dark:bg-card-bg border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm">
                <FolderSearch className="w-4 h-4" /> {t('browseRepo')}
              </button>
              <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer">
                <Upload className="w-4 h-4" /> 
                {uploading ? 'Đang tải lên...' : t('uploadFiles')}
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.md,.txt" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm flex flex-col min-h-[500px]">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <span className="text-gray-400 mr-2 uppercase tracking-wider text-xs font-bold">{t('filters')}</span>
                <button className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">{t('allTypes')}</button>
                <button className="px-4 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">PDFs</button>
                <button className="px-4 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Markdown</button>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">2 Selected</span>
                <button className="flex items-center gap-2 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                  <RefreshCw className="w-3 h-3" /> {t('processRag')}
                </button>
                <button className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-12">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500/20" />
                    </th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('documentName')}</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('type')}</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('size')}</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('status')}</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('uploaded')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {loading && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">Đang tải tài liệu...</td>
                    </tr>
                  )}
                  {documents.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">Chưa có tài liệu nào.</td>
                    </tr>
                  )}
                  {documents.map((doc) => (
                    <tr key={doc.id} className={`${doc.status === 'Failed' ? 'bg-red-50/30 dark:bg-red-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'} transition-colors`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500/20" 
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
                            {doc.type.includes('pdf') ? (
                              <FileText className={`w-4 h-4 text-red-500`} />
                            ) : (
                              <FileIcon className={`w-4 h-4 text-blue-500`} />
                            )}
                          </div>
                          <span className={`font-medium text-gray-700 dark:text-gray-300`}>
                            {doc.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                        {doc.type}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                        {(Number(doc.size) / 1024 / 1024).toFixed(2)} MB
                      </td>
                      <td className="px-6 py-4">
                        {doc.status === 'Embedded' && (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Embedded
                          </div>
                        )}
                        {doc.status === 'Processing' && (
                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full w-fit">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
                          </div>
                        )}
                        {doc.status === 'Pending' && (
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full w-fit">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </div>
                        )}
                        {doc.status === 'Failed' && (
                          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-semibold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full w-fit">
                            <AlertCircle className="w-3.5 h-3.5" /> Failed
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 mt-auto flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 font-medium">
              <div>Showing 1-5 of 124 docs</div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">&lt;</button>
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">&gt;</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status Panels */}
        <div className="w-full lg:w-80 space-y-6 lg:pt-14">
          
          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('pipelineHealth')}</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Embedded Chunks</span>
                  <span className="text-sm font-bold text-purple-700 dark:text-purple-400">14,204</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full w-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Vector DB Storage</span>
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">1.2 GB / 5 GB</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-[24%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              {t('activeQueue')}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white truncate pr-4">Chapter_4_...</span>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded uppercase tracking-wider">Embedding</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full w-[65%]"></div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white truncate pr-4">knowledge_b...</span>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded uppercase tracking-wider">Chunking</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full w-[30%]"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
