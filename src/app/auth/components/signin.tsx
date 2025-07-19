import React from "react";
import AuthenticationInput from "@/components/AuthenticationInput";
import PasswordInput from "@/components/PasswordInput";
import { useForm } from "react-hook-form";
import { paths } from "@/lib/paths";
import { useRouter } from "next/navigation";
import { showError } from "@/lib/toast";

const SignIn = ({
  isLoading,
  setIsLoading,
  setError,
  onSuccess,
}: {
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  setError: (v: string) => void;
  onSuccess?: () => void;
}) => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

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
      // After sign in, fetch user profile
      const profileRes = await fetch("/api/auth/me");
      const profile = await profileRes.json();
      router.push(paths.home);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleSignIn)}
      className="flex flex-col space-y-2 w-full h-full justify-center"
    >
      <AuthenticationInput
        name="email"
        label="Email"
        placeholder="Enter your email"
        register={register}
        errors={errors}
      />
      <PasswordInput
        name="password"
        label="Password"
        placeholder="Enter your password"
        register={register}
        rules={{}}
        errors={errors}
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
    </form>
  );
};

export default SignIn;
