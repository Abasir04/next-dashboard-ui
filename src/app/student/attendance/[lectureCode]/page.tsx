"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiMapPin,
  FiUser,
  FiBookOpen,
  FiAlertCircle,
} from "react-icons/fi";
import { showError, showSuccess } from "@/lib/toast";

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

  // Get lecture code from URL
  const lectureCode =
    typeof window !== "undefined"
      ? window.location.pathname.split("/").pop()
      : "";

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

  const handleMarkAttendance = async () => {
    if (!lecture || !location) {
      showError("Location data is required to mark attendance");
      return;
    }

    if (!lecture.isActive) {
      showError("Attendance is not currently active");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/attendance/${lectureCode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
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
      setAttendanceResult({
        success: false,
        message: errorMessage,
      });
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lecture details...</p>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
            onClick={() => router.push("/auth")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">Mark Attendance</h1>
              <div className="text-right">
                <div className="text-sm opacity-90">Time Remaining</div>
                <div className="text-lg font-mono">{timeLeft}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FiBookOpen className="h-4 w-4" />
                <span className="text-sm">
                  {lecture.course.name} ({lecture.course.code})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FiUser className="h-4 w-4" />
                <span className="text-sm">
                  Lecturer: {lecture.lecturer.name}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Status Messages */}
            {!lecture.hasStarted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <FiClock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Lecture Not Started
                    </h3>
                    <p className="text-sm text-yellow-700">
                      Attendance will be available at{" "}
                      {new Date(lecture.startTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {lecture.hasExpired && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
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
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
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

            {/* Attendance Result */}
            {attendanceResult && (
              <div
                className={`rounded-lg p-4 mb-6 ${
                  attendanceResult.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {attendanceResult.success ? (
                    <FiCheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <FiXCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <h3
                      className={`text-sm font-medium ${
                        attendanceResult.success
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {attendanceResult.success ? "Success!" : "Error"}
                    </h3>
                    <p
                      className={`text-sm ${
                        attendanceResult.success
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {attendanceResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleMarkAttendance}
              disabled={
                !lecture.isActive ||
                !location ||
                submitting ||
                attendanceResult?.success
              }
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                !lecture.isActive ||
                !location ||
                submitting ||
                attendanceResult?.success
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
              ) : !lecture.isActive ? (
                "Attendance Not Available"
              ) : !location ? (
                "Location Required"
              ) : (
                "Mark My Attendance"
              )}
            </button>

            {/* Instructions */}
            <div className="mt-6 text-xs text-gray-500 space-y-1">
              <p>• You must be registered for this course to mark attendance</p>
              <p>• Location access is required for verification</p>
              <p>• Attendance can only be marked once per lecture</p>
              <p>
                • Make sure you&apos;re physically present in the lecture venue
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendancePage;
