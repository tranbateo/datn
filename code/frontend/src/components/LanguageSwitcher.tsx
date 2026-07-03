"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "vi" : "en";
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(`/${locale}`, `/${nextLocale}`);
    window.location.href = newPath + window.location.search;
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase">{locale}</span>
    </button>
  );
}
