"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiBook,
  FiCalendar,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

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

const SingleStudentPage = () => {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<StudentRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: "",
    studentPhone: "",
    matricNumber: "",
  });

  const fetchStudent = useCallback(
    async (registrationId: number) => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/lecturers/students/${registrationId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch student");
        }

        const data = await response.json();
        setStudent(data.student);
        setFormData({
          studentName: data.student.studentName,
          studentEmail: data.student.studentEmail,
          studentPhone: data.student.studentPhone,
          matricNumber: data.student.matricNumber,
        });
      } catch (error) {
        console.error("Error fetching student:", error);
        toast.error("Failed to fetch student details");
        router.push("/menu/students");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (params.id) {
      fetchStudent(Number(params.id));
    }
  }, [params.id, fetchStudent]);

  const handleUpdate = async () => {
    if (!student) return;

    try {
      const response = await fetch(`/api/lecturers/students/${student.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update student");
      }

      const data = await response.json();
      setStudent(data.student);
      setEditing(false);
      toast.success("Student updated successfully");
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Failed to update student");
    }
  };

  const handleDelete = async () => {
    if (!student) return;

    if (
      !confirm("Are you sure you want to delete this student registration?")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/lecturers/students/${student.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete student");
      }

      toast.success("Student registration deleted successfully");
      router.push("/menu/students");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
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

  if (!student) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 mt-0">
        <div className="text-center py-8">
          <p className="text-gray-500">Student not found</p>
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
            onClick={() => router.push("/menu/students")}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Back to Students"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            Student Details
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                title="Edit student"
              >
                <FiEdit size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                title="Delete student"
              >
                <FiTrash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* STUDENT INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BASIC INFO */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiUser className="text-primary" />
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) =>
                    setFormData({ ...formData, studentName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-gray-800 font-medium">
                  {student.studentName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matric Number
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.matricNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, matricNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-gray-800 font-mono">
                  {student.matricNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              {editing ? (
                <input
                  type="email"
                  value={formData.studentEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, studentEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <FiMail size={16} className="text-gray-400" />
                  <p className="text-gray-800">{student.studentEmail}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.studentPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, studentPhone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <FiPhone size={16} className="text-gray-400" />
                  <p className="text-gray-800">{student.studentPhone}</p>
                </div>
              )}
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
              <p className="text-gray-800 font-medium">{student.course.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Code
              </label>
              <p className="text-gray-800 font-mono">{student.course.code}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Status
              </label>
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  student.status === "APPROVED"
                    ? "bg-green-100 text-green-800"
                    : student.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {student.status}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Date
              </label>
              <div className="flex items-center gap-2">
                <FiCalendar size={16} className="text-gray-400" />
                <p className="text-gray-800">
                  {new Date(student.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleStudentPage;
