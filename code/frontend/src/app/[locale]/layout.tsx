import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isVi = locale !== "en";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aitutor.edu.vn";

  const titleDefault = isVi
    ? "AI Tutor — Nền tảng Học tập & Trợ giảng AI Chuẩn Chương trình Phổ thông"
    : "AI Tutor — Intelligent K-12 Learning & AI Teaching Assistant Platform";
  const description = isVi
    ? "Nền tảng giáo dục thông minh dành cho trường học Việt Nam (Tiểu học, THCS, THPT): Hỏi đáp AI RAG có trích dẫn sách giáo khoa, tạo và kiểm duyệt đề kiểm tra tự động, theo dõi tiến độ học sinh và cổng kết nối Phụ huynh – Nhà trường."
    : "Intelligent B2B EdTech platform for K-12 schools: Citation-backed RAG AI tutoring, teacher-verified AI quiz generation, mastery tracking, and Parent-Teacher communication portal.";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: titleDefault,
      template: isVi ? "%s | AI Tutor Edu" : "%s | AI Tutor Edu",
    },
    description,
    applicationName: "AI Tutor Edu",
    keywords: [
      "AI Tutor",
      "trợ lý học tập AI",
      "gia sư AI",
      "RAG giáo dục",
      "học tập cá nhân hóa",
      "quản lý trường học",
      "tạo đề kiểm tra AI",
      "giáo dục thông minh",
      "THCS",
      "THPT",
      "EdTech Vietnam",
    ],
    authors: [{ name: "AI Tutor Education Team" }],
    creator: "AI Tutor Edu",
    publisher: "AI Tutor Edu",
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}`]),
      ),
    },
    openGraph: {
      type: "website",
      locale: isVi ? "vi_VN" : "en_US",
      url: `${siteUrl}/${locale}`,
      siteName: "AI Tutor Edu",
      title: titleDefault,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: titleDefault,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <html
      lang={locale}
      className={`${beVietnamPro.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-sans bg-background text-foreground transition-colors duration-300 selection:bg-blue-600 selection:text-white"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
