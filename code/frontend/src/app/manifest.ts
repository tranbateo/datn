import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Tutor — Nền tảng Giáo dục Thông minh cho Trường học",
    short_name: "AI Tutor",
    description:
      "Nền tảng học tập thông minh tích hợp RAG AI có trích dẫn nguồn, quản lý lớp học, kiểm tra đánh giá và kết nối Phụ huynh – Nhà trường.",
    start_url: "/vi",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

