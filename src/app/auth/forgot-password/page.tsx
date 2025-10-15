"use client";

import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import AuthenticationInput from "@/components/AuthenticationInput";

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data: any) => {
    const email = (data.email as string).trim();
    if (!email) return;
    try {
      const token = crypto.randomUUID();
      const res = await fetch("/api/auth/send-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      if (!res.ok) throw new Error("Failed to send reset email");
      toast.success("If that email exists, a reset link has been sent.");
    } catch (err) {
      toast.error("Unable to send reset email. Please try again later.");
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-4xl h-[650px] rounded-lg overflow-hidden relative">
        {/* Form Side (glass panel) */}
        <div className="flex flex-1 items-center justify-center bg-transparent absolute top-0 left-0 h-full w-1/2 z-10">
          <div
            className="bg-white/30 backdrop-blur-md rounded shadow-md border border-white/40 w-full h-full flex flex-col justify-center space-y-6 p-8 px-14"
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)" }}
          >
            <h2 className="text-3xl font-bold text-center mb-2">
              Forgot Password
            </h2>
            {/* Description moved to artistic side */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send reset link"}
              </button>
              <div className="text-center">
                <a
                  href="/auth"
                  className="text-sm text-primary hover:text-blue-800"
                >
                  Back to sign in
                </a>
              </div>
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
              Enter your email to receive a reset link
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
