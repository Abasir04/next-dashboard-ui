"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FiPlus,
  FiEye,
  FiTrash2,
  FiDownload,
  FiEdit,
  FiCalendar,
  FiUsers,
  FiBook,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  DeleteConfirmationModal,
  CreateAssignmentModal,
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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAssignment, setDeletingAssignment] =
    useState<Assignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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
                    <div className="flex items-center justify-center gap-2">
                      <FiBook size={14} className="text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-800">
                          {assignment.course.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {assignment.course.code}
                        </div>
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
    </div>
  );
};

export default AssignmentsPage;
