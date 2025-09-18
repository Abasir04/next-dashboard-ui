"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBook,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

const StudentSignupPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get the return URL from search params
  const returnUrl = searchParams.get("returnUrl") || "/auth";
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    matricNumber: "",
    password: "",
    confirmPassword: "",
    address: "",
    level: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }

      // Matric number validation (6 digits)
      const matricRegex = /^\d{6}$/;
      if (!matricRegex.test(formData.matricNumber)) {
        toast.error("Matric number must be exactly 6 digits");
        return;
      }

      // Email validation
      const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Invalid email address");
        return;
      }

      // Phone validation
      if (!formData.phone.trim()) {
        toast.error("Phone number is required");
        return;
      }

      // Phone number regex validation for Nigerian numbers
      const phoneRegex = /^(\+234|0)?[789][01]\d{8}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
        toast.error(
          "Please enter a valid Nigerian phone number (e.g., 08012345678)"
        );
        return;
      }

      // Address validation
      if (!formData.address.trim()) {
        toast.error("Address is required");
        return;
      }

      // Level validation
      if (!formData.level) {
        toast.error("Please select your level");
        return;
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          title: "student",
          role: "STUDENT",
          matricNumber: formData.matricNumber,
          phone: formData.phone,
          address: formData.address,
          level: parseInt(formData.level),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      toast.success(
        "Account created successfully! You can now register for courses."
      );

      // Redirect back to the course registration page or auth page
      if (returnUrl.includes("/register/")) {
        router.push(returnUrl);
      } else {
        router.push(
          "/auth?message=Account created successfully. Please sign in to register for courses."
        );
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Left Side - Header */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              Student Signup
            </h1>

            {/* Information Card */}
            <div className="bg-blue-50 rounded-lg p-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <FiUser className="mr-2 text-blue-600" />
                Create Your Account
              </h2>

              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-20 text-sm">
                    Purpose:
                  </span>
                  <span className="text-gray-800 text-sm">
                    Register for courses and access academic resources
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-20 text-sm">
                    Required:
                  </span>
                  <span className="text-gray-800 text-sm">
                    Personal details, academic info, and contact address
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-20 text-sm">
                    Levels:
                  </span>
                  <span className="text-gray-800 text-sm">
                    100, 200, 300, 400, or 500 Level
                  </span>
                </div>

                <div className="flex items-center pt-6 pb-2 border-t border-blue-200">
                  <FiBook className="mr-2 text-gray-500" size={14} />
                  <span className="text-xs text-gray-600">
                    All fields are required for account creation
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Signup Form
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Fill in your details to create your student account
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> If you&apos;re already logged in as a
                lecturer or admin, please log out first to avoid session
                conflicts.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address *
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Email address"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone Number *
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Matric Number and Level */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="matricNumber"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Matric Number *
                    </label>
                    <div className="relative">
                      <FiBook className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="matricNumber"
                        name="matricNumber"
                        type="text"
                        required
                        value={formData.matricNumber}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="6-digit matric number"
                        maxLength={6}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Must be exactly 6 digits
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="level"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Level *
                    </label>
                    <select
                      id="level"
                      name="level"
                      required
                      value={formData.level}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select Level</option>
                      <option value="100">100 Level</option>
                      <option value="200">200 Level</option>
                      <option value="300">300 Level</option>
                      <option value="400">400 Level</option>
                      <option value="500">500 Level</option>
                      <option value="600">600 Level</option>
                    </select>
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password *
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <FiEyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <FiEye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={2}
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Enter your complete address"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    "Create Student Account"
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

const SignupPageWithSuspense = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <StudentSignupPage />
    </Suspense>
  );
};

export default SignupPageWithSuspense;
