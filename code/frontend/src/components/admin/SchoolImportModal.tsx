"use client";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Users,
  GraduationCap,
  Building,
  KeyRound,
} from "lucide-react";

interface ImportPreviewData {
  isValid: boolean;
  summary: {
    classesCount: number;
    teachersCount: number;
    studentsCount: number;
    parentsCount: number;
    newStudentsCount: number;
    existingStudentsCount: number;
  };
  warnings: string[];
  errors: string[];
}

interface SchoolImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SchoolImportModal({
  isOpen,
  onClose,
  onSuccess,
}: SchoolImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    window.open("/api/proxy/schools/import/template", "_blank");
  };

  const handleExportCredentials = () => {
    window.open("/api/proxy/schools/export/credentials", "_blank");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg("");
    setSuccessMsg("");
    setPreviewData(null);
    setIsPreviewing(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/proxy/schools/import/preview", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Không thể phân tích file.");
      }

      const data: ImportPreviewData = await res.json();
      setPreviewData(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi đọc file Excel.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;

    setIsExecuting(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/proxy/schools/import/execute", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Import thất bại.");
      }

      const result = await res.json();
      setSuccessMsg(
        result.message ||
          "Import thành công! Toàn bộ lớp học, tài khoản học sinh, giáo viên và phụ huynh đã được tạo."
      );
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Có lỗi xảy ra khi lưu dữ liệu.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-card-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Import Danh Sách Trường Học
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tự động tạo lớp, tài khoản giáo viên, học sinh và liên kết phụ huynh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Action Row: Download Template & Export Credentials */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/60">
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                1. Mẫu Excel chuẩn
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Gồm 2 sheet: Lớp & GV, Học sinh & Phụ huynh
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Tải file mẫu
              </button>
              <button
                onClick={handleExportCredentials}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" /> Xuất phiếu tài khoản
              </button>
            </div>
          </div>

          {/* File Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-gray-800/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {file ? file.name : "Nhấp để tải lên file Excel dữ liệu trường"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Hỗ trợ định dạng .xlsx, .xls (Hệ thống sẽ tự động quét lỗi trước khi lưu)
            </p>
          </div>

          {/* Loading Indicator */}
          {isPreviewing && (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Đang phân tích và kiểm tra tính hợp lệ dữ liệu...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 text-xs text-green-700 dark:text-green-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Preview Results */}
          {previewData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Kết quả kiểm tra dữ liệu:
                </span>
                {previewData.isValid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" /> File hợp lệ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5" /> Cần sửa lỗi
                  </span>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-medium mb-1">
                    <Building className="w-3.5 h-3.5" /> Lớp học
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {previewData.summary.classesCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                  <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-medium mb-1">
                    <GraduationCap className="w-3.5 h-3.5" /> Giáo viên
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {previewData.summary.teachersCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-green-50/70 dark:bg-green-950/30 border border-green-100 dark:border-green-900/40">
                  <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-medium mb-1">
                    <Users className="w-3.5 h-3.5" /> Học sinh
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {previewData.summary.studentsCount}
                  </span>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    +{previewData.summary.newStudentsCount} mới
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium mb-1">
                    <Users className="w-3.5 h-3.5" /> Phụ huynh
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {previewData.summary.parentsCount}
                  </span>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Đã gộp SĐT trùng
                  </div>
                </div>
              </div>

              {/* Errors List */}
              {previewData.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 space-y-1">
                  <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                    Lỗi cần khắc phục trước khi lưu ({previewData.errors.length}):
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-red-600 dark:text-red-400 space-y-0.5">
                    {previewData.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {previewData.errors.length > 5 && (
                      <li>...và còn {previewData.errors.length - 5} lỗi khác</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Warnings List */}
              {previewData.warnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 space-y-1">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Lưu ý & Ghép dữ liệu ({previewData.warnings.length}):
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-amber-600 dark:text-amber-400 space-y-0.5 max-h-28 overflow-y-auto">
                    {previewData.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-card-border flex items-center justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={!previewData?.isValid || isExecuting}
            onClick={handleExecuteImport}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang tiến hành import...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Xác nhận Import vào hệ thống
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

