"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface SessionMonitorProps {
  children: React.ReactNode;
}

export default function SessionMonitor({ children }: SessionMonitorProps) {
  const router = useRouter();

  useEffect(() => {
    // Only perform a lightweight health check to ensure the session is still valid.
    // Do not enforce cross-tab user/role consistency to allow multiple concurrent sessions
    // in different browser profiles/containers without spurious logouts.

    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          // Session is invalid, but don't redirect immediately
          // Let the SessionValidator handle it
          return;
        }
      } catch (error) {
        console.error("Error checking session:", error);
        // Don't redirect on network errors, just log
      }
    };

    // Check session every 30 seconds
    const interval = setInterval(checkSession, 30000);

    // Also check on window focus (when user switches back to tab)
    const handleFocus = () => {
      checkSession();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  return <>{children}</>;
}
