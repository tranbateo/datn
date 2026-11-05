import { APP_ROUTES } from "@/constants/routes";
import { Link } from "@/i18n/routing";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  GraduationCap,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  Bot,
} from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-950">
      {/* Left Form Side */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-16">
        {/* Header (Logo + Controls) */}
        <div className="flex items-center justify-between">
          <Link href={APP_ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-blue-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">
                AI Tutor
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Hệ thống Học tập Trường học
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Cổng Quản trị Trường
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {/* Auth Content */}
        <div className="flex-1 flex flex-col justify-center py-8">
          <div className="w-full max-w-md mx-auto">{children}</div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span>© {new Date().getFullYear()} AI Tutor Education Platform.</span>
          <span>Bảo mật dữ liệu học sinh theo tiêu chuẩn nhà trường.</span>
        </div>
      </div>

      {/* Right Feature Showcase Side (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold tracking-wide">
            <Bot className="w-3.5 h-3.5" /> Trợ lý Học tập & Kiểm tra Đánh giá AI
          </span>
          <h2 className="text-3xl font-extrabold leading-tight">
            Đồng hành cùng Học sinh, Giáo viên và Phụ huynh
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Nền tảng học tập số hóa theo chương trình chính khóa của nhà trường, tích hợp trí tuệ nhân tạo có kiểm chứng nguồn tài liệu.
          </p>
        </div>

        {/* Showcase Cards */}
        <div className="relative z-10 space-y-4 my-8">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span>Hỏi đáp AI RAG có trích dẫn sách & học liệu</span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              Mọi câu trả lời đều dựa trên tài liệu đã được Giáo viên bộ môn của lớp xuất bản, kèm trích dẫn trang rõ ràng.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Làm bài kiểm tra & Theo dõi tiến độ cá nhân</span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              Hệ thống chấm điểm tự động, giải thích chi tiết từng câu hỏi và cập nhật báo cáo học tập trực tiếp cho Phụ huynh.
            </p>
          </div>
        </div>

        <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-blue-100">
          <span>Mô hình B2B School Provisioning</span>
          <span className="font-semibold text-white">Tiểu học • THCS • THPT</span>
        </div>
      </div>
    </div>
  );
}
