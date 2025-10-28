"use client";

import React, { useState, useEffect } from "react";
import { FiX, FiCalendar, FiClock, FiBookOpen } from "react-icons/fi";
import { showError, showSuccess } from "@/lib/toast";
import { toUTC } from "@/lib/time";

interface Course {
  id: number;
  name: string;
  code: string;
}

interface CreateLectureModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Duration options for lectures (in minutes)
const LECTURE_DURATION_OPTIONS = [
  { value: "60", label: "1 hour" },
  { value: "90", label: "1 hour 30 minutes" },
  { value: "120", label: "2 hours" },
  { value: "150", label: "2 hours 30 minutes" },
  { value: "180", label: "3 hours" },
  { value: "240", label: "4 hours" },
];

// Link expiry options (in minutes)
const LINK_EXPIRY_OPTIONS = [
  { value: "6", label: "6 minutes" },
  { value: "10", label: "10 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "20", label: "20 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
];

const CreateLectureModal: React.FC<CreateLectureModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    courseId: "",
    startTime: "",
    duration: "",
    linkExpiryDuration: "",
    endTime: "",
    linkExpiry: "",
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Auto-calculate end time when start time or duration changes
  useEffect(() => {
    if (formData.startTime && formData.duration) {
      const start = new Date(formData.startTime);
      const minutes = parseInt(formData.duration);
      const end = new Date(start.getTime() + minutes * 60000);
      setFormData((prev) => ({
        ...prev,
        endTime: formatDateTimeLocal(end),
      }));
    }
  }, [formData.startTime, formData.duration]);

  // Auto-calculate link expiry when start time or link expiry duration changes
  useEffect(() => {
    if (formData.startTime && formData.linkExpiryDuration) {
      const start = new Date(formData.startTime);
      const minutes = parseInt(formData.linkExpiryDuration);
      const expiry = new Date(start.getTime() + minutes * 60000);
      setFormData((prev) => ({
        ...prev,
        linkExpiry: formatDateTimeLocal(expiry),
      }));
    }
  }, [formData.startTime, formData.linkExpiryDuration]);

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
      !formData.duration ||
      !formData.linkExpiryDuration
    ) {
      showError("Please fill in all fields");
      return;
    }

    // Validate dates - convert to UTC for comparison
    const startTimeUTC = toUTC(formData.startTime);
    const endTimeUTC = toUTC(formData.endTime);
    const linkExpiryUTC = toUTC(formData.linkExpiry);

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

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiClock className="inline mr-1 h-4 w-4" />
              Start Date & Time *
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
              When the lecture begins (can be in the past)
            </p>
          </div>

          {/* Duration and Link Expiry Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiClock className="inline mr-1 h-4 w-4" />
                  Lecture Duration *
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select duration</option>
                  {LECTURE_DURATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  How long the lecture will run
                </p>
              </div>

              {/* Auto-calculated End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculated from start time + duration
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiClock className="inline mr-1 h-4 w-4" />
                  Link Duration *
                </label>
                <select
                  name="linkExpiryDuration"
                  value={formData.linkExpiryDuration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select link duration</option>
                  {LINK_EXPIRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  How long the attendance link will be valid
                </p>
              </div>

              {/* Auto-calculated Link Expiry Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.linkExpiry}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculated from start time + link duration
                </p>
              </div>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              How it works:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Set the start time (can be in the past for late entries)
              </li>
              <li>• Choose the lecture duration and link expiry time</li>
              <li>• End time and link expiry are automatically calculated</li>
              <li>
                • Students can mark attendance within the link expiry window
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
