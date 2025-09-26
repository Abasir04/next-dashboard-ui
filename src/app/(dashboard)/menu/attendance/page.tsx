"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiCalendar,
  FiClock,
  FiUsers,
  FiEye,
  FiCopy,
  FiCode,
  FiRefreshCw,
  FiTrash2,
  FiDownload,
  FiX,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { showError, showSuccess } from "@/lib/toast";
import TableSearchWithRefresh from "@/components/TableSearchWithRefresh";
import CreateLectureModal from "@/components/modals/CreateLectureModal";
import QRCodeModal from "@/components/modals/QRCodeModal";

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
  attendanceUrl: string;
  presentCount: number;
  totalStudents: number;
  createdAt: string;
}

const AttendancePage = () => {
  const router = useRouter();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState({ url: "", title: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    lectureId: string;
    lectureName: string;
  }>({ show: false, lectureId: "", lectureName: "" });

  const fetchLectures = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/lectures");

      if (!response.ok) {
        throw new Error("Failed to fetch lectures");
      }

      const data = await response.json();
      setLectures(data.lectures || []);
    } catch (error) {
      console.error("Error fetching lectures:", error);
      showError("Failed to fetch lectures");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  const handleRefresh = () => {
    fetchLectures();
  };

  const handleCreateLecture = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchLectures();
    showSuccess("Lecture created successfully");
  };

  const handleViewAttendance = (lectureId: string) => {
    router.push(`/menu/attendance/${lectureId}`);
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showSuccess("Link copied to clipboard");
    } catch (error) {
      showError("Failed to copy link");
    }
  };

  const handleShowQR = (url: string, title: string) => {
    setQrData({ url, title });
    setShowQRModal(true);
  };

  const handleDeleteLecture = (lectureId: string, lectureName: string) => {
    setDeleteConfirm({
      show: true,
      lectureId,
      lectureName,
    });
  };

  const confirmDeleteLecture = async () => {
    try {
      const response = await fetch(`/api/lectures/${deleteConfirm.lectureId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete lecture");
      }

      showSuccess("Lecture deleted successfully");
      setDeleteConfirm({ show: false, lectureId: "", lectureName: "" });
      fetchLectures();
    } catch (error) {
      console.error("Error deleting lecture:", error);
      showError(
        error instanceof Error ? error.message : "Failed to delete lecture"
      );
    }
  };

  const cancelDeleteLecture = () => {
    setDeleteConfirm({ show: false, lectureId: "", lectureName: "" });
  };

  const handleExportAttendance = async (lectureId: string) => {
    try {
      const response = await fetch(`/api/attendance/lecture/${lectureId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch attendance data");
      }

      const data = await response.json();

      // Create CSV content
      const csvContent = [
        ["Student Name", "Matric Number", "Email", "Status", "Marked At"],
        ...data.attendance.map((attendance: any) => [
          attendance.studentName,
          attendance.matricNumber,
          attendance.studentEmail,
          attendance.status,
          attendance.markedAt
            ? new Date(attendance.markedAt).toLocaleString()
            : "Not marked",
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${data.lecture.course.code}-${
        new Date(data.lecture.startTime).toISOString().split("T")[0]
      }.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      showSuccess("Attendance exported successfully");
    } catch (error) {
      console.error("Error exporting attendance:", error);
      showError("Failed to export attendance");
    }
  };

  // Filter lectures based on search term
  const filteredLectures = lectures.filter(
    (lecture) =>
      lecture.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lecture.course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 mt-0">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          Attendance ({filteredLectures.length})
        </h1>
        <div className="flex items-center gap-4">
          <TableSearchWithRefresh
            value={searchTerm}
            onChange={setSearchTerm}
            onRefresh={handleRefresh}
            placeholder="Search lectures by course name or code..."
            isLoading={loading}
          />
          <button
            onClick={handleCreateLecture}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <FiPlus size={16} />
            Create Attendance
          </button>
        </div>
      </div>

      {/* TABLE */}
      {filteredLectures.length === 0 ? (
        <div className="text-center py-12">
          <FiCalendar size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No lectures created yet</p>
          <button
            onClick={handleCreateLecture}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Create Your First Lecture
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-center text-gray-500 text-sm border-b">
                <th className="pb-3">Course</th>
                <th className="pb-3">Start Time</th>
                <th className="pb-3">End Time</th>
                <th className="pb-3">Attendance</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLectures.map((lecture) => {
                const now = new Date();
                const startTime = new Date(lecture.startTime);
                const endTime = new Date(lecture.endTime);
                const linkExpiry = new Date(lecture.linkExpiry);

                let status = "Scheduled";
                let statusColor = "bg-blue-100 text-blue-800";

                if (now < startTime) {
                  status = "Scheduled";
                  statusColor = "bg-blue-100 text-blue-800";
                } else if (now >= startTime && now <= endTime) {
                  status = "In Progress";
                  statusColor = "bg-green-100 text-green-800";
                } else if (now > endTime && now <= linkExpiry) {
                  status = "Ended (Link Active)";
                  statusColor = "bg-yellow-100 text-yellow-800";
                } else {
                  status = "Expired";
                  statusColor = "bg-red-100 text-red-800";
                }

                return (
                  <tr
                    key={lecture.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-4 text-center">
                      <div className="space-y-2">
                        <div className="font-medium text-gray-800">
                          {lecture.course.name}
                        </div>
                        <div className="font-medium text-gray-800">
                          {lecture.course.code}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <FiCalendar size={14} className="text-gray-400" />
                        <div className="text-left">
                          <div className="text-gray-600 text-sm">
                            {new Date(lecture.startTime).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {new Date(lecture.startTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <FiCalendar size={14} className="text-gray-400" />
                        <div className="text-left">
                          <div className="text-gray-600 text-sm">
                            {new Date(lecture.endTime).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {new Date(lecture.endTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <FiUsers size={14} className="text-gray-400" />
                        <div className="text-left">
                          <div className="text-gray-600 text-sm">
                            {lecture.presentCount} / {lecture.totalStudents}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {lecture.totalStudents > 0
                              ? Math.round(
                                  (lecture.presentCount /
                                    lecture.totalStudents) *
                                    100
                                )
                              : 0}
                            %
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewAttendance(lecture.id)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                          title="View attendance details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => handleCopyLink(lecture.attendanceUrl)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Copy attendance link"
                        >
                          <FiCopy size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleShowQR(
                              lecture.attendanceUrl,
                              lecture.course.name
                            )
                          }
                          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors"
                          title="Show QR code"
                        >
                          <FiCode size={16} />
                        </button>
                        <button
                          onClick={() => handleExportAttendance(lecture.id)}
                          className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md transition-colors"
                          title="Export attendance"
                        >
                          <FiDownload size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteLecture(lecture.id, lecture.course.name)
                          }
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete lecture"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Lecture Modal */}
      {showCreateModal && (
        <CreateLectureModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <QRCodeModal
          url={qrData.url}
          title={qrData.title}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Delete Lecture
              </h2>
              <button
                onClick={cancelDeleteLecture}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete this lecture?
              </p>
              <p className="text-sm text-gray-500">
                <strong>Course:</strong> {deleteConfirm.lectureName}
              </p>
              <p className="text-sm text-red-600 mt-2">
                <strong>Warning:</strong> This action cannot be undone. All
                attendance records will be permanently deleted. Make sure you
                have downloaded the attendance data before proceeding.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelDeleteLecture}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteLecture}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
