"use client";
import React from "react";
import { FiSearch, FiRefreshCw } from "react-icons/fi";

interface TableSearchWithRefreshProps {
  value?: string;
  onChange?: (value: string) => void;
  onRefresh?: () => void;
  placeholder?: string;
  isLoading?: boolean;
}

const TableSearchWithRefresh = ({
  value,
  onChange,
  onRefresh,
  placeholder = "Search...",
  isLoading = false,
}: TableSearchWithRefreshProps) => {
  return (
    <div className="flex items-center gap-2">
      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh data"
      >
        <FiRefreshCw
          size={16}
          className={`${isLoading ? "animate-spin" : ""}`}
        />
      </button>

      {/* Search Input */}
      <div className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
        <FiSearch size={14} className="text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>
    </div>
  );
};

export default TableSearchWithRefresh;
