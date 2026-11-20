"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";

/**
 * Legacy route: Real quiz results & answer review are displayed inside /dashboard/practice/[quizId].
 */
export default function QuizResultRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/practice");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
}
