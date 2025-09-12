"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBook,
  FiCalendar,
  FiCheckCircle,
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
  surname: string;
  firstName: string;
  studentEmail: string;
  studentPhone: string;
  matricNumber: string;
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
    surname: "",
    firstName: "",
    studentEmail: "",
    studentPhone: "",
    matricNumber: "",
  });

  const fetchRegistrationLink = useCallback(async () => {
    try {
      const response = await fetch(`/api/course-registration?linkId=${linkId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch registration details");
      }

      setRegistrationLink(data);
    } catch (error: any) {
      setError(error.message);
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
      if (!formData.surname.trim() || !formData.firstName.trim()) {
        throw new Error("Surname and First name are required");
      }

      // Compose name as 'Surname Firstname'
      const studentName = `${formData.surname.trim()} ${formData.firstName.trim()}`;

      const response = await fetch("/api/course-registration/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId,
          studentName,
          studentEmail: formData.studentEmail,
          studentPhone: formData.studentPhone,
          matricNumber: formData.matricNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register for course");
      }

      setSuccess(true);
    } catch (error: any) {
      setError(error.message);
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
            Your registration has been approved. You can now start attending {" "}
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Course Registration
          </h1>

          {/* Course Details */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
              <FiBook className="mr-2" />
              {registrationLink.course.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Course Code:</span>
                <span className="ml-2 text-gray-800">
                  {registrationLink.course.code}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Level:</span>
                <span className="ml-2 text-gray-800">
                  {registrationLink.course.level} Level
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Lecturer:</span>
                <span className="ml-2 text-gray-800">
                  {registrationLink.lecturer.title.charAt(0).toUpperCase() + registrationLink.lecturer.title.slice(1)} {registrationLink.lecturer.name}
                </span>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500 flex items-center">
              <FiCalendar className="mr-1" />
              Registration expires:{" "}
              {new Date(registrationLink.expiresAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Student Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiUser className="inline mr-1" />
                  Surname (Last name) *
                </label>
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your surname"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiUser className="inline mr-1" />
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMail className="inline mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="studentEmail"
                  value={formData.studentEmail}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiPhone className="inline mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="studentPhone"
                  value={formData.studentPhone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiUser className="inline mr-1" />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your 6-digit matric number"
                  maxLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
  );
};

export default StudentRegistrationPage;
