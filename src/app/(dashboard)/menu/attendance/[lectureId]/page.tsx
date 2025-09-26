"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiRefreshCw,
  FiClock,
  FiBookOpen,
  FiUser,
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
  uniqueCode: string;
}

interface AttendanceRecord {
  studentName: string;
  studentEmail: string;
  matricNumber: string;
  status: "PRESENT" | "ABSENT";
  markedAt: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Statistics {
  totalRegistered: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
}

const AttendanceDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  // Get lecture ID from URL params
  const lectureId = params.lectureId as string;

  const fetchAttendanceDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance/lecture/${lectureId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch attendance details"
        );
      }

      const data = await response.json();
      setLecture(data.lecture);
      setAttendance(data.attendance);
      setStatistics(data.statistics);
    } catch (error) {
      console.error("Error fetching attendance details:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Failed to fetch attendance details"
      );
    } finally {
      setLoading(false);
    }
  }, [lectureId]);

  useEffect(() => {
    if (lectureId) {
      fetchAttendanceDetails();
    }
  }, [lectureId]);

  const handleExportAttendance = () => {
    if (!lecture || !attendance.length) return;

    const csvContent = [
      ["Student Name", "Matric Number", "Email", "Status", "Marked At"],
      ...attendance.map((record) => [
        record.studentName,
        record.matricNumber,
        record.studentEmail,
        record.status,
        record.markedAt
          ? new Date(record.markedAt).toLocaleString()
          : "Not marked",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${lecture.course.code}-${
      new Date(lecture.startTime).toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showSuccess("Attendance exported successfully");
  };

  const getStatusIcon = (status: string) => {
    return status === "PRESENT" ? (
      <FiCheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <FiXCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusColor = (status: string) => {
    return status === "PRESENT"
      ? "text-green-800 bg-green-100"
      : "text-red-800 bg-red-100";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance details...</p>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Lecture Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The lecture you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
          <button
            onClick={() => router.push("/menu/attendance")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Attendance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/menu/attendance")}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Attendance Details
                </h1>
                <p className="text-gray-600">
                  {lecture.course.name} ({lecture.course.code})
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchAttendanceDetails}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <FiRefreshCw className="h-5 w-5" />
              </button>
              <button
                onClick={handleExportAttendance}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <FiDownload className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Lecture Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Lecture Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <FiBookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="font-medium text-gray-900">
                    {lecture.course.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiUser className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Lecturer</p>
                  <p className="font-medium text-gray-900">
                    {lecture.lecturer.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiClock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Start Time</p>
                  <p className="font-medium text-gray-900">
                    {new Date(lecture.startTime).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiClock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-500">End Time</p>
                  <p className="font-medium text-gray-900">
                    {new Date(lecture.endTime).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiUsers className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Registered</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.totalRegistered}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiCheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Present</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.presentCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FiXCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Absent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.absentCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiClock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(statistics.attendanceRate)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Student Attendance
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matric Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marked At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.studentName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.studentEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.matricNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.markedAt
                        ? new Date(record.markedAt).toLocaleString()
                        : "Not marked"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetailsPage;
