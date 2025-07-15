"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthenticationInput from "@/components/AuthenticationInput";
import PasswordInput from "@/components/PasswordInput";
import { useForm } from "react-hook-form";
import { paths } from "@/lib/paths";
import { showError, showSuccess } from "@/lib/toast";

const AuthPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMode =
    (searchParams.get("mode") as "sign-in" | "sign-up") || "sign-in";
  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);
  const [isSliding, setIsSliding] = useState(false);
  const [isContentTransitioning, setIsContentTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Update mode when URL changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Sign In form
  const {
    register: registerIn,
    handleSubmit: handleSubmitIn,
    formState: { errors: errorsIn },
    reset: resetIn,
  } = useForm();

  // Sign Up form
  const {
    register: registerUp,
    handleSubmit: handleSubmitUp,
    formState: { errors: errorsUp },
    watch,
    reset: resetUp,
  } = useForm();
  const passwordValue = watch("password");

  const handleSwitch = (to: "sign-in" | "sign-up") => {
    setIsSliding(true);
    setIsContentTransitioning(true);
    setError(""); // Clear errors when switching

    setTimeout(() => {
      setIsSliding(false);
    }, 700);
    setTimeout(() => {
      setMode(to);
      setIsContentTransitioning(false);
    }, 700);
  };

  const handleSignIn = async (data: any) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(paths.api.auth.signin, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Sign in failed");
      }

      // Redirect to dashboard
      router.push(paths.home);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: any) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(paths.api.auth.signup, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Sign up failed");
      }

      // Show success message and switch to sign-in mode
      showSuccess(
        "Account created successfully! Please sign in with your credentials."
      );
      resetUp(); // Reset the signup form
      handleSwitch("sign-in"); // Switch to sign-in mode
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-4xl h-[600px] rounded-lg overflow-hidden relative">
        {/* Form Side */}
        <div
          className={`flex flex-1 items-center justify-center bg-transparent absolute top-0 left-0 h-full w-1/2 z-10 transition-transform duration-500 ${
            isSliding ? "translate-x-full" : "translate-x-0"
          }`}
          style={{ willChange: "transform" }}
        >
          <form
            className="bg-white/30 backdrop-blur-md rounded shadow-md border border-white/40 w-full h-full flex flex-col justify-center space-y-2 p-8 px-14"
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)" }}
            onSubmit={
              mode === "sign-in"
                ? handleSubmitIn(handleSignIn)
                : handleSubmitUp(handleSignUp)
            }
          >
            <h2 className="text-3xl font-bold text-center">
              {mode === "sign-in" ? "Sign In" : "Sign Up"}
            </h2>

            {mode === "sign-in" ? (
              <>
                <AuthenticationInput
                  name="email"
                  label="Email"
                  placeholder="Enter your email"
                  register={registerIn}
                  errors={errorsIn}
                />
                <PasswordInput
                  name="password"
                  label="Password"
                  placeholder="Enter your password"
                  register={registerIn}
                  rules={{ required: "Password is required" }}
                  errors={errorsIn}
                />
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-5 bg-primary text-white py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <AuthenticationInput
                  name="firstName"
                  label="First Name"
                  placeholder="Enter your first name"
                  register={registerUp}
                  errors={errorsUp}
                />
                <AuthenticationInput
                  name="lastName"
                  label="Last Name"
                  placeholder="Enter your last name"
                  register={registerUp}
                  errors={errorsUp}
                />
                <AuthenticationInput
                  name="email"
                  label="Email"
                  placeholder="Enter your email"
                  register={registerUp}
                  errors={errorsUp}
                />
                <PasswordInput
                  name="password"
                  label="Password"
                  placeholder="Enter your password"
                  register={registerUp}
                  rules={{
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters long",
                    },
                  }}
                  errors={errorsUp}
                />
                <PasswordInput
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  register={registerUp}
                  rules={{
                    required: "Confirm password is required",
                    validate: (value: string) =>
                      value === passwordValue || "Passwords do not match",
                  }}
                  errors={errorsUp}
                />
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-5 bg-primary text-white py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Signing Up..." : "Sign Up"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
        {/* Artistic Image Side */}
        <div
          className="z-50 flex flex-1 flex-col justify-center items-center bg-cover bg-center absolute h-full w-1/2"
          style={{
            backgroundImage: "url('/bg-academic-1.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            left: "50%",
            top: 0,
          }}
        >
          <div className="relative z-50 flex flex-col items-center mt-20 h-full w-full p-8 overflow-hidden">
            <div
              className={`flex flex-col items-center transition-all duration-250 ${
                isContentTransitioning
                  ? "transform -translate-y-4 opacity-0"
                  : "transform translate-y-0 opacity-100"
              }`}
            >
              <h3 className="text-3xl font-bold mb-5 drop-shadow-lg">
                {mode === "sign-in" ? "New here?" : "Have an account?"}
              </h3>
              <p className="mb-6 text-center drop-shadow">
                {mode === "sign-in"
                  ? "Sign up to get started!"
                  : "Sign in to continue!"}
              </p>
              <button
                className="px-6 py-2 bg-white text-primary font-semibold rounded shadow hover:bg-primary hover:text-black transition"
                onClick={() =>
                  handleSwitch(mode === "sign-in" ? "sign-up" : "sign-in")
                }
                type="button"
              >
                {mode === "sign-in" ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
