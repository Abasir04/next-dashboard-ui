"use client";

import React, { useState, useEffect } from "react";
import { FiX, FiClock, FiBookOpen, FiUser, FiEdit } from "react-icons/fi";
import { showError, showSuccess } from "@/lib/toast";

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
}

interface EditLectureModalProps {
  lecture: Lecture | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditLectureModal: React.FC<EditLectureModalProps> = ({
  lecture,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    linkExpiry: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lecture) {
      // Set form data with proper datetime-local format (preserving local timezone)
      const startTime = new Date(lecture.startTime);
      const endTime = new Date(lecture.endTime);
      const linkExpiry = new Date(lecture.linkExpiry);

      // Format for datetime-local input while preserving local timezone
      const formatForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        startTime: formatForInput(startTime),
        endTime: formatForInput(endTime),
        linkExpiry: formatForInput(linkExpiry),
      });
    }
  }, [lecture]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lecture) return;

    if (!formData.startTime || !formData.endTime || !formData.linkExpiry) {
      showError("All fields are required");
      return;
    }

    // Validate that link expiry is after start time
    const startTimeDate = new Date(formData.startTime);
    const linkExpiryDate = new Date(formData.linkExpiry);

    if (linkExpiryDate <= startTimeDate) {
      showError("Link expiry must be after start time");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/lectures/${lecture.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update lecture");
      }

      showSuccess("Lecture updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating lecture:", error);
      showError(
        error instanceof Error ? error.message : "Failed to update lecture"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!lecture) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <FiEdit className="text-orange-600" size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800">
              Edit Lecture
            </h2>
            <p className="text-sm text-gray-600">
              Update lecture timing information
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close modal"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Lecture Info Display */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FiBookOpen className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">Course:</span>
              <span className="text-sm font-medium text-gray-900">
                {lecture.course.name} ({lecture.course.code})
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FiUser className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">Lecturer:</span>
              <span className="text-sm font-medium text-gray-900">
                {lecture.lecturer.name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FiClock className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600">Code:</span>
              <span className="text-sm font-medium text-gray-900 font-mono">
                {lecture.uniqueCode}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <FiClock className="inline mr-1 h-4 w-4" />
              Start Time/Link Start Time
            </label>
            <input
              type="datetime-local"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              When the attendance link becomes active
            </p>
          </div>

          <div>
            <label
              htmlFor="endTime"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <FiClock className="inline mr-1 h-4 w-4" />
              End Time
            </label>
            <input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">When the lecture ends</p>
          </div>

          <div>
            <label
              htmlFor="linkExpiry"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <FiClock className="inline mr-1 h-4 w-4" />
              Link Expiry Time
            </label>
            <input
              type="datetime-local"
              id="linkExpiry"
              name="linkExpiry"
              value={formData.linkExpiry}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              When the attendance link expires (must be after start time)
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-2 bg-gray-400 text-black rounded-md hover:bg-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "Update Lecture"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLectureModal;
