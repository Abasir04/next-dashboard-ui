"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FiPlus,
  FiEye,
  FiTrash2,
  FiEdit,
  FiCalendar,
  FiUsers,
  FiBook,
  FiLink,
  FiCopy,
  FiX,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  DeleteConfirmationModal,
  CreateAssignmentModal,
  EditAssignmentModal,
} from "@/components/modals/AssignmentModals";
import TableSearchWithRefresh from "@/components/TableSearchWithRefresh";

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
  _count: {
    submissions: number;
  };
}

const AssignmentsPage = () => {
  const searchParams = useSearchParams();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAssignment, setDeletingAssignment] =
    useState<Assignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
  const [showSubmissionLinkModal, setShowSubmissionLinkModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [submissionLink, setSubmissionLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/assignments");

      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }

      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create") {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const handleRefresh = () => {
    fetchAssignments();
  };

  const handleDeleteClick = (assignment: Assignment) => {
    setDeletingAssignment(assignment);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAssignment) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/assignments/${deletingAssignment.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete assignment");
      }

      setAssignments(assignments.filter((a) => a.id !== deletingAssignment.id));
      toast.success("Assignment deleted successfully");
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete assignment");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeletingAssignment(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingAssignment(null);
  };

  const handleEditClick = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setShowEditModal(true);
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setEditingAssignment(null);
  };

  const handleEditSubmit = async (updatedAssignment: Partial<Assignment>) => {
    if (!editingAssignment) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/assignments/${editingAssignment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedAssignment),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update assignment");
      }

      // Update the assignment in the local state
      setAssignments(
        assignments.map((assignment) =>
          assignment.id === editingAssignment.id
            ? { ...assignment, ...updatedAssignment }
            : assignment
        )
      );

      toast.success("Assignment updated successfully");
      setShowEditModal(false);
      setEditingAssignment(null);
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error("Failed to update assignment");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateSubmissionLink = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionLinkModal(true);
    setIsGeneratingLink(true);

    try {
      const response = await fetch(
        `/api/assignments/${assignment.id}/submission-link`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate submission link"
        );
      }

      const data = await response.json();
      setSubmissionLink(data.submissionUrl);
    } catch (error) {
      console.error("Error generating submission link:", error);
      toast.error("Failed to generate submission link");
      setSubmissionLink(null);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (submissionLink) {
      try {
        await navigator.clipboard.writeText(submissionLink);
        toast.success("Submission link copied to clipboard!");
      } catch (error) {
        console.error("Error copying link:", error);
        toast.error("Failed to copy link");
      }
    }
  };

  const handleCloseSubmissionLinkModal = () => {
    setShowSubmissionLinkModal(false);
    setSelectedAssignment(null);
    setSubmissionLink(null);
    setIsGeneratingLink(false);
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

  // Filter assignments based on search term
  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          Assignments ({filteredAssignments.length})
        </h1>
        <div className="flex items-center gap-4">
          <TableSearchWithRefresh
            value={searchTerm}
            onChange={setSearchTerm}
            onRefresh={handleRefresh}
            placeholder="Search assignments by title, course, or description..."
            isLoading={loading}
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <FiPlus size={16} />
            Create Assignment
          </button>
        </div>
      </div>

      {/* TABLE */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <FiBook size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No assignments created yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Create Your First Assignment
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-center text-gray-500 text-sm border-b">
                <th className="pb-3">Assignment Title</th>
                <th className="pb-3">Course</th>
                <th className="pb-3">Level</th>
                <th className="pb-3">Start Date</th>
                <th className="pb-3">Due Date</th>
                <th className="pb-3">Submissions</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((assignment) => (
                <tr
                  key={assignment.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-4 text-center">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {assignment.title}
                      </h3>
                      {assignment.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div className="space-y-2">
                      <div className="font-medium text-gray-800">
                        {assignment.course.name}
                      </div>
                      <div className="font-medium text-gray-800">
                        {assignment.course.code}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-800">
                        {assignment.level.name}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FiCalendar size={14} className="text-gray-400" />
                      <span className="text-gray-600 text-sm">
                        {new Date(assignment.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FiCalendar size={14} className="text-gray-400" />
                      <span className="text-gray-600 text-sm">
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FiUsers size={14} className="text-gray-400" />
                      <span className="text-gray-600 text-sm">
                        {assignment._count.submissions}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        assignment.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {assignment.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/menu/assignments/${assignment.id}`}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                        title="View assignment details"
                      >
                        <FiEye size={16} />
                      </Link>
                      <button
                        onClick={() => handleEditClick(assignment)}
                        className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md transition-colors"
                        title="Edit assignment"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleGenerateSubmissionLink(assignment)}
                        disabled={isGeneratingLink}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                        title="Generate submission link"
                      >
                        <FiLink size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(assignment)}
                        disabled={isDeleting}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                        title="Delete assignment"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && deletingAssignment && (
        <DeleteConfirmationModal
          assignment={deletingAssignment}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showCreateModal && (
        <CreateAssignmentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAssignments();
          }}
        />
      )}

      {/* EDIT ASSIGNMENT MODAL */}
      {showEditModal && (
        <EditAssignmentModal
          assignment={editingAssignment}
          isOpen={showEditModal}
          onClose={handleEditCancel}
          onSubmit={handleEditSubmit}
          isUpdating={isUpdating}
        />
      )}

      {/* SUBMISSION LINK MODAL */}
      {showSubmissionLinkModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FiLink className="text-blue-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  Assignment Submission Link
                </h3>
                <p className="text-sm text-gray-600">
                  Generate and share submission link
                </p>
              </div>
              <button
                onClick={handleCloseSubmissionLinkModal}
                className="text-gray-400 hover:text-gray-600"
                title="Close modal"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  {selectedAssignment.title}
                </h4>
                <p className="text-sm text-gray-600">
                  Course: {selectedAssignment.course.name} (
                  {selectedAssignment.course.code})
                </p>
                <p className="text-sm text-gray-600">
                  Due:{" "}
                  {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                </p>
              </div>

              {isGeneratingLink ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Generating link...</span>
                </div>
              ) : submissionLink ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600 mb-2">
                      Submission Link:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={submissionLink}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        title="Copy link"
                      >
                        <FiCopy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> This link will expire when the
                      assignment due date is reached.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600">
                    Failed to generate submission link
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseSubmissionLinkModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
