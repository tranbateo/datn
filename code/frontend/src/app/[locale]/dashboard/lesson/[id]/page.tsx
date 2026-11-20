"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";

/**
 * Legacy route: Student lessons and published materials live under /dashboard/courses.
 */
export default function LessonRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/courses");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
}
