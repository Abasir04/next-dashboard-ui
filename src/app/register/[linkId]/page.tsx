"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  FiUser,
  FiBook,
  FiCalendar,
  FiCheckCircle,
  FiLock,
} from "react-icons/fi";

interface RegistrationLink {
  id: string;
  course: {
    id: number;
    name: string;
    code: string;
    level: number;
    lecturer: {
      title: string;
      name: string;
      email: string;
    };
  };
  lecturer: {
    title: string;
    name: string;
    email: string;
  };
  level: {
    id: number;
    name: string;
    grade: number;
  };
  expiresAt: string;
}

interface RegistrationFormData {
  matricNumber: string;
  password: string;
}

const StudentRegistrationPage = () => {
  const params = useParams();
  const linkId = params.linkId as string;

  const [registrationLink, setRegistrationLink] =
    useState<RegistrationLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegistrationFormData>({
    matricNumber: "",
    password: "",
  });

  const fetchRegistrationLink = useCallback(async () => {
    try {
      const response = await fetch(`/api/course-registration/${linkId}`);
      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.message || data.error || "Failed to fetch registration details";
        throw new Error(errorMessage);
      }

      setRegistrationLink(data);
    } catch (error: any) {
      console.error("Error fetching registration link:", error);
      let errorMessage = "Failed to load registration details";

      if (error.message) {
        errorMessage = error.message;
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.name === "AbortError") {
        errorMessage = "Request was cancelled. Please try again.";
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    if (linkId) {
      fetchRegistrationLink();
    }
  }, [linkId, fetchRegistrationLink]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Basic client-side validations
      const matricRegex = /^\d{6}$/;
      if (!matricRegex.test(formData.matricNumber)) {
        throw new Error("Matric number must be exactly 6 digits");
      }
      if (!formData.password.trim()) {
        throw new Error("Password is required");
      }

      // First, authenticate the student
      const authResponse = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricNumber: formData.matricNumber,
          password: formData.password,
        }),
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.error || "Invalid credentials");
      }

      // Get student details from the authenticated user
      const studentResponse = await fetch("/api/auth/me");

      const studentData = await studentResponse.json();

      if (!studentResponse.ok) {
        throw new Error("Failed to get student details");
      }

      // Debug: Log the student data structure
      console.log("Student data received:", studentData);
      console.log("Student data type:", typeof studentData);
      console.log("Has user object:", !!studentData?.user);
      console.log("Has student object:", !!studentData?.student);
      console.log("Has user.student object:", !!studentData?.user?.student);

      // Validate student data structure
      if (!studentData || !studentData.user) {
        console.error("Invalid student data structure:", studentData);
        console.error("studentData exists:", !!studentData);
        console.error("user exists:", !!studentData?.user);
        throw new Error("Invalid student data received");
      }

      // Check if student data is in user.student or directly in studentData.student
      const studentInfo = studentData.student || studentData.user?.student;
      if (!studentInfo) {
        console.error("No student data found in either location:", {
          studentDataStudent: studentData.student,
          userStudent: studentData.user?.student,
        });
        throw new Error("Student data not found");
      }

      console.log("✅ Basic structure validation passed");

      // Additional validation for required user fields
      if (
        !studentData.user.email ||
        !studentData.user.firstName ||
        !studentData.user.lastName
      ) {
        console.error("Missing required user fields:", studentData.user);
        throw new Error("Invalid user data received");
      }

      console.log("✅ User fields validation passed");

      // Additional validation for required student fields
      if (!studentInfo.matricNumber || !studentInfo.name) {
        console.error("Missing required student fields:", studentInfo);
        throw new Error("Invalid student data received");
      }

      console.log("✅ Student fields validation passed");

      // Use phone number from student profile
      const phoneNumber = studentInfo.phone;
      if (!phoneNumber || phoneNumber.trim() === "") {
        throw new Error(
          "Phone number not found in your profile. Please contact support."
        );
      }

      // Now register for the course
      const response = await fetch("/api/course-registration/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId,
          matricNumber: formData.matricNumber,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.message || data.error || "Failed to register for course";
        throw new Error(errorMessage);
      }

      setSuccess(true);
      toast.success("Course registration successful!");
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Failed to register for course";

      if (error.message) {
        errorMessage = error.message;
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.name === "AbortError") {
        errorMessage = "Request was cancelled. Please try again.";
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registration details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Registration Error
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-green-500 text-6xl mb-4">
            <FiCheckCircle className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Registration Successful!
          </h1>
          <p className="text-gray-600 mb-4">
            You have successfully registered for{" "}
            <strong>{registrationLink?.course.name}</strong>.
          </p>
          <p className="text-md text-gray-500">
            Your registration has been approved. You can now start attending{" "}
            <strong>{registrationLink?.course.name}</strong> lectures.
          </p>
        </div>
      </div>
    );
  }

  if (!registrationLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Registration Link Not Found
          </h1>
          <p className="text-gray-600">
            The registration link you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Course Details Header */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Course Registration
            </h1>

            {/* Course Details */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <FiBook className="mr-3 text-blue-600" />
                {registrationLink.course.name}
              </h2>

              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">Code:</span>
                  <span className="text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                    {registrationLink.course.code}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">Level:</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {registrationLink.course.level} Level
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">
                    Lecturer:
                  </span>
                  <span className="text-gray-800">
                    {registrationLink.lecturer.title.charAt(0).toUpperCase() +
                      registrationLink.lecturer.title.slice(1)}{" "}
                    {registrationLink.lecturer.name}
                  </span>
                </div>

                <div className="flex items-center pt-2 border-t border-blue-200">
                  <FiCalendar className="mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Registration expires:{" "}
                    <span className="font-medium">
                      {new Date(
                        registrationLink.expiresAt
                      ).toLocaleDateString()}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Registration Form
            </h2>
            <p className="text-gray-600 mb-4">
              Enter your credentials to register for this course. Don&apos;t
              have an account?{" "}
              <a
                href={`/student/signup?returnUrl=${encodeURIComponent(
                  `/register/${linkId}`
                )}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign up here.
              </a>
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> If you&apos;re already logged in as a
                lecturer or admin, please log out first to avoid session
                conflicts.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiUser className="inline mr-2" />
                    Matric Number *
                  </label>
                  <input
                    type="text"
                    name="matricNumber"
                    value={formData.matricNumber}
                    onChange={handleInputChange}
                    required
                    pattern="\d{6}"
                    inputMode="numeric"
                    title="Matric number must be exactly 6 digits"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your 6-digit matric number"
                    maxLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiLock className="inline mr-2" />
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Registering...
                    </>
                  ) : (
                    "Register for Course"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistrationPage;
