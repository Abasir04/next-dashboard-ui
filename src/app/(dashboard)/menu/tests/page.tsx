"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiEye,
  FiTrash2,
  FiCalendar,
  FiUsers,
  FiFileText,
  FiLink,
  FiCopy,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import TableSearchWithRefresh from "@/components/TableSearchWithRefresh";
import PublishConfirmModal from "@/components/modals/PublishConfirmModal";

interface Test {
  id: number;
  title: string;
  description?: string;
  isPublished: boolean;
  shareToken: string | null;
  createdAt: string;
  startDate: string;
  dueDate: string;
  timeLimit?: number | null;
  course: {
    id: number;
    name: string;
    code: string;
  };
  level: {
    id: number;
    name: string;
  };
  _count: {
    responses: number;
    questions: number;
  };
}

const TestsPage = () => {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tests?search=${searchTerm}`);
      if (!response.ok) throw new Error("Failed to fetch tests");

      const data = await response.json();
      setTests(data);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error("Failed to fetch tests");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleRefresh = () => {
    fetchTests();
  };

  const handleDelete = (test: Test) => {
    setTestToDelete(test);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!testToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/tests/${testToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete test");

      setTests(tests.filter((t) => t.id !== testToDelete.id));
      toast.success("Test deleted successfully");
    } catch (error) {
      console.error("Error deleting test:", error);
      toast.error("Failed to delete test");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setTestToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setTestToDelete(null);
  };

  const handlePublish = async (test: Test) => {
    try {
      const response = await fetch(`/api/tests/${test.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...test, isPublished: !test.isPublished }),
      });

      if (!response.ok) throw new Error("Failed to update test");

      setTests(
        tests.map((t) =>
          t.id === test.id ? { ...t, isPublished: !t.isPublished } : t
        )
      );
      toast.success(
        `Test ${test.isPublished ? "unpublished" : "published"} successfully`
      );
    } catch (error) {
      console.error("Error updating test:", error);
      toast.error("Failed to update test");
    }
  };

  const handleShowShare = (test: Test) => {
    setSelectedTest(test);
    // Point students to the verification page first
    setShareLink(
      `${window.location.origin}/student/test/verify/${test.shareToken}`
    );
    setShowShareModal(true);
  };

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState<Test | null>(null);
  const openPublish = (test: Test) => {
    setPublishTarget(test);
    setPublishOpen(true);
  };
  const closePublish = () => {
    setPublishOpen(false);
    setPublishTarget(null);
  };
  const [publishing, setPublishing] = useState(false);

  const handleCopyLink = async () => {
    if (shareLink) {
      try {
        await navigator.clipboard.writeText(shareLink);
        toast.success("Share link copied to clipboard!");
      } catch (error) {
        console.error("Error copying link:", error);
        toast.error("Failed to copy link");
      }
    }
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setSelectedTest(null);
    setShareLink(null);
  };

  // Filter tests based on search term
  const filteredTests = tests.filter(
    (test) =>
      test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.level.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Tests ({filteredTests.length})
        </h1>
        <div className="flex items-center gap-4">
          <TableSearchWithRefresh
            value={searchTerm}
            onChange={setSearchTerm}
            onRefresh={handleRefresh}
            placeholder="Search tests by title, description, course, or level..."
            isLoading={loading}
          />
          <button
            onClick={() => router.push("/menu/tests/create")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <FiPlus size={16} />
            Create Test
          </button>
        </div>
      </div>

      {/* TABLE */}
      {filteredTests.length === 0 ? (
        <div className="text-center py-12">
          <FiFileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No tests created yet</p>
          <button
            onClick={() => router.push("/menu/tests/create")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Create Your First Test
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-center text-gray-500 text-sm border-b">
                <th className="pb-3">Test Title</th>
                <th className="pb-3">Course</th>
                <th className="pb-3">Level</th>
                <th className="pb-3">Questions</th>
                <th className="pb-3">Responses</th>
                <th className="pb-3">Start Date</th>
                <th className="pb-3">Time Limit</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test) => (
                <tr
                  key={test.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-4 text-center">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {test.title}
                      </h3>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div>
                      <div className="font-medium text-gray-800">
                        {test.course.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {test.course.code}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div className="font-medium text-gray-800">
                      {test.level.name}
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FiFileText size={14} className="text-gray-400" />
                      <span className="text-gray-600 text-sm">
                        {test._count.questions}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FiUsers size={14} className="text-gray-400" />
                      <span className="text-gray-600 text-sm">
                        {test._count.responses}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FiCalendar size={14} className="text-gray-400" />
                      <div className="text-left">
                        <div className="text-gray-600 text-sm">
                          {new Date(test.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(test.startDate).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-center text-sm text-gray-700">
                    {test.startDate && test.timeLimit
                      ? `${test.timeLimit} min`
                      : "—"}
                  </td>
                  <td className="py-4 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        test.isPublished
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {test.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => router.push(`/menu/tests/${test.id}`)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                        title="View test details"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => openPublish(test)}
                        className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md transition-colors"
                        title={
                          test.isPublished ? "Unpublish test" : "Publish test"
                        }
                      >
                        {test.isPublished ? (
                          <FiX size={16} />
                        ) : (
                          <FiCheckCircle size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => handleShowShare(test)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        title="Share test link"
                      >
                        <FiLink size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(test)}
                        disabled={isDeleting}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                        title="Delete test"
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
      {deleteModalOpen && testToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FiTrash2 className="text-red-600" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                Delete Test
              </h2>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete this test?
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-800">{testToDelete.title}</p>
                <p className="text-sm text-gray-600">
                  Course: {testToDelete.course.name} ({testToDelete.course.code})
                </p>
                <p className="text-sm text-gray-600">
                  Level: {testToDelete.level.name}
                </p>
              </div>
              <p className="text-sm text-red-600 mt-2">
                This action cannot be undone. All responses will also be deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete Test"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE LINK MODAL */}
      {showShareModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FiLink className="text-blue-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  Test Share Link
                </h3>
                <p className="text-sm text-gray-600">
                  Share this link with students
                </p>
              </div>
              <button
                onClick={handleCloseShareModal}
                className="text-gray-400 hover:text-gray-600"
                title="Close modal"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  {selectedTest.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedTest.description || "No description"}
                </p>
                <p className="text-sm text-gray-600">
                  Questions: {selectedTest._count.questions} | Responses:{" "}
                  {selectedTest._count.responses}
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600 mb-2">Share Link:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareLink || ""}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Copy link"
                    >
                      <FiCopy size={16} />
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Students need to be authenticated to
                    take the test.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseShareModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH CONFIRM MODAL */}
      <PublishConfirmModal
        isOpen={publishOpen && !!publishTarget}
        isPublished={!!publishTarget?.isPublished}
        loading={publishing}
        onClose={() => {
          if (!publishing) closePublish();
        }}
        onConfirm={async () => {
          if (!publishTarget) return;
          try {
            setPublishing(true);
            await handlePublish(publishTarget);
            closePublish();
          } finally {
            setPublishing(false);
          }
        }}
      />
    </div>
  );
};

export default TestsPage;
