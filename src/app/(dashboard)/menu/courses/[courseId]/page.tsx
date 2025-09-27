"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { showError, showSuccess } from "@/lib/toast";
import {
  FiArrowLeft,
  FiUsers,
  FiBookOpen,
  FiCalendar,
  FiFileText,
  FiClipboard,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiDownload,
} from "react-icons/fi";

interface CourseDetails {
  id: number;
  name: string;
  code: string;
  level: number;
  lecturer: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  statistics: {
    totalStudents: number;
    totalAssignments: number;
    totalLectures: number;
    totalMaterials: number;
    overallAttendanceRate: number;
  };
  assignments: Array<{
    id: number;
    title: string;
    description: string;
    startDate: string;
    dueDate: string;
    isActive: boolean;
    submissionCount: number;
    totalStudents: number;
    submissionRate: number;
    createdAt: string;
  }>;
  lectures: Array<{
    id: string;
    uniqueCode: string;
    startTime: string;
    endTime: string;
    linkExpiry: string;
    attendanceCount: number;
    totalStudents: number;
    attendanceRate: number;
    createdAt: string;
  }>;
  studentRegistrations: Array<{
    id: number;
    studentName: string;
    matricNumber: string;
    email: string;
    phone: string;
    status: string;
    registeredAt: string;
  }>;
  studentAttendanceStats: Array<{
    studentName: string;
    matricNumber: string;
    attendedLectures: number;
    totalLectures: number;
    attendanceRate: number;
  }>;
  courseMaterials: Array<{
    id: number;
    originalFilename: string;
    fileType: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;
}

const CourseDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "assignments" | "attendance" | "students" | "materials"
  >("overview");

  const courseId = params.courseId as string;

  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch course details");
      }

      const data = await response.json();
      setCourse(data.course);
    } catch (error) {
      console.error("Error fetching course details:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Failed to fetch course details"
      );
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId, fetchCourseDetails]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading course details...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiXCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Course Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The course you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
          <button
            onClick={() => router.push("/menu/courses")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-md flex-1 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/menu/courses")}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Back to courses"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {course.name}
            </h1>
            <p className="text-gray-600">
              {course.code} • Level {course.level} • {course.lecturer.name}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <FiUsers className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-blue-600 font-medium">
                Total Students
              </p>
              <p className="text-2xl font-bold text-blue-800">
                {course.statistics.totalStudents}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <FiBookOpen className="text-green-600" size={24} />
            <div>
              <p className="text-sm text-green-600 font-medium">Assignments</p>
              <p className="text-2xl font-bold text-green-800">
                {course.statistics.totalAssignments}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <FiCalendar className="text-purple-600" size={24} />
            <div>
              <p className="text-sm text-purple-600 font-medium">Lectures</p>
              <p className="text-2xl font-bold text-purple-800">
                {course.statistics.totalLectures}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <FiFileText className="text-orange-600" size={24} />
            <div>
              <p className="text-sm text-orange-600 font-medium">Materials</p>
              <p className="text-2xl font-bold text-orange-800">
                {course.statistics.totalMaterials}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: FiTrendingUp },
            { id: "assignments", label: "Assignments", icon: FiBookOpen },
            { id: "attendance", label: "Attendance", icon: FiClipboard },
            { id: "students", label: "Students", icon: FiUsers },
            { id: "materials", label: "Materials", icon: FiFileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Course Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Course Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Course Name</p>
                    <p className="font-medium">{course.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Course Code</p>
                    <p className="font-medium font-mono">{course.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Level</p>
                    <p className="font-medium">Level {course.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lecturer</p>
                    <p className="font-medium">{course.lecturer.name}</p>
                    <p className="text-sm text-gray-500">
                      {course.lecturer.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">
                      {formatDate(course.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assignment Overview */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Assignment Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Overall Submission Rate
                    </span>
                    <span
                      className={`text-lg font-bold ${getAttendanceColor(
                        course.assignments.length > 0
                          ? course.assignments.reduce(
                              (sum, assignment) =>
                                sum + assignment.submissionRate,
                              0
                            ) / course.assignments.length
                          : 0
                      )}`}
                    >
                      {course.assignments.length > 0
                        ? (
                            course.assignments.reduce(
                              (sum, assignment) =>
                                sum + assignment.submissionRate,
                              0
                            ) / course.assignments.length
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          course.assignments.length > 0
                            ? course.assignments.reduce(
                                (sum, assignment) =>
                                  sum + assignment.submissionRate,
                                0
                              ) / course.assignments.length
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Assignments</p>
                      <p className="font-medium">
                        {course.statistics.totalAssignments}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Active Assignments</p>
                      <p className="font-medium">
                        {course.assignments.filter((a) => a.isActive).length}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600">Total Submissions</p>
                    <p className="font-medium">
                      {course.assignments.reduce(
                        (sum, assignment) => sum + assignment.submissionCount,
                        0
                      )}{" "}
                      /{" "}
                      {course.statistics.totalStudents *
                        course.statistics.totalAssignments}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attendance Overview */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Attendance Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Overall Attendance Rate
                    </span>
                    <span
                      className={`text-lg font-bold ${getAttendanceColor(
                        course.statistics.overallAttendanceRate
                      )}`}
                    >
                      {course.statistics.overallAttendanceRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${course.statistics.overallAttendanceRate}%`,
                      }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Lectures</p>
                      <p className="font-medium">
                        {course.statistics.totalLectures}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Students</p>
                      <p className="font-medium">
                        {course.statistics.totalStudents}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Assignments
              </h3>
              <span className="text-sm text-gray-600">
                {course.assignments.length} assignment
                {course.assignments.length !== 1 ? "s" : ""}
              </span>
            </div>
            {course.assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiBookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No assignments found for this course.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {course.assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-800">
                            {assignment.title}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              assignment.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {assignment.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {assignment.description && (
                          <p className="text-gray-600 text-sm mb-3">
                            {assignment.description}
                          </p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Start Date</p>
                            <p className="font-medium">
                              {formatDate(assignment.startDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Due Date</p>
                            <p className="font-medium">
                              {formatDate(assignment.dueDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Submissions</p>
                            <p className="font-medium">
                              {assignment.submissionCount} /{" "}
                              {assignment.totalStudents}
                              <span className="text-gray-500 ml-1">
                                ({assignment.submissionRate.toFixed(1)}%)
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Attendance Records
              </h3>
              <span className="text-sm text-gray-600">
                {course.lectures.length} lecture
                {course.lectures.length !== 1 ? "s" : ""}
              </span>
            </div>

            {course.lectures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiClipboard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No lectures found for this course.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {course.lectures.map((lecture) => (
                  <div
                    key={lecture.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-800">
                            Lecture Session
                          </h4>
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-mono">
                            {lecture.uniqueCode}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Start Time</p>
                            <p className="font-medium">
                              {formatDate(lecture.startTime)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">End Time</p>
                            <p className="font-medium">
                              {formatDate(lecture.endTime)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Link Expiry</p>
                            <p className="font-medium">
                              {formatDate(lecture.linkExpiry)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <p className="text-gray-600">Attendance</p>
                              <p className="font-medium">
                                {lecture.attendanceCount} /{" "}
                                {lecture.totalStudents}
                                <span className="text-gray-500 ml-1">
                                  ({lecture.attendanceRate.toFixed(1)}%)
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                lecture.attendanceRate >= 80
                                  ? "bg-green-500"
                                  : lecture.attendanceRate >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${lecture.attendanceRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Student Attendance Summary */}
            {course.studentAttendanceStats.length > 0 && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Student Attendance Summary
                </h4>
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
                          Attended
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {course.studentAttendanceStats.map((student, index) => (
                        <tr key={`${student.matricNumber}-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.studentName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {student.matricNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.attendedLectures} / {student.totalLectures}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`font-medium ${getAttendanceColor(
                                student.attendanceRate
                              )}`}
                            >
                              {student.attendanceRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "students" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Registered Students
              </h3>
              <span className="text-sm text-gray-600">
                {course.studentRegistrations.length} student
                {course.studentRegistrations.length !== 1 ? "s" : ""}
              </span>
            </div>
            {course.studentRegistrations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiUsers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No students registered for this course.</p>
              </div>
            ) : (
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
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registered
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {course.studentRegistrations.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.studentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {student.matricNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              student.status
                            )}`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(student.registeredAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "materials" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Course Materials
              </h3>
              <span className="text-sm text-gray-600">
                {course.courseMaterials.length} material
                {course.courseMaterials.length !== 1 ? "s" : ""}
              </span>
            </div>
            {course.courseMaterials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiFileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No materials uploaded for this course.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {course.courseMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {material.fileType === "video" ? (
                          <FiFileText className="h-8 w-8 text-red-500" />
                        ) : (
                          <FiFileText className="h-8 w-8 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {material.originalFilename}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Uploaded by {material.uploadedBy}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(material.uploadedAt)}
                        </p>
                        <div className="mt-2">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              material.fileType === "video"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {material.fileType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage;
