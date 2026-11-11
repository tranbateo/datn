import { APP_ROUTES } from "@/constants/routes";
import { Link } from "@/i18n/routing";
import { GraduationCap, Compass, BookOpen, Users } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-100 dark:border-slate-800">
          <div className="col-span-1 md:col-span-1 space-y-4">
            <Link href={APP_ROUTES.HOME} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-xl text-slate-900 dark:text-white">
                AI Tutor
              </span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Nền tảng học tập và trợ giảng thông minh dành cho các trường Tiểu học, THCS và THPT tại Việt Nam.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" /> Phân hệ Học tập
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href={APP_ROUTES.LOGIN}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Cổng Học sinh (Hỏi đáp RAG & Luyện đề)
                </Link>
              </li>
              <li>
                <Link
                  href={APP_ROUTES.LOGIN}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Cổng Giáo viên (GVCN & GV Bộ môn)
                </Link>
              </li>
              <li>
                <Link
                  href={APP_ROUTES.LOGIN}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Cổng Phụ huynh (Báo cáo & Liên lạc)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-600" /> Khám phá Hệ thống
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href={APP_ROUTES.HOME}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Trang chủ giới thiệu
                </Link>
              </li>
              <li>
                <Link
                  href={APP_ROUTES.FEATURES}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Tính năng & Kiến trúc RAG
                </Link>
              </li>
              <li>
                <Link
                  href={APP_ROUTES.PRICING}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Gói bản quyền dành cho Nhà trường
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" /> Tiêu chuẩn & An toàn
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li>Trích dẫn nguồn tài liệu chính xác (BR-RAG-001)</li>
              <li>Giáo viên duyệt đề trước khi giao (BR-QUIZ-001)</li>
              <li>Bảo vệ dữ liệu học sinh theo trường (BR-USER-001)</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} AI Tutor Education Platform. All rights reserved.</p>
          <p>Hệ thống Quản lý Học tập & Trợ giảng AI thế hệ mới dành cho Nhà trường.</p>
        </div>
      </div>
    </footer>
  );
}
