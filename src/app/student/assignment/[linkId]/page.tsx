"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiBook,
  FiUpload,
  FiFile,
  FiCheckCircle,
  FiAlertCircle,
  FiDownload,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { formatLocal } from "@/lib/time";

interface Assignment {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  dueDate: string;
  linkId: string;
  isActive: boolean;
  isExpired: boolean;
  canSubmit: boolean;
  lecturerFileUrl?: string;
  lecturerFileName?: string;
  course: {
    id: number;
    name: string;
    code: string;
  };
  lecturer: {
    id: number;
    name: string;
    title: string;
  };
  level: {
    id: number;
    name: string;
  };
}

const AssignmentSubmissionPage = () => {
  const params = useParams();
  const router = useRouter();
  const linkId = params.linkId as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    matricNumber: "",
    password: "",
  });

  const fetchAssignment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assignments/submit/${linkId}`);

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.message || errorData.error || "Failed to fetch assignment";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setAssignment(data.assignment);
    } catch (error: any) {
      console.error("Error fetching assignment:", error);
      let errorMessage = "Failed to load assignment details";

      if (error.message) {
        errorMessage = error.message;
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.name === "AbortError") {
        errorMessage = "Request was cancelled. Please try again.";
      }

      toast.error(errorMessage);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [linkId, router]);

  useEffect(() => {
    if (linkId) {
      fetchAssignment();
    }
  }, [linkId, fetchAssignment]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDownload = async () => {
    if (!assignment?.lecturerFileUrl) return;

    try {
      // Call the download API with linkId
      const response = await fetch(
        `/api/assignments/submit/${linkId}/download`
      );

      if (response.ok) {
        const data = await response.json();
        // Open the signed URL in a new tab for download
        window.open(data.url, "_blank");
      } else {
        // Fallback to direct URL if API fails
        window.open(assignment.lecturerFileUrl, "_blank");
      }
    } catch (error) {
      console.error("Error generating download URL:", error);
      // Fallback to direct URL on error
      window.open(assignment.lecturerFileUrl, "_blank");
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error("Failed to upload file. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!formData.matricNumber || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);

      // Upload file
      const fileUrl = await uploadFile(selectedFile);

      // Submit assignment
      const response = await fetch(`/api/assignments/submit/${linkId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricNumber: formData.matricNumber,
          password: formData.password,
          fileUrl,
          originalFilename: selectedFile.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.message || errorData.error || "Failed to submit assignment";
        throw new Error(errorMessage);
      }

      setSubmitted(true);
      toast.success("Assignment submitted successfully!");
    } catch (error: any) {
      console.error("Error submitting assignment:", error);
      let errorMessage = "Failed to submit assignment";

      if (error.message) {
        errorMessage = error.message;
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.name === "AbortError") {
        errorMessage = "Request was cancelled. Please try again.";
      }

      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Assignment Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The assignment you&apos;re looking for doesn&apos;t exist or has
            expired.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!assignment.canSubmit) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Submission Not Available
          </h1>
          <p className="text-gray-600 mb-4">
            {assignment.isExpired
              ? "This assignment has expired and is no longer accepting submissions."
              : "This assignment is currently inactive."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Assignment Submitted Successfully!
          </h1>
          <p className="text-gray-600 mb-4">
            Your assignment has been submitted and is under review.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center py-8">
      <div className="w-full max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Left Side - Assignment Details */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Assignment Submission
            </h1>

            {/* Assignment Details */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <FiBook className="mr-3 text-blue-600" />
                {assignment.title}
              </h2>

              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">
                    Course:
                  </span>
                  <span className="text-gray-800">
                    {assignment.course.name} ({assignment.course.code})
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">
                    Lecturer:
                  </span>
                  <span className="text-gray-800">
                    {assignment.lecturer.title} {assignment.lecturer.name}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">Level:</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {assignment.level.name}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">
                    Due Date:
                  </span>
                  <span className="text-gray-800">
                    {formatLocal(assignment.dueDate)}
                  </span>
                </div>

                {assignment.description && (
                  <div className="pt-2 border-t border-blue-200">
                    <span className="font-medium text-gray-600 block mb-2">
                      Description:
                    </span>
                    <p className="text-gray-800 text-sm">
                      {assignment.description}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-blue-200">
                  <span className="font-medium text-gray-600 block mb-2">
                    Assignment File:
                  </span>

                  {assignment.lecturerFileUrl ? (
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      Download{" "}
                      {assignment.lecturerFileName || "Assignment File"}
                    </button>
                  ) : (
                    "No file uploaded by lecturer"
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Submission Form */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Submit Your Assignment
            </h2>
            <p className="text-gray-600 mb-4">
              Fill in your details and upload your assignment file
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> You must be registered for this course to
                submit assignments. If you haven&apos;t registered yet, please
                contact your lecturer for the registration link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Student Authentication */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Matric Number *
                    </label>
                    <input
                      type="text"
                      name="matricNumber"
                      value={formData.matricNumber}
                      onChange={handleInputChange}
                      required
                      pattern="\d{6}"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter 6-digit matric number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment File *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      className="hidden"
                      id="file-upload"
                      required
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <FiUpload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {selectedFile
                          ? selectedFile.name
                          : "Click to upload or drag and drop"}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)
                      </span>
                    </label>
                  </div>
                  {selectedFile && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <FiFile className="h-4 w-4 mr-1" />
                      {selectedFile.name} (
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !selectedFile}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit Assignment"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentSubmissionPage;
