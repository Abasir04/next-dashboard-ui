"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SignIn from "./components/signin";
import SignUp from "./components/signup";

const AuthContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMode =
    (searchParams.get("mode") as "sign-in" | "sign-up") || "sign-in";
  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode as any);
  const [isSliding, setIsSliding] = useState(false);
  const [isContentTransitioning, setIsContentTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line unused-imports/no-unused-vars
  const [error, setError] = useState("");

  // Update mode when URL changes
  useEffect(() => {
    setMode(initialMode as any);
  }, [initialMode]);

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

  const handleSignUpSuccess = () => {
    router.push("/auth?mode=sign-in");
    setMode("sign-in");
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-4xl h-[650px] rounded-lg overflow-hidden relative">
        {/* Form Side */}
        <div
          className={`flex flex-1 items-center justify-center bg-transparent absolute top-0 left-0 h-full w-1/2 z-10 transition-transform duration-500 ${
            isSliding ? "translate-x-full" : "translate-x-0"
          }`}
          style={{ willChange: "transform" }}
        >
          <div
            className="bg-white/30 backdrop-blur-md rounded shadow-md border border-white/40 w-full h-full flex flex-col justify-center space-y-2 p-8 px-14"
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)" }}
          >
            <h2 className="text-3xl font-bold text-center">
              {mode === "sign-in" ? "Sign In" : "Sign Up"}
            </h2>
            {mode === "sign-in" ? (
              <SignIn
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setError={setError}
                onSuccess={() => router.push("/home")}
              />
            ) : (
              <SignUp
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setError={setError}
                onSuccess={handleSignUpSuccess}
              />
            )}
          </div>
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

const AuthPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
};

export default AuthPage;
