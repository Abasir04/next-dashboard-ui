"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import AuthenticationInput from "@/components/AuthenticationInput";
import DropSelect from "@/components/DropSelect";
import { showError, showSuccess } from "@/lib/toast";

const levelOptions = [
  { label: "100 Level", value: 100 },
  { label: "200 Level", value: 200 },
  { label: "300 Level", value: 300 },
  { label: "400 Level", value: 400 },
  { label: "500 Level", value: 500 },
  { label: "600 Level", value: 600 },
];

interface CourseFormProps {
  onClose: () => void;
  onSuccess: () => void;
  course?: {
    id: number;
    name: string;
    code: string;
    level: number;
  } | null;
}

interface CourseFormData {
  name: string;
  code: string;
  level: number;
}

const CourseForm: React.FC<CourseFormProps> = ({
  onClose,
  onSuccess,
  course,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    setValue,
    watch,
  } = useForm<CourseFormData>({
    defaultValues: {
      name: course?.name || "",
      code: course?.code || "",
      level: course?.level || 100,
    },
  });

  const watchedCode = watch("code");

  // Function to extract level from course code
  const extractLevelFromCode = (code: string): number => {
    if (!code) return 100;

    // Find the first number in the code
    const match = code.match(/\d+/);
    if (match) {
      const firstNumber = parseInt(match[0]);
      // Extract the first digit to determine level (e.g., 101 -> 1 -> 100, 201 -> 2 -> 200, 492 -> 4 -> 400)
      const firstDigit = Math.floor(firstNumber / 100);
      // Ensure level is between 100-600
      const level = Math.max(100, Math.min(600, firstDigit * 100));
      return level;
    }
    return 100;
  };

  // Auto-convert code to uppercase and update level when code changes
  useEffect(() => {
    if (watchedCode) {
      const upperCode = watchedCode.toUpperCase();
      if (upperCode !== watchedCode) {
        setValue("code", upperCode);
      }

      // Auto-populate level based on code
      const detectedLevel = extractLevelFromCode(upperCode);
      setValue("level", detectedLevel);
    }
  }, [watchedCode, setValue]);

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      const url = course ? `/api/courses?id=${course.id}` : "/api/courses";
      const method = course ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save course");
      }

      showSuccess(
        course ? "Course updated successfully" : "Course created successfully"
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {course ? "Edit Course" : "Create New Course"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AuthenticationInput
              name="name"
              label="Course Name"
              placeholder="Enter course name"
              register={register}
              rules={{
                required: "Course name is required",
                minLength: {
                  value: 2,
                  message: "Course name must be at least 2 characters long",
                },
                maxLength: {
                  value: 100,
                  message: "Course name must not exceed 100 characters",
                },
              }}
              errors={errors}
            />
            <AuthenticationInput
              name="code"
              label="Course Code"
              placeholder="e.g., CSE101, etc."
              register={register}
              rules={{
                required: "Course code is required",
                pattern: {
                  value: /^[A-Za-z]{3}[0-9]{3}$/,
                  message:
                    "Course code must be 3 letters followed by 3 numbers (e.g., CSE101, CSC201)",
                },
              }}
              errors={errors}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Level
            </label>
            <div className="relative">
              <select
                {...register("level")}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
              >
                {levelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Level is automatically determined from the course code
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-400 text-black rounded-md hover:bg-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Saving..."
                : course
                ? "Update Course"
                : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;
