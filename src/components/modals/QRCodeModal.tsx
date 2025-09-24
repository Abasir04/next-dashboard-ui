"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FiX, FiCopy, FiDownload } from "react-icons/fi";
import Image from "next/image";
import QRCode from "qrcode";
import { showSuccess, showError } from "@/lib/toast";

interface QRCodeModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ url, title, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(true);

  const generateQRCode = useCallback(async () => {
    try {
      setIsGenerating(true);
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(qrCodeDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      showError("Failed to generate QR code");
    } finally {
      setIsGenerating(false);
    }
  }, [url]);

  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showSuccess("Link copied to clipboard");
    } catch (error) {
      showError("Failed to copy link");
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement("a");
      link.href = qrCodeDataUrl;
      link.download = `qr-code-${title.replace(/\s+/g, "-").toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess("QR code downloaded");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            QR Code for {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center">
          {isGenerating ? (
            <div className="py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating QR code...</p>
            </div>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
                {qrCodeDataUrl && (
                  <Image
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    width={256}
                    height={256}
                    className="w-64 h-64"
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-2">Attendance Link:</p>
                  <p className="text-sm font-mono text-gray-800 break-all">
                    {url}
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <FiCopy className="h-4 w-4" />
                    <span>Copy Link</span>
                  </button>

                  <button
                    onClick={handleDownloadQR}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <FiDownload className="h-4 w-4" />
                    <span>Download QR</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Instructions:</strong> Students can scan this QR code or
              use the link to mark their attendance. Make sure they are
              registered for the course and present in the lecture venue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
