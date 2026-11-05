import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aitutor.edu.vn";
  const privateAreas = ["admin", "dashboard", "teacher", "parent", "onboarding", "login"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          ...routing.locales.flatMap((locale) =>
            privateAreas.map((area) => `/${locale}/${area}`),
          ),
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
