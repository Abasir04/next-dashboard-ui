import React from "react";
import AuthenticationInput from "@/components/AuthenticationInput";
import PasswordInput from "@/components/PasswordInput";
import { useForm } from "react-hook-form";
import { paths } from "@/lib/paths";
import { showError, showSuccess } from "@/lib/toast";

const SignUp = ({
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
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm();
  const passwordValue = watch("password");

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
      showSuccess(
        "Account created successfully! Please sign in with your credientials."
      );
      reset();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleSignUp)}
      className="flex flex-col space-y-2 w-full h-full justify-center"
    >
      <AuthenticationInput
        name="firstName"
        label="First Name"
        placeholder="Enter your first name"
        register={register}
        rules={{ required: "First Name is required" }}
        errors={errors}
      />
      <AuthenticationInput
        name="lastName"
        label="Last Name"
        placeholder="Enter your last name"
        register={register}
        rules={{ required: "Last Name is required" }}
        errors={errors}
      />
      <AuthenticationInput
        name="email"
        label="Email"
        placeholder="Enter your email"
        register={register}
        rules={{
          required: "Email is required",
          pattern: {
            value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
            message: "Invalid email address",
          },
        }}
        errors={errors}
      />
      <PasswordInput
        name="password"
        label="Password"
        placeholder="Enter your password"
        register={register}
        rules={{
          required: "Password is required",
          minLength: {
            value: 6,
            message: "Password must be at least 6 characters long",
          },
          validate: (value: string) =>
            /^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/.test(value) ||
            "Password must contain at least one symbol",
        }}
        errors={errors}
      />
      <PasswordInput
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Confirm your password"
        register={register}
        rules={{
          required: "Confirm password is required",
          validate: (value: string) =>
            value === passwordValue || "Passwords do not match",
        }}
        errors={errors}
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
    </form>
  );
};

export default SignUp;
