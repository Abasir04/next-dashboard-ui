"use client";

import { useState, useEffect, useCallback } from "react";
import { FiBook, FiUsers, FiCalendar, FiEdit, FiTrash2 } from "react-icons/fi";

interface Course {
  id: number;
  name: string;
  code: string;
  level: number;
  lecturer: {
    name: string;
    email: string;
  };
  studentCount: number;
  levels: string[];
  createdAt: string;
  updatedAt: string;
}

interface LecturerCoursesProps {
  lecturerId: number;
  userRole: string;
}

const LecturerCourses = ({ lecturerId, userRole }: LecturerCoursesProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lecturers/${lecturerId}/courses`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch courses");
      }

      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [lecturerId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleEditCourse = (_course: Course) => {
    // TODO: Implement edit functionality
  };

  const handleDeleteCourse = (_course: Course) => {
    // TODO: Implement delete functionality
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Courses</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Courses</h2>
        <div className="text-center py-8 text-red-500">
          <p>Error: {error}</p>
          <button
            onClick={fetchCourses}
            className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Courses ({courses.length})</h2>
        {(userRole === "admin" || userRole === "lecturer") && (
          <button className="px-3 py-1 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors text-sm">
            Add Course
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FiBook size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No courses found for this lecturer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FiBook className="text-primary" size={16} />
                    <h3 className="font-semibold text-gray-800">
                      {course.name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      ({course.code})
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <FiUsers size={14} />
                      <span>Level {course.level}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiUsers size={14} />
                      <span>{course.studentCount} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiCalendar size={14} />
                      <span>
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {course.levels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {course.levels.map((level, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {level}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {(userRole === "admin" || userRole === "lecturer") && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                      title="Edit course"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete course"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LecturerCourses;
