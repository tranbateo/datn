import type { Metadata } from "next";
import { ReactNode } from "react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aitutor.edu.vn";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
};

// Since we have a root `not-found.tsx` page, a layout file
// is required, even if it's just passing children through.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
