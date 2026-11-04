"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/progress");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );
}
