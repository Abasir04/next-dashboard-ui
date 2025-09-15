"use client";

import React, { useState, useEffect, useCallback } from "react";
import { showError, showSuccess } from "@/lib/toast";
import CourseForm from "@/components/forms/CourseForm";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiLink,
  FiUsers,
  FiFileText,
} from "react-icons/fi";

interface Course {
  id: number;
  name: string;
  code: string;
  level: number;
  studentCount: number;
  materialsCount?: number;
  lecturer: {
    name: string;
    email: string;
  };
  levels: string[];
  createdAt: string;
  updatedAt: string;
}

const columns = [
  {
    header: "Course Name",
    accessor: "name",
  },
  {
    header: "Course Code",
    accessor: "code",
  },
  {
    header: "Level",
    accessor: "level",
  },
  {
    header: "Students",
    accessor: "studentCount",
  },
  {
    header: "Materials",
    accessor: "materialsCount",
  },
  {
    header: "Created",
    accessor: "createdAt",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [courseForRegistration, setCourseForRegistration] =
    useState<Course | null>(null);
  const [registrationLink, setRegistrationLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.user?.role?.toLowerCase() || "");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchCourses = useCallback(async () => {
    try {
      let response;

      // If user is a lecturer, fetch only their courses
      if (userRole === "lecturer") {
        // First get the lecturer ID
        const meResponse = await fetch("/api/auth/me");
        if (!meResponse.ok) throw new Error("Failed to fetch user data");
        const meData = await meResponse.json();

        if (meData.user?.lecturer?.id) {
          response = await fetch(
            `/api/lecturers/${meData.user.lecturer.id}/courses`
          );
        } else {
          throw new Error("Lecturer profile not found");
        }
      } else {
        // For admins, fetch all courses
        response = await fetch("/api/courses");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch courses");
      }
      const data = await response.json();

      // Handle different response formats
      if (userRole === "lecturer") {
        setCourses(data.courses || []);
      } else {
        setCourses(data || []);
      }
    } catch (error) {
      showError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchCourses();
    }
  }, [userRole, fetchCourses]);

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setShowCourseForm(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setShowCourseForm(true);
  };

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/courses?id=${courseToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete course");
      }

      showSuccess("Course deleted successfully");
      fetchCourses();
      setShowDeleteModal(false);
      setCourseToDelete(null);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCourseToDelete(null);
  };

  const handleGenerateRegistrationLink = (course: Course) => {
    setCourseForRegistration(course);
    setShowRegistrationModal(true);
  };

  const handleViewMaterials = (course: Course) => {
    window.location.href = `/menu/courses/${course.id}/materials`;
  };

  const generateRegistrationLink = async () => {
    if (!courseForRegistration) return;

    setIsGeneratingLink(true);
    try {
      const response = await fetch("/api/course-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: courseForRegistration.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate registration link");
      }

      setRegistrationLink(data.registrationUrl);
      showSuccess("Registration link generated successfully");
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const closeRegistrationModal = () => {
    setShowRegistrationModal(false);
    setCourseForRegistration(null);
    setRegistrationLink(null);
  };

  const handleFormSuccess = () => {
    fetchCourses();
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderRow = (course: Course) => (
    <tr
      key={course.id}
      className="text-center border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4 font-medium">{course.name}</td>
      <td className="p-4">
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-800">
          {course.code}
        </span>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
          {course.level} Level
        </span>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {course.studentCount} students
        </span>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {course.materialsCount ?? 0} materials
        </span>
      </td>
      <td className="hidden md:table-cell p-4 text-gray-500">
        {new Date(course.createdAt).toLocaleDateString()}
      </td>
      <td className="p-4">
        <div className="flex justify-center gap-2">
          {(userRole === "admin" || userRole === "lecturer") && (
            <>
              <button
                onClick={() => handleEditCourse(course)}
                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                title="Edit course"
              >
                <FiEdit2 size={16} />
              </button>
              <button
                onClick={() => handleGenerateRegistrationLink(course)}
                className="p-1 text-green-600 hover:text-green-800 transition-colors"
                title="Generate registration link"
              >
                <FiLink size={16} />
              </button>
              <button
                onClick={() => handleViewMaterials(course)}
                className="p-1 text-purple-600 hover:text-purple-800 transition-colors"
                title="Course Materials"
              >
                <FiFileText size={16} />
              </button>
              <button
                onClick={() => handleDeleteCourse(course)}
                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                title="Delete course"
              >
                <FiTrash2 size={16} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Courses</h1>
        <div className="flex items-center gap-4">
          <TableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search courses by name or code..."
          />
          {(userRole === "admin" || userRole === "lecturer") && (
            <button
              onClick={handleCreateCourse}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <FiPlus size={16} />
              Create Course
            </button>
          )}
        </div>
      </div>

      {/* COURSES TABLE */}
      <Table
        columns={columns}
        renderRow={renderRow}
        data={filteredCourses}
        emptyMessage="No courses found"
      />

      {/* PAGINATION */}
      <Pagination />

      {/* COURSE FORM MODAL */}
      {showCourseForm && (
        <CourseForm
          course={editingCourse}
          onClose={() => {
            setShowCourseForm(false);
            setEditingCourse(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && courseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Delete Course
              </h2>
              <button
                onClick={cancelDelete}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isDeleting}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete this course?
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-800">
                  {courseToDelete.name}
                </p>
                <p className="text-sm text-gray-600">
                  Code: {courseToDelete.code} | Level: {courseToDelete.level}
                </p>
              </div>
              <p className="text-red-600 text-sm mt-2">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={cancelDelete}
                className="px-6 py-2 bg-gray-400 text-black rounded-md hover:bg-gray-300 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 size={16} />
                    Delete Course
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION LINK MODAL */}
      {showRegistrationModal && courseForRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Generate Registration Link
              </h2>
              <button
                onClick={closeRegistrationModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isGeneratingLink}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Generate a registration link for:
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-800">
                  {courseForRegistration.name}
                </p>
                <p className="text-sm text-gray-600">
                  Code: {courseForRegistration.code} | Level:{" "}
                  {courseForRegistration.level}
                </p>
              </div>
            </div>

            {!registrationLink ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  The registration link will be automatically generated for
                  level {courseForRegistration.level} based on the course code.
                </p>
                <button
                  onClick={generateRegistrationLink}
                  disabled={isGeneratingLink}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGeneratingLink ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating Link...
                    </>
                  ) : (
                    "Generate Registration Link"
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Registration link generated successfully:
                </p>
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-800 break-all">
                    {registrationLink}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(registrationLink);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 3000);
                      } catch (err) {
                        console.error("Failed to copy:", err);
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    {copied ? "Copied" : "Copy Link"}
                  </button>
                  <button
                    onClick={() => window.open(registrationLink, "_blank")}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Open Link
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  This link will expire in 1 month from now.
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={closeRegistrationModal}
                className="px-6 py-2 bg-gray-400 text-black rounded-md hover:bg-gray-300 transition-colors"
                disabled={isGeneratingLink}
              >
                {registrationLink ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
