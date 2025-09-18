"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface SessionMonitorProps {
  children: React.ReactNode;
}

export default function SessionMonitor({ children }: SessionMonitorProps) {
  const router = useRouter();

  useEffect(() => {
    let lastKnownRole: string | null = null;
    let lastKnownUserId: number | null = null;

    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          // Session is invalid, but don't redirect immediately
          // Let the SessionValidator handle it
          return;
        }

        const data = await response.json();
        const user = data.user;

        // Check if user ID or role has changed
        if (lastKnownUserId && lastKnownRole) {
          if (user.id !== lastKnownUserId) {
            console.warn(
              `User ID changed from ${lastKnownUserId} to ${user.id}`
            );
            toast.error("Session changed. Please refresh the page.");
            return;
          }

          if (user.role !== lastKnownRole) {
            console.warn(`Role changed from ${lastKnownRole} to ${user.role}`);
            toast.error("Your role has changed. Please log in again.");
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/auth");
            return;
          }
        }

        // Update tracking variables
        lastKnownUserId = user.id;
        lastKnownRole = user.role;
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
