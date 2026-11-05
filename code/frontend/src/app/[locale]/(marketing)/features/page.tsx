import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  MessageSquareText,
  ScanText,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tính năng nổi bật",
  description:
    "Khám phá các tính năng của AI Tutor: hỏi đáp RAG có trích dẫn tài liệu lớp học, tạo đề kiểm tra bằng AI có giáo viên duyệt, quét thời khóa biểu OCR, theo dõi tiến độ và kết nối phụ huynh – giáo viên.",
};

const features = [
  {
    icon: Bot,
    title: "Hỏi đáp AI dựa trên tài liệu của lớp",
    description:
      "Học sinh đặt câu hỏi và nhận câu trả lời được truy xuất từ chính các tài liệu mà giáo viên bộ môn đã xuất bản cho lớp mình, kèm trích dẫn tên tài liệu và số trang. Khi không có đủ căn cứ, hệ thống nói rõ là chưa tìm thấy thông tin thay vì tự suy đoán.",
    tone: "blue",
  },
  {
    icon: ClipboardCheck,
    title: "Đề kiểm tra do AI sinh, giáo viên kiểm duyệt",
    description:
      "Giáo viên chọn tài liệu, số câu và độ khó để AI soạn đề ở trạng thái nháp. Mọi câu hỏi đều được giáo viên xem, sửa và duyệt trước khi giao cho học sinh làm bài.",
    tone: "emerald",
  },
  {
    icon: ScanText,
    title: "Quét thời khóa biểu bằng OCR",
    description:
      "Học sinh chụp ảnh thời khóa biểu giấy, hệ thống nhận dạng và đưa các tiết học vào lịch cá nhân. Ảnh được kiểm tra định dạng và dung lượng trước khi xử lý.",
    tone: "purple",
  },
  {
    icon: Trophy,
    title: "Tiến độ, điểm XP và chuỗi ngày học",
    description:
      "Kết quả các bài kiểm tra được tổng hợp thành biểu đồ tiến độ, điểm kinh nghiệm và chuỗi ngày học liên tiếp. Điểm chỉ được cộng một lần cho mỗi lượt nộp bài.",
    tone: "amber",
  },
  {
    icon: Users,
    title: "Kết nối phụ huynh và giáo viên",
    description:
      "Phụ huynh theo dõi điểm số, lịch kiểm tra sắp tới của con, nhắn tin với giáo viên chủ nhiệm, giáo viên bộ môn và gửi đơn xin phép trực tiếp trên hệ thống.",
    tone: "indigo",
  },
  {
    icon: ShieldCheck,
    title: "Quản trị trường học và bảo mật dữ liệu",
    description:
      "Quản trị viên nhà trường nhập danh sách từ Excel, quản lý niên khóa, lớp học, phân công giáo viên chủ nhiệm và bộ môn, theo dõi hạn mức AI. Dữ liệu được tách riêng theo từng trường và mọi thao tác nhạy cảm đều ghi nhật ký.",
    tone: "rose",
  },
] as const;

const toneClasses: Record<string, { box: string; icon: string }> = {
  blue: { box: "bg-blue-50 dark:bg-blue-950/40", icon: "text-blue-600 dark:text-blue-400" },
  emerald: { box: "bg-emerald-50 dark:bg-emerald-950/40", icon: "text-emerald-600 dark:text-emerald-400" },
  purple: { box: "bg-purple-50 dark:bg-purple-950/40", icon: "text-purple-600 dark:text-purple-400" },
  amber: { box: "bg-amber-50 dark:bg-amber-950/40", icon: "text-amber-600 dark:text-amber-400" },
  indigo: { box: "bg-indigo-50 dark:bg-indigo-950/40", icon: "text-indigo-600 dark:text-indigo-400" },
  rose: { box: "bg-rose-50 dark:bg-rose-950/40", icon: "text-rose-600 dark:text-rose-400" },
};

const workflow = [
  { icon: FileText, title: "Giáo viên tải tài liệu", text: "Tải file PDF theo lớp và môn phụ trách, hệ thống xử lý nội dung và chờ giáo viên xuất bản." },
  { icon: MessageSquareText, title: "Học sinh hỏi đáp", text: "Học sinh hỏi trong phạm vi tài liệu đã xuất bản của lớp và nhận câu trả lời có nguồn." },
  { icon: ClipboardCheck, title: "Giao bài kiểm tra", text: "Giáo viên duyệt đề, giao cho lớp; học sinh làm bài và nhận kết quả theo chính sách của giáo viên." },
  { icon: CalendarCheck, title: "Phụ huynh theo dõi", text: "Kết quả và lịch học được cập nhật để phụ huynh nắm tình hình học tập của con." },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col items-center">
      <section className="w-full bg-gradient-to-b from-blue-50/70 to-white dark:from-slate-900 dark:to-slate-950 pt-16 pb-14 text-center border-b border-slate-200/70 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Tính năng
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mt-3 mb-5 tracking-tight leading-tight">
            Công cụ học tập và giảng dạy dành cho trường học
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            AI Tutor giúp giáo viên tiết kiệm thời gian soạn bài, giúp học sinh được giải đáp đúng theo nội dung đang học, và giúp phụ huynh nắm được tình hình của con.
          </p>
        </div>
      </section>

      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const tone = toneClasses[f.tone];
            return (
              <article
                key={f.title}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl ${tone.box} ${tone.icon} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="w-full bg-slate-100/70 dark:bg-slate-900/60 border-y border-slate-200/70 dark:border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white text-center mb-10">
            Quy trình sử dụng
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflow.map((step, idx) => (
              <li
                key={step.title}
                className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5"
              >
                <span className="absolute -top-3 left-5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                  Bước {idx + 1}
                </span>
                <step.icon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-2 mb-3" />
                <h3 className="font-bold text-slate-900 dark:text-white mb-1.5">{step.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="w-full py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
            Bắt đầu với tài khoản do nhà trường cấp
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-7">
            Tài khoản học sinh, giáo viên và phụ huynh được nhà trường tạo và phân quyền. Hãy đăng nhập bằng thông tin mà trường đã gửi cho bạn.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 rounded-xl font-bold shadow-md shadow-blue-600/20 transition-colors"
          >
            Đăng nhập hệ thống <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
