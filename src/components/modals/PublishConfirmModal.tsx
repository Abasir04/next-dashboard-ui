"use client";

import React from "react";
import { FiCheckCircle, FiX } from "react-icons/fi";

interface PublishConfirmModalProps {
  isOpen: boolean;
  isPublished: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function PublishConfirmModal({
  isOpen,
  isPublished,
  onClose,
  onConfirm,
  loading = false,
}: PublishConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner ${
              isPublished
                ? "bg-orange-100 text-orange-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            {isPublished ? <FiX size={22} /> : <FiCheckCircle size={22} />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {isPublished ? "Unpublish Test" : "Publish Test"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {isPublished
                ? "Are you sure you want to unpublish this test? Students will no longer be able to take it."
                : "Are you sure you want to publish this test? Students with the link will be able to take it."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Close"
            disabled={loading}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white disabled:opacity-50 ${
              isPublished
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={loading}
          >
            {loading
              ? isPublished
                ? "Unpublishing..."
                : "Publishing..."
              : isPublished
              ? "Unpublish"
              : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
