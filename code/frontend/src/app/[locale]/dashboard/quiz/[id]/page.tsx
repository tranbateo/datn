"use client";

import { useEffect, use } from "react";
import { useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";

export default function QuizRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);

  useEffect(() => {
    if (resolvedParams.id && resolvedParams.id !== "1") {
      router.replace(`/dashboard/practice/${resolvedParams.id}`);
    } else {
      router.replace("/dashboard/practice");
    }
  }, [resolvedParams.id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
}
