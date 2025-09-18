import React, { useState } from "react";
import AuthenticationInput from "@/components/AuthenticationInput";
import PasswordInput from "@/components/PasswordInput";
import DropSelect from "@/components/DropSelect";
import { useForm, FormProvider } from "react-hook-form";
import { paths } from "@/lib/paths";
import { showError, showSuccess } from "@/lib/toast";

const titleOptions = [
  { label: "Mr", value: "mr" },
  { label: "Mrs", value: "mrs" },
  { label: "Miss", value: "miss" },
  { label: "Dr", value: "dr" },
  { label: "Prof", value: "prof" },
];
const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Lecturer", value: "lecturer" },
  { label: "Student", value: "student" },
];

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
  const [step, setStep] = useState(1);
  const methods = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      title: "",
      role: "",
      phone: "",
      address: "",
    },
    mode: "onTouched",
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
    setValue,
    getValues,
    reset,
  } = methods;
  const passwordValue = watch("password");

  const handleNext = async (data: any) => {
    // Validate step 1 fields
    if (
      !data.firstName ||
      !data.lastName ||
      !data.email ||
      !data.password ||
      !data.confirmPassword
    ) {
      setError("Please fill all fields");
      return;
    }
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSignUp = async (data: any) => {
    // Validate step 2 fields for required title and role
    if (!data.title) {
      setError("Title is required");
      methods.setError("title", {
        type: "manual",
        message: "Title is required",
      });
      return;
    }
    if (!data.role) {
      setError("Role is required");
      methods.setError("role", { type: "manual", message: "Role is required" });
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(paths.api.auth.signup, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          title: data.title,
          role: data.role.toUpperCase(),
          phone: data.phone,
          address: data.address,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Sign up failed");
      }
      showSuccess(
        "Account created successfully! Please sign in with your credentials."
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
    <FormProvider {...methods}>
      <form
        onSubmit={
          step === 1 ? handleSubmit(handleNext) : handleSubmit(handleSignUp)
        }
        className="flex flex-col w-full h-full justify-center"
      >
        {step === 1 ? (
          <>
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
                  /^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/.test(
                    value
                  ) || "Password must contain at least one symbol",
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
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 bg-primary text-white py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </>
        ) : (
          <>
            <AuthenticationInput
              name="phone"
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              register={register}
              errors={errors}
              required
            />
            <AuthenticationInput
              name="address"
              label="Address"
              type="text"
              placeholder="Enter your address"
              register={register}
              errors={errors}
              required
            />
            <DropSelect
              name="title"
              label="Title"
              placeholder="Select your title"
              control={control}
              options={titleOptions}
              errors={errors}
            />
            <DropSelect
              name="role"
              label="Role"
              placeholder="Select your role"
              control={control}
              options={roleOptions}
              errors={errors}
            />
            <div className="flex items-center justify-center gap-4 my-2">
              <button
                type="button"
                className="w-full mt-5 bg-gray-400 text-black py-2 rounded hover:bg-gray-300 transition"
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                Back
              </button>
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
    </FormProvider>
  );
};

export default SignUp;
