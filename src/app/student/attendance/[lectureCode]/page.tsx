"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiMapPin,
  FiBookOpen,
  FiAlertCircle,
  FiLock,
  FiHash,
} from "react-icons/fi";
import { showError, showSuccess } from "@/lib/toast";
import { formatLocal } from "@/lib/time";

interface Lecture {
  id: string;
  course: {
    id: number;
    name: string;
    code: string;
  };
  lecturer: {
    id: number;
    name: string;
  };
  startTime: string;
  endTime: string;
  linkExpiry: string;
  isActive: boolean;
  hasStarted: boolean;
  hasExpired: boolean;
}

interface AttendanceResult {
  success: boolean;
  message: string;
  attendance?: {
    id: number;
    status: string;
    markedAt: string;
    student: {
      id: number;
      name: string;
      matricNumber: string;
    };
  };
}

const StudentAttendancePage = () => {
  const router = useRouter();
  const params = useParams();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attendanceResult, setAttendanceResult] =
    useState<AttendanceResult | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authForm, setAuthForm] = useState({
    matricNumber: "",
    password: "",
  });
  const [authLoading, setAuthLoading] = useState(false);

  // Get lecture code from URL params
  const lectureCode = params.lectureCode as string;

  const fetchLectureDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance/${lectureCode}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch lecture details");
      }

      const data = await response.json();
      setLecture(data.lecture);
    } catch (error) {
      console.error("Error fetching lecture details:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Failed to fetch lecture details"
      );
    } finally {
      setLoading(false);
    }
  }, [lectureCode]);

  useEffect(() => {
    if (lectureCode) {
      fetchLectureDetails();
      requestLocation();
    }
  }, [lectureCode, fetchLectureDetails]);

  // Update countdown timer
  useEffect(() => {
    if (!lecture) return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(lecture.linkExpiry);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lecture]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        let errorMessage = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please allow location access to mark attendance.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setAuthLoading(true);

      const response = await fetch(`/api/attendance/${lectureCode}/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricNumber: authForm.matricNumber,
          password: authForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setIsAuthenticated(true);
      showSuccess("Authentication successful!");
    } catch (error) {
      console.error("Error authenticating:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      showError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/attendance/${lectureCode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: location?.latitude,
          longitude: location?.longitude,
          matricNumber: authForm.matricNumber,
          password: authForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to mark attendance");
      }

      setAttendanceResult({
        success: true,
        message: data.message,
        attendance: data.attendance,
      });

      showSuccess("Attendance marked successfully!");
    } catch (error) {
      console.error("Error marking attendance:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to mark attendance";
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lecture details...</p>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <FiXCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Lecture Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The attendance link you&apos;re trying to access is invalid or has
            expired.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Go to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center py-8">
      <div className="w-full max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Left Side - Lecture Details */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Mark Attendance
            </h1>

            {/* Lecture Details */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <FiBookOpen className="mr-3 text-blue-600" />
                {lecture.course.name}
              </h2>

              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">
                    Course:
                  </span>
                  <span className="text-gray-800">
                    {lecture.course.name} ({lecture.course.code})
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">
                    Lecturer:
                  </span>
                  <span className="text-gray-800">{lecture.lecturer.name}</span>
                </div>

                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">
                    Time Left:
                  </span>
                  <span className="text-lg font-mono text-blue-600">
                    {timeLeft}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">
                    Status:
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      lecture.isActive
                        ? "bg-green-100 text-green-800"
                        : lecture.hasExpired
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {lecture.isActive
                      ? "Active"
                      : lecture.hasExpired
                      ? "Expired"
                      : "Not Started"}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 text-xs text-gray-500 space-y-1">
                <p>
                  • You must be registered for this course to mark attendance
                </p>
                <p>• Location access is required for verification</p>
                <p>
                  • Student authentication is required (matric number +
                  password)
                </p>
                <p>• Attendance can only be marked once per lecture</p>
                <p>
                  • Make sure you&apos;re physically present in the lecture
                  venue
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Attendance Form */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Attendance Form
            </h2>
            <p className="text-gray-600 mb-4">
              Complete the steps below to mark your attendance
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> You must be registered for this course to
                mark attendance. Location access and student authentication are
                required.
              </p>
            </div>

            <div className="space-y-6">
              {/* Status Messages */}
              {!lecture.hasStarted && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FiClock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">
                        Lecture Not Started
                      </h3>
                      <p className="text-sm text-yellow-700">
                        Attendance will be available at{" "}
                        {formatLocal(lecture.startTime)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {lecture.hasExpired && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FiXCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">
                        Attendance Expired
                      </h3>
                      <p className="text-sm text-red-700">
                        The attendance link has expired. Please contact your
                        lecturer.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Status */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <FiMapPin className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Location Status
                  </span>
                </div>

                {locationError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <FiAlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700">
                        {locationError}
                      </span>
                    </div>
                    <button
                      onClick={requestLocation}
                      className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : location ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <FiCheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">
                        Location detected successfully
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <FiClock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        Requesting location...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Authentication Form - Only show if location is detected and not authenticated */}
              {location && !isAuthenticated && (
                <div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FiLock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Student Authentication Required
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Please enter your credentials to mark attendance
                    </p>
                  </div>

                  <form onSubmit={handleAuthentication} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Matric Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiHash className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={authForm.matricNumber}
                            onChange={(e) =>
                              setAuthForm({
                                ...authForm,
                                matricNumber: e.target.value,
                              })
                            }
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Enter matric number"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiLock className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="password"
                            value={authForm.password}
                            onChange={(e) =>
                              setAuthForm({
                                ...authForm,
                                password: e.target.value,
                              })
                            }
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Enter password"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                        authLoading
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {authLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Authenticating...</span>
                        </div>
                      ) : (
                        "Authenticate"
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Authentication Success */}
              {isAuthenticated && (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <FiCheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Authentication Successful
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      You can now mark your attendance
                    </p>
                  </div>
                </div>
              )}

              {/* Attendance Success Result */}
              {attendanceResult && attendanceResult.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FiCheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800">
                        Success!
                      </h3>
                      <p className="text-sm text-green-700">
                        {attendanceResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleMarkAttendance}
                disabled={submitting || attendanceResult?.success}
                className={`w-full py-3 px-6 rounded-md font-medium transition-colors duration-200 ${
                  submitting || attendanceResult?.success
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Marking Attendance...</span>
                  </div>
                ) : attendanceResult?.success ? (
                  "Attendance Marked ✓"
                ) : (
                  "Mark My Attendance"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendancePage;
