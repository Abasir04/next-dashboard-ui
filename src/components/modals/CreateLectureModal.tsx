"use client";

import React, { useState, useEffect } from "react";
import { FiX, FiCalendar, FiClock, FiBookOpen } from "react-icons/fi";
import { showError, showSuccess } from "@/lib/toast";
import { toUTC, getDefaultTimes, toDateTimeLocalFormat } from "@/lib/time";

interface Course {
  id: number;
  name: string;
  code: string;
}

interface CreateLectureModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateLectureModal: React.FC<CreateLectureModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    courseId: "",
    startTime: "",
    endTime: "",
    linkExpiry: "",
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/lecturers/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.courseId ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.linkExpiry
    ) {
      showError("Please fill in all fields");
      return;
    }

    // Validate dates - convert to UTC for comparison
    const startTimeUTC = toUTC(formData.startTime);
    const endTimeUTC = toUTC(formData.endTime);
    const linkExpiryUTC = toUTC(formData.linkExpiry);
    const nowUTC = new Date().toISOString();

    if (startTimeUTC <= nowUTC) {
      showError("Start time must be in the future");
      return;
    }

    if (endTimeUTC <= startTimeUTC) {
      showError("End time must be after start time");
      return;
    }

    if (linkExpiryUTC <= startTimeUTC) {
      showError("Link expiry must be after start time");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/lectures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: formData.courseId,
          startTime: startTimeUTC,
          endTime: endTimeUTC,
          linkExpiry: linkExpiryUTC,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create lecture");
      }

      await response.json();
      showSuccess("Lecture attendance created successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error creating lecture:", error);
      showError(
        error instanceof Error ? error.message : "Failed to create lecture"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Set default times using the time utility
  const setDefaultTimes = () => {
    const { startTime, endTime } = getDefaultTimes(1, 2);
    const now = new Date();
    const linkExpiryDate = new Date(now.getTime() + 3.5 * 60 * 60 * 1000); // 30 mins after end
    const linkExpiry = toDateTimeLocalFormat(linkExpiryDate.toISOString());

    setFormData((prev) => ({
      ...prev,
      startTime,
      endTime,
      linkExpiry,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FiCalendar className="mr-2 text-blue-600" />
            Create Lecture Attendance
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiBookOpen className="inline mr-1 h-4 w-4" />
              Course *
            </label>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Setup Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={setDefaultTimes}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Set default times (1 hour from now)
            </button>
          </div>

          {/* Time Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiClock className="inline mr-1 h-4 w-4" />
                Start Time *
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                When the lecture begins
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiClock className="inline mr-1 h-4 w-4" />
                End Time *
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                When the lecture ends
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiClock className="inline mr-1 h-4 w-4" />
                Link Expiry *
              </label>
              <input
                type="datetime-local"
                name="linkExpiry"
                value={formData.linkExpiry}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                When attendance link expires (must be after start time)
              </p>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              How it works:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Students can mark attendance only after the start time</li>
              <li>
                • The attendance link expires at the specified time (must be
                after start time)
              </li>
              <li>• Each lecture gets a unique, one-time use link</li>
              <li>• Students must be registered for the course to attend</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Lecture"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLectureModal;
