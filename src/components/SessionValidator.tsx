"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface SessionValidatorProps {
  children: React.ReactNode;
  expectedRole?: string;
}

export default function SessionValidator({
  children,
  expectedRole,
}: SessionValidatorProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          // Session is invalid, redirect to auth
          console.warn("Session validation failed, redirecting to auth");
          router.push("/auth");
          return;
        }

        const data = await response.json();
        const user = data.user;

        // If expectedRole is provided, validate it matches
        if (expectedRole && user.role !== expectedRole) {
          console.warn(
            `Role mismatch: expected ${expectedRole}, got ${user.role}`
          );
          toast.error("Session expired. Please log in again.");

          // Clear session and redirect
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/auth");
          return;
        }

        setSessionValid(true);
      } catch (error) {
        console.error("Error validating session:", error);
        toast.error("Session validation failed. Please log in again.");
        router.push("/auth");
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();
  }, [expectedRole, router]);

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating session...</p>
        </div>
      </div>
    );
  }

  // Only render children if session is valid
  if (!sessionValid) {
    return null;
  }

  return <>{children}</>;
}
