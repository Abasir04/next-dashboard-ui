"use client";

import React, { useState, useEffect } from "react";
import { FiTrash2, FiUser, FiBook, FiEye } from "react-icons/fi";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface StudentRegistration {
  id: number;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  matricNumber: string;
  status: string;
  createdAt: string;
  course: {
    id: number;
    name: string;
    code: string;
  };
}

const StudentsPage = () => {
  const [students, setStudents] = useState<StudentRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingStudent, setDeletingStudent] =
    useState<StudentRegistration | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/lecturers/students");

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (student: StudentRegistration) => {
    setDeletingStudent(student);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;

    try {
      setDeletingId(deletingStudent.id);
      const response = await fetch(
        `/api/lecturers/students/${deletingStudent.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete student");
      }

      // Remove the student from the list
      setStudents(
        students.filter((student) => student.id !== deletingStudent.id)
      );
      toast.success("Student registration deleted successfully");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setDeletingStudent(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingStudent(null);
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

  return (
    <div className="bg-white p-4 rounded-md flex-1 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          Students ({students.length})
        </h1>
      </div>

      {/* TABLE */}
      {students.length === 0 ? (
        <div className="text-center py-12">
          <FiUser size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">
            No students registered for your courses
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-center text-gray-500 text-sm border-b mt-4">
                <th className="pb-3">Student Name</th>
                <th className="pb-3">Matric Number</th>
                <th className="pb-3">Course Name</th>
                <th className="pb-3">Course Code</th>
                <th className="pb-3">Registration Date</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-4 text-center">
                    <div className="flex items-center gap-3 pl-6">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <FiUser size={16} className="text-primary" />
                      </div>
                      <span className="font-medium text-gray-800">
                        {student.studentName}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-gray-600 font-mono text-sm">
                      {student.matricNumber}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FiBook size={14} className="text-gray-400" />
                      <span className="text-gray-800 font-medium">
                        {student.course.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-gray-600 font-mono text-sm">
                      {student.course.code}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-gray-600 text-sm">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/menu/students/${student.id}`}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                        title="View student details"
                      >
                        <FiEye size={16} />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(student)}
                        disabled={deletingId === student.id}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                        title="Delete student"
                      >
                        {deletingId === student.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <FiTrash2 size={16} />
                        )}
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
      {showDeleteModal && deletingStudent && (
        <DeleteConfirmationModal
          student={deletingStudent}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          isDeleting={deletingId === deletingStudent.id}
        />
      )}
    </div>
  );
};

// Delete Confirmation Modal Component
interface DeleteConfirmationModalProps {
  student: StudentRegistration;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  student,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <FiTrash2 className="text-red-600" size={20} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            Delete Student
          </h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            Are you sure you want to delete this student registration?
          </p>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="font-medium text-gray-800">{student.studentName}</p>
            <p className="text-sm text-gray-600">
              Matric: {student.matricNumber}
            </p>
            <p className="text-sm text-gray-600">
              Course: {student.course.name}
            </p>
          </div>
          <p className="text-sm text-red-600 mt-2">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </>
            ) : (
              "Delete Student"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentsPage;
