import { Link } from "@/i18n/routing";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Compass,
  FileCheck2,
  GraduationCap,
  Layers,
  Lock,
  Sparkles,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("Home");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AI Tutor Edu",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, iOS, Android",
    description:
      "Nền tảng học tập thông minh tích hợp RAG AI có trích dẫn nguồn sách giáo khoa, tạo và kiểm duyệt đề kiểm tra tự động, quản lý lớp học và kết nối Phụ huynh – Nhà trường.",
    offers: {
      "@type": "Offer",
      category: "B2B School License",
      priceCurrency: "VND",
    },
  };

  const roles = [
    {
      title: "Học sinh (Student)",
      badge: "Học tập & Hỏi đáp RAG",
      description:
        "Hỏi đáp trực tiếp với AI trên kho tài liệu chuẩn của lớp mình có trích dẫn số trang rõ ràng. Làm bài kiểm tra trực tuyến, xem giải thích chi tiết và tích lũy điểm XP.",
      icon: GraduationCap,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-100 dark:border-blue-900/50",
      href: "/login",
      cta: "Đăng nhập Học sinh",
    },
    {
      title: "Giáo viên (GVCN & GVBM)",
      badge: "Soạn giảng & Kiểm duyệt AI",
      description:
        "Tải tài liệu PDF lên kho tri thức lớp học, dùng AI sinh câu hỏi trắc nghiệm từ bài giảng, kiểm duyệt trước khi giao bài và theo dõi tiến độ từng học sinh.",
      icon: BookOpen,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-100 dark:border-emerald-900/50",
      href: "/login",
      cta: "Đăng nhập Giáo viên",
    },
    {
      title: "Phụ huynh (Parent)",
      badge: "Đồng hành & Kết nối",
      description:
        "Theo dõi biểu đồ điểm số, chuỗi ngày học tập, lịch kiểm tra sắp tới của con và trao đổi trực tiếp hoặc gửi đơn xin phép tới Giáo viên chủ nhiệm.",
      icon: Users,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      border: "border-indigo-100 dark:border-indigo-900/50",
      href: "/login",
      cta: "Đăng nhập Phụ huynh",
    },
  ];

  return (
    <div className="flex flex-col items-center overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO SECTION */}
      <section className="w-full relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50/60 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/70 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold border border-blue-200/60 dark:border-blue-800">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t("badge")}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              {t("title1")}{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t("title2")}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {t("description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
              <Link
                href="/login"
                className="inline-flex justify-center items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
              >
                <span>Đăng nhập Hệ thống Học tập</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/features"
                className="inline-flex justify-center items-center gap-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:bg-slate-700 px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-colors"
              >
                <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Khám phá Tính năng</span>
              </Link>
            </div>

            {/* Key Trust Pillars */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>RAG trích dẫn đúng tài liệu</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Giáo viên duyệt đề trước khi giao</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Kết nối trực tiếp Phụ huynh – GV</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Product Preview Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-blue-900/5 overflow-hidden">
              {/* Top Bar */}
              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Lớp 9A1 • Toán học (Học kỳ I)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  RAG Đã xác thực
                </span>
              </div>

              {/* Body Preview */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-xs sm:text-sm max-w-[85%] shadow-sm">
                    Giải thích giúp em định lý Vi-ét và điều kiện để phương trình bậc hai có hai nghiệm phân biệt?
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 rounded-2xl rounded-tl-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 p-4 space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                    <p className="leading-relaxed">
                      Phương trình bậc hai <span className="font-mono font-bold">ax² + bx + c = 0 (a ≠ 0)</span> có hai nghiệm phân biệt khi biệt thức <span className="font-mono font-bold text-blue-600 dark:text-blue-400">Δ = b² - 4ac &gt; 0</span>.
                    </p>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 font-mono text-xs space-y-1">
                      <div>Tổng hai nghiệm: x₁ + x₂ = -b / a</div>
                      <div>Tích hai nghiệm: x₁ · x₂ = c / a</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200/60 dark:border-blue-800">
                        <FileCheck2 className="w-3.5 h-3.5" /> Nguồn: Chuyên đề Đại số 9 - Trang 14
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mini Quiz Verification Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Đã đồng bộ tiến độ về Cổng Phụ huynh</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+15 XP Học tập</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-1">
                {t("stat1Value")}
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {t("stat1Label")}
              </div>
            </div>
            <div className="pt-6 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-1">
                {t("stat2Value")}
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {t("stat2Label")}
              </div>
            </div>
            <div className="pt-6 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-1">
                {t("stat3Value")}
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {t("stat3Label")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-ROLE SCHOOL ECOSYSTEM SECTION */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Không gian học tập & giảng dạy
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
            Kết nối chặt chẽ Học sinh – Giáo viên – Phụ huynh
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Mỗi nhóm người dùng được thiết kế cổng làm việc riêng biệt, phân quyền chặt chẽ theo trường, khối lớp và môn học phụ trách.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((r) => (
            <div
              key={r.title}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-7 border ${r.border} shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${r.bg} ${r.color} flex items-center justify-center`}>
                    <r.icon className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.bg} ${r.color}`}>
                    {r.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {r.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {r.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href={r.href}
                  className={`inline-flex items-center gap-1.5 text-sm font-bold ${r.color} hover:underline`}
                >
                  <span>{r.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CORE ARCHITECTURAL PILLARS */}
      <section className="w-full bg-slate-100/70 dark:bg-slate-900/60 border-t border-slate-200/70 dark:border-slate-800 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
              Thiết kế thực tế, an toàn và minh bạch cho Môi trường Học đường
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Khác với các công cụ chat AI tự do, AI Tutor kiểm soát chặt chẽ nguồn kiến thức theo từng lớp học và đặt Giáo viên ở vị trí trung tâm kiểm duyệt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Kho tri thức RAG theo Lớp & Môn
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Học sinh chỉ truy xuất được vector tài liệu PDF đã được Giáo viên bộ môn của lớp mình xuất bản. Mọi câu trả lời đều kèm trích dẫn nguồn.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Quy trình Duyệt đề Kiểm tra 2 bước
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Đề kiểm tra do AI sinh ra luôn ở trạng thái Nháp (DRAFT). Giáo viên rà soát, chỉnh sửa từng câu hỏi và chủ động xuất bản cho lớp.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                An toàn Dữ liệu Học đường
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Dữ liệu học tập, kết quả kiểm tra và thông tin cá nhân của học sinh được phân tách độc lập theo từng trường và lớp học.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
