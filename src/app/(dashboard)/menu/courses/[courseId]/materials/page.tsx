"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { showError, showSuccess } from "@/lib/toast";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import {
  FiUpload,
  FiDownload,
  FiTrash2,
  FiArrowLeft,
  FiFile,
  FiVideo,
  FiFileText,
  FiCalendar,
  FiUser,
  FiCheck,
  FiX,
} from "react-icons/fi";

interface CourseMaterial {
  id: number;
  fileUrl: string;
  fileType: string;
  originalFilename: string;
  createdAt: string;
  lecturer: {
    name: string;
    email: string;
  };
}

interface Course {
  id: number;
  name: string;
  code: string;
  level: number;
}

const CourseMaterialsPage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  // Bulk operations state
  const [selectedMaterials, setSelectedMaterials] = useState<Set<number>>(
    new Set()
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "single" | "bulk";
    materialId?: number;
    materialName?: string;
  } | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  const fetchCourse = useCallback(async () => {
    try {
      const response = await fetch("/api/courses");
      if (response.ok) {
        const courses = await response.json();
        const foundCourse = courses.find(
          (c: Course) => c.id === parseInt(courseId)
        );
        setCourse(foundCourse || null);
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    }
  }, [courseId]);

  const fetchMaterials = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/materials`);
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      } else {
        showError("Failed to load course materials");
      }
    } catch (error) {
      showError("Failed to load course materials");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchUserRole();
    fetchCourse();
    fetchMaterials();
  }, [courseId, fetchCourse, fetchMaterials]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const lower = file.name.toLowerCase();
      const isVideo =
        lower.includes(".mp4") ||
        lower.includes(".avi") ||
        lower.includes(".mov") ||
        lower.includes(".wmv") ||
        lower.includes(".flv") ||
        lower.includes(".webm") ||
        lower.includes(".mkv");

      const maxDocSize = 50 * 1024 * 1024; // 50MB via S3/Backblaze
      const maxVideoSize = 100 * 1024 * 1024; // 100MB via S3/Backblaze

      if (
        (!isVideo && file.size > maxDocSize) ||
        (isVideo && file.size > maxVideoSize)
      ) {
        showError(
          isVideo
            ? "Video size too large. Maximum is 100MB."
            : "Document size too large. Maximum is 10MB."
        );
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showError("Please select a file to upload");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`/api/courses/${courseId}/materials`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setMaterials([data.material, ...materials]);
        setSelectedFile(null);
        showSuccess("File uploaded successfully");
        // Reset file input
        const fileInput = document.getElementById(
          "file-input"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const error = await response.json();
        showError(error.error || "Failed to upload file");
      }
    } catch (error) {
      showError("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // Bulk selection functions
  const handleSelectAll = () => {
    if (selectedMaterials.size === materials.length) {
      setSelectedMaterials(new Set());
    } else {
      setSelectedMaterials(new Set(materials.map((m) => m.id)));
    }
  };

  const handleSelectMaterial = (materialId: number) => {
    const newSelected = new Set(selectedMaterials);
    if (newSelected.has(materialId)) {
      newSelected.delete(materialId);
    } else {
      newSelected.add(materialId);
    }
    setSelectedMaterials(newSelected);
  };

  const handleDeleteClick = (materialId: number, materialName: string) => {
    setDeleteTarget({
      type: "single",
      materialId,
      materialName,
    });
    setShowDeleteModal(true);
  };

  const handleBulkDeleteClick = () => {
    setDeleteTarget({
      type: "bulk",
    });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "single" && deleteTarget.materialId) {
      setDeleting(deleteTarget.materialId);
      try {
        const response = await fetch(
          `/api/courses/${courseId}/materials/${deleteTarget.materialId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setMaterials(
            materials.filter((m) => m.id !== deleteTarget.materialId)
          );
          showSuccess("Material deleted successfully");
        } else {
          const error = await response.json();
          showError(error.error || "Failed to delete material");
        }
      } catch (error) {
        showError("Failed to delete material");
      } finally {
        setDeleting(null);
      }
    } else if (deleteTarget.type === "bulk") {
      setBulkDeleting(true);
      try {
        const deletePromises = Array.from(selectedMaterials).map((materialId) =>
          fetch(`/api/courses/${courseId}/materials/${materialId}`, {
            method: "DELETE",
          })
        );

        const responses = await Promise.all(deletePromises);
        const failedDeletes = responses.filter((response) => !response.ok);

        if (failedDeletes.length === 0) {
          setMaterials(materials.filter((m) => !selectedMaterials.has(m.id)));
          setSelectedMaterials(new Set());
          showSuccess(
            `${selectedMaterials.size} materials deleted successfully`
          );
        } else {
          showError(`Failed to delete ${failedDeletes.length} materials`);
        }
      } catch (error) {
        showError("Failed to delete materials");
      } finally {
        setBulkDeleting(false);
      }
    }

    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleDownload = async (material: CourseMaterial) => {
    try {
      // Call the download API with material ID
      const response = await fetch(
        `/api/courses/${courseId}/materials/${material.id}/download`
      );

      if (response.ok) {
        const data = await response.json();
        // Open the signed URL in a new tab for download
        window.open(data.url, "_blank");
      } else {
        // Fallback to direct URL if API fails
        window.open(material.fileUrl, "_blank");
      }
    } catch (error) {
      console.error("Error generating download URL:", error);
      // Fallback to direct URL on error
      window.open(material.fileUrl, "_blank");
    }
  };

  const getFileIcon = (fileType: string) => {
    return fileType === "video" ? (
      <FiVideo className="text-red-500" />
    ) : (
      <FiFileText className="text-blue-500" />
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading course materials...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Course not found</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/menu/courses")}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Back to Courses"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Course Materials
            </h1>
            <p className="text-gray-600">
              {course.name} ({course.code}) - Level {course.level}
            </p>
          </div>
        </div>
      </div>

      {/* UPLOAD SECTION */}
      {(userRole === "admin" || userRole === "lecturer") && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Upload New Material
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                id="file-input"
                type="file"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT (≤50MB), MP4,
                AVI, MOV, WMV, FLV, WEBM, MKV (≤100MB)
              </p>
            </div>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FiUpload size={16} />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MATERIALS LIST */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Course Materials ({materials.length})
            </h2>
            {(userRole === "admin" || userRole === "lecturer") &&
              materials.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    {selectedMaterials.size === materials.length ? (
                      <>
                        <FiX size={16} />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <FiCheck size={16} />
                        Select All
                      </>
                    )}
                  </button>
                  {selectedMaterials.size > 0 && (
                    <button
                      onClick={handleBulkDeleteClick}
                      disabled={bulkDeleting}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    >
                      <FiTrash2 size={16} />
                      Delete Selected ({selectedMaterials.size})
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>

        {materials.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiFile size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No materials uploaded yet</p>
            {(userRole === "admin" || userRole === "lecturer") && (
              <p className="text-sm">
                Upload your first material using the form above
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {materials.map((material) => (
              <div
                key={material.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  selectedMaterials.has(material.id) ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(userRole === "admin" || userRole === "lecturer") && (
                      <input
                        type="checkbox"
                        checked={selectedMaterials.has(material.id)}
                        onChange={() => handleSelectMaterial(material.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    )}
                    {getFileIcon(material.fileType)}
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {material.originalFilename}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiCalendar size={14} />
                          {formatDate(material.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiUser size={14} />
                          {material.lecturer.name}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {material.fileType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(material)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Download"
                    >
                      <FiDownload size={16} />
                    </button>
                    {(userRole === "admin" || userRole === "lecturer") && (
                      <button
                        onClick={() =>
                          handleDeleteClick(
                            material.id,
                            material.originalFilename
                          )
                        }
                        disabled={deleting === material.id}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === material.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <FiTrash2 size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={
          deleteTarget?.type === "bulk"
            ? "Delete Selected Materials"
            : "Delete Material"
        }
        message={
          deleteTarget?.type === "bulk"
            ? "Are you sure you want to delete the selected materials? This action cannot be undone."
            : "Are you sure you want to delete this material? This action cannot be undone."
        }
        itemName={deleteTarget?.materialName}
        isDeleting={
          deleteTarget?.type === "single"
            ? deleting === deleteTarget.materialId
            : bulkDeleting
        }
        isBulk={deleteTarget?.type === "bulk"}
        itemCount={
          deleteTarget?.type === "bulk" ? selectedMaterials.size : undefined
        }
      />
    </div>
  );
};

export default CourseMaterialsPage;
