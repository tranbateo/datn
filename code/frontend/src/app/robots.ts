import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aitutor.edu.vn";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/vi", "/en", "/vi/features", "/vi/pricing", "/en/features", "/en/pricing"],
        disallow: [
          "/api/",
          "/vi/admin/",
          "/en/admin/",
          "/vi/dashboard/",
          "/en/dashboard/",
          "/vi/teacher/",
          "/en/teacher/",
          "/vi/parent/",
          "/en/parent/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

