import type { Metadata } from "next";
import { Check, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Gói bản quyền cho trường học",
  description:
    "AI Tutor được cung cấp theo bản quyền cho nhà trường, gồm hạn mức AI theo gói hoặc dùng khóa API riêng của trường. Liên hệ để được tư vấn gói phù hợp với quy mô trường.",
};

const plans = [
  {
    name: "Gói theo hạn mức",
    tag: "Phổ biến",
    description: "Nhà trường dùng hạn mức AI đi kèm bản quyền, không cần tự quản lý khóa API.",
    highlight: true,
    features: [
      "Hỏi đáp RAG có trích dẫn tài liệu lớp",
      "Tạo đề kiểm tra bằng AI, giáo viên duyệt",
      "Quét thời khóa biểu OCR",
      "Cổng học sinh, giáo viên, phụ huynh, quản trị",
      "Theo dõi mức sử dụng hạn mức AI",
    ],
  },
  {
    name: "Gói dùng khóa API riêng",
    tag: "Chủ động chi phí",
    description: "Nhà trường tự cấu hình khóa Gemini API riêng và tự kiểm soát chi phí AI.",
    highlight: false,
    features: [
      "Đầy đủ tính năng như gói theo hạn mức",
      "Khóa API lưu bảo mật phía máy chủ",
      "Không hiển thị lại khóa trên giao diện quản trị",
      "Không bị giới hạn bởi hạn mức hệ thống",
    ],
  },
];

export default function PricingPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@example.com";

  return (
    <div className="w-full bg-white dark:bg-slate-950 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
          Bản quyền
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3 mb-4 tracking-tight">
          Gói bản quyền dành cho nhà trường
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto">
          AI Tutor được triển khai theo từng trường. Chi phí phụ thuộc vào số lượng người dùng và hạn mức AI, vì vậy chúng tôi tư vấn trực tiếp thay vì niêm yết giá cố định.
        </p>

        <div className="grid md:grid-cols-2 gap-6 text-left">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-7 flex flex-col border-2 ${
                plan.highlight
                  ? "border-blue-600 shadow-lg shadow-blue-600/10"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    plan.highlight
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {plan.tag}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:${contactEmail}?subject=${encodeURIComponent("Tư vấn bản quyền AI Tutor")}`}
                className={`inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                  plan.highlight
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <Mail className="w-4 h-4" /> Liên hệ tư vấn
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-slate-500 dark:text-slate-400">
          Thông tin liên hệ và điều khoản cụ thể sẽ được xác nhận khi ký hợp đồng với nhà trường.
        </p>
      </div>
    </div>
  );
}
