"use client";
import { usePathname, useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import React from "react";

interface ClientBackButtonProps {
  showOn: string | string[];
  backTo: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { btn: 32, icon: 14 },
  md: { btn: 40, icon: 20 },
  lg: { btn: 56, icon: 28 },
};

export default function ClientBackButton({
  showOn,
  backTo,
  size = "md",
}: ClientBackButtonProps) {
  const pathname = usePathname();
  const router = useRouter();

  const showPaths = Array.isArray(showOn) ? showOn : [showOn];
  if (!showPaths.includes(pathname)) return null;

  const { btn, icon } = sizeMap[size] || sizeMap.md;

  return (
    <button
      onClick={() => router.push(backTo)}
      style={{
        position: "absolute",
        top: 24,
        left: 24,
        zIndex: 1000,
        background: "rgba(255,255,255,0.7)",
        border: "none",
        borderRadius: "50%",
        width: btn,
        height: btn,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        cursor: "pointer",
      }}
      aria-label="Back"
    >
      <FaArrowLeft size={icon} color="#333" />
    </button>
  );
}
