"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiDownload,
  FiCalendar,
  FiUsers,
  FiBook,
  FiEdit,
  FiTrash2,
  FiFileText,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

interface Assignment {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  dueDate: string;
  isActive: boolean;
  linkId: string;
  createdAt: string;
  course: {
    id: number;
    name: string;
    code: string;
  };
  lecturer: {
    id: number;
    name: string;
  };
  level: {
    id: number;
    name: string;
  };
  submissions: AssignmentSubmission[];
  _count: {
    submissions: number;
  };
}

interface AssignmentSubmission {
  id: number;
  fileUrl: string;
  originalFilename: string;
  submittedAt: string;
  gradedAt?: string;
  grade?: number;
  feedback?: string;
  student: {
    id: number;
    name: string;
    matricNumber: string;
  };
}

const AssignmentDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] =
    useState<AssignmentSubmission | null>(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchAssignment = useCallback(
    async (assignmentId: number) => {
      try {
        setLoading(true);
        const response = await fetch(`/api/assignments/${assignmentId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch assignment");
        }

        const data = await response.json();
        setAssignment(data.assignment);
      } catch (error) {
        console.error("Error fetching assignment:", error);
        toast.error("Failed to fetch assignment details");
        router.push("/menu/assignments");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (params.id) {
      fetchAssignment(Number(params.id));
    }
  }, [params.id, fetchAssignment]);

  const handleGradeSubmission = (submission: AssignmentSubmission) => {
    setGradingSubmission(submission);
    setGrade(submission.grade?.toString() || "");
    setFeedback(submission.feedback || "");
    setShowGradingModal(true);
  };

  const handleGradeSubmit = async () => {
    if (!gradingSubmission || !grade) return;

    try {
      setIsGrading(true);
      const response = await fetch(
        `/api/assignments/${assignment?.id}/submissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            submissionId: gradingSubmission.id,
            grade: parseInt(grade),
            feedback,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to grade submission");
      }

      // Update the submission in the local state
      if (assignment) {
        const updatedSubmissions = assignment.submissions.map((sub) =>
          sub.id === gradingSubmission.id
            ? {
                ...sub,
                grade: parseInt(grade),
                feedback,
                gradedAt: new Date().toISOString(),
              }
            : sub
        );
        setAssignment({ ...assignment, submissions: updatedSubmissions });
      }

      toast.success("Submission graded successfully");
      setShowGradingModal(false);
      setGradingSubmission(null);
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error("Failed to grade submission");
    } finally {
      setIsGrading(false);
    }
  };

  const handleDownload = (submission: AssignmentSubmission) => {
    // Create a temporary link to download the file
    const link = document.createElement("a");
    link.href = submission.fileUrl;
    link.download = submission.originalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusToggle = async () => {
    if (!assignment) return;

    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !assignment.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update assignment status");
      }

      // Update local state
      setAssignment({ ...assignment, isActive: !assignment.isActive });
      toast.success(
        `Assignment ${
          !assignment.isActive ? "activated" : "deactivated"
        } successfully`
      );
    } catch (error) {
      console.error("Error updating assignment status:", error);
      toast.error("Failed to update assignment status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 mt-0">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 mt-0">
        <div className="text-center py-8">
          <p className="text-gray-500">Assignment not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/menu/assignments")}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Back to Assignments"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              {assignment.title}
            </h1>
            <p className="text-sm text-gray-500">
              {assignment.course.name} ({assignment.course.code})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
              assignment.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {assignment.isActive ? "Active" : "Inactive"}
          </span>
          <button
            onClick={handleStatusToggle}
            disabled={isUpdatingStatus}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              assignment.isActive
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
            title={
              assignment.isActive
                ? "Deactivate assignment"
                : "Activate assignment"
            }
          >
            {isUpdatingStatus ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Updating...
              </div>
            ) : assignment.isActive ? (
              "Deactivate"
            ) : (
              "Activate"
            )}
          </button>
        </div>
      </div>

      {/* ASSIGNMENT INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* BASIC INFO */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiFileText className="text-primary" />
            Assignment Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <p className="text-gray-800">
                {assignment.description || "No description provided"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <div className="flex items-center gap-2">
                <FiCalendar size={16} className="text-gray-400" />
                <p className="text-gray-800">
                  {new Date(assignment.startDate).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div className="flex items-center gap-2">
                <FiCalendar size={16} className="text-gray-400" />
                <p className="text-gray-800">
                  {new Date(assignment.dueDate).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COURSE INFO */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiBook className="text-primary" />
            Course Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name
              </label>
              <p className="text-gray-800 font-medium">
                {assignment.course.name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Code
              </label>
              <p className="text-gray-800 font-mono">
                {assignment.course.code}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <p className="text-gray-800">{assignment.level.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lecturer
              </label>
              <p className="text-gray-800">{assignment.lecturer.name}</p>
            </div>
          </div>
        </div>

        {/* STATISTICS */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiUsers className="text-primary" />
            Statistics
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Submissions
              </label>
              <p className="text-2xl font-bold text-gray-800">
                {assignment._count.submissions}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Graded Submissions
              </label>
              <p className="text-2xl font-bold text-green-600">
                {assignment.submissions.filter((s) => s.grade !== null).length}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pending Grading
              </label>
              <p className="text-2xl font-bold text-orange-600">
                {assignment.submissions.filter((s) => s.grade === null).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMISSIONS TABLE */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Student Submissions</h2>

        {assignment.submissions.length === 0 ? (
          <div className="text-center py-8">
            <FiFileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No submissions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b">
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Matric Number</th>
                  <th className="pb-3">Submitted At</th>
                  <th className="pb-3">File</th>
                  <th className="pb-3">Grade</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignment.submissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <FiUsers size={16} className="text-primary" />
                        </div>
                        <span className="font-medium text-gray-800">
                          {submission.student.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-gray-600 font-mono text-sm">
                        {submission.student.matricNumber}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-gray-600 text-sm">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <FiFileText size={14} className="text-gray-400" />
                        <span className="text-gray-600 text-sm">
                          {submission.originalFilename}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      {submission.grade !== null ? (
                        <span className="inline-flex px-2 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                          {submission.grade}%
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(submission)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Download submission"
                        >
                          <FiDownload size={16} />
                        </button>
                        <button
                          onClick={() => handleGradeSubmission(submission)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                          title="Grade submission"
                        >
                          <FiEdit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GRADING MODAL */}
      {showGradingModal && gradingSubmission && (
        <GradingModal
          submission={gradingSubmission}
          grade={grade}
          feedback={feedback}
          onGradeChange={setGrade}
          onFeedbackChange={setFeedback}
          onClose={() => {
            setShowGradingModal(false);
            setGradingSubmission(null);
          }}
          onSubmit={handleGradeSubmit}
          isGrading={isGrading}
        />
      )}
    </div>
  );
};

// Grading Modal Component
interface GradingModalProps {
  submission: AssignmentSubmission;
  grade: string;
  feedback: string;
  onGradeChange: (grade: string) => void;
  onFeedbackChange: (feedback: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isGrading: boolean;
}

const GradingModal: React.FC<GradingModalProps> = ({
  submission,
  grade,
  feedback,
  onGradeChange,
  onFeedbackChange,
  onClose,
  onSubmit,
  isGrading,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Grade Submission</h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Student:</strong> {submission.student.name} (
            {submission.student.matricNumber})
          </p>
          <p className="text-sm text-gray-600 mb-4">
            <strong>File:</strong> {submission.originalFilename}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade (0-100) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={grade}
              onChange={(e) => onGradeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter grade (0-100)"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Enter feedback (optional)"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isGrading}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isGrading || !grade}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGrading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Grading...
              </>
            ) : (
              "Submit Grade"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailsPage;
