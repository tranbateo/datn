"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";

/**
 * Legacy route: 2FA OTP verification is handled directly inside /login.
 * Redirect cleanly to the login screen.
 */
export default function VerifyOTPRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
    </div>
  );
}
