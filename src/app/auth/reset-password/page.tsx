"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import AuthenticationInput from "@/components/AuthenticationInput";
import { toast } from "react-hot-toast";
import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data: any) => {
    const email = (data.email as string).trim();
    const password = (data.password as string).trim();
    const confirm = (data.confirmPassword as string).trim();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to reset password");
      toast.success("Password reset successful. Redirecting to sign up...");
      router.push("/auth");
    } catch (err: any) {
      toast.error(err.message || "Unable to reset password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-4xl h-[650px] rounded-lg overflow-hidden relative">
        {/* Form Side (glass panel) */}
        <div className="flex flex-1 items-center justify-center bg-transparent absolute top-0 left-0 h-full w-1/2 z-10">
          <div
            className="bg-white/30 backdrop-blur-md rounded shadow-md border border-white/40 w-full h-full flex flex-col justify-center space-y-4 p-8 px-14"
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)" }}
          >
            <h2 className="text-3xl font-bold text-center mb-2">
              Reset Password
            </h2>
            {/* Description moved to artistic side */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <AuthenticationInput
                name="email"
                label="Email"
                placeholder="Enter your email"
                type="email"
                required
                register={register}
                errors={errors}
                rules={{ required: "Email is required" }}
              />
              <AuthenticationInput
                name="password"
                label="New Password"
                placeholder="Enter new password"
                type="password"
                required
                register={register}
                errors={errors}
                rules={{
                  required: "Password is required",
                  minLength: { value: 6, message: "At least 6 characters" },
                }}
              />
              <AuthenticationInput
                name="confirmPassword"
                label="Confirm New Password"
                placeholder="Confirm new password"
                type="password"
                required
                register={register}
                errors={errors}
                rules={{ required: "Please confirm password" }}
              />
              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full mt-2 bg-primary text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
              {!token && (
                <p className="text-xs text-red-600">
                  Missing or invalid reset token.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Artistic Image Side */}
        <div
          className="z-0 flex flex-1 flex-col justify-center items-center bg-cover bg-center absolute h-full w-1/2"
          style={{
            backgroundImage: "url('/bg-academic-1.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            left: "50%",
            top: 0,
          }}
        >
          <div className="text-center text-black drop-shadow-lg px-8">
            <p className="text-md md:text-lg opacity-95 text-black">
              Enter your email and new password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
