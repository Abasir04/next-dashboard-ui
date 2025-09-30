"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FiEye, FiUsers, FiBook, FiUser } from "react-icons/fi";
import { showError } from "@/lib/toast";
import Link from "next/link";
import Table from "@/components/Table";
import TableSearchWithRefresh from "@/components/TableSearchWithRefresh";

interface Level {
  id: number;
  name: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  students: { id: number }[];
  lecturerLevels: {
    lecturer: {
      id: number;
      name: string;
      email: string;
      title: string;
    };
  }[];
  _count: {
    students: number;
    lecturerLevels: number;
    assignments: number;
    exams: number;
    events: number;
    announcements: number;
  };
  courseCount: number;
  lecturersTeachingLevel: number;
}

const columns = [
  {
    header: "Level Name",
    accessor: "name",
  },
  {
    header: "Capacity",
    accessor: "capacity",
  },
  {
    header: "Students",
    accessor: "students",
  },
  // {
  //   header: "Lecturers",
  //   accessor: "lecturers",
  // },
  {
    header: "Courses",
    accessor: "courses",
  },
  {
    header: "Events",
    accessor: "events",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const LevelsPage = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLevels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/levels");
      const data = await response.json();
      if (response.ok) {
        setLevels(data.levels);
      } else {
        showError(data.error || "Failed to fetch levels");
      }
    } catch (error) {
      console.error("Error fetching levels:", error);
      showError("Failed to fetch levels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const handleRefresh = () => {
    fetchLevels();
  };

  const filteredLevels = levels.filter((level) =>
    level.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderRow = (level: Level) => (
    <tr
      key={level.id}
      className="text-center border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4 font-medium text-left">
        <div className="flex items-center justify-center gap-3">
          <div className="w-7 h-7 bg-gradient-to-br from-lamaSky to-blue-600 rounded-full flex items-center justify-center shadow-md">
            <FiBook className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-800 text-base">
              {level.name}
            </div>
            <div className="text-xs text-gray-500">
              Created {new Date(level.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {level.capacity} students
        </span>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {level._count.students} students
        </span>
      </td>
      {/* <td className="p-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {level.lecturersTeachingLevel} lecturers
        </span>
      </td> */}
      <td className="p-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {level.courseCount} courses
        </span>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {level._count.events} events
        </span>
      </td>
      <td className="p-4">
        <div className="flex justify-center gap-2">
          <Link
            href={`/menu/levels/${level.id}/students`}
            className="p-2 text-blue-600 hover:text-lamaSkyDark hover:bg-lamaSky/10 rounded-md transition-colors"
            title="View students in this level"
          >
            <FiUsers size={16} />
          </Link>
          <Link
            href={`/menu/levels/${level.id}/courses`}
            className="p-2 text-yellow-600 hover:text-orange-600 hover:bg-lamaYellow/10 rounded-md transition-colors"
            title="View courses for this level"
          >
            <FiBook size={16} />
          </Link>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 mt-0">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lamaSky"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          Levels ({filteredLevels.length})
        </h1>
        <TableSearchWithRefresh
          value={searchTerm}
          onChange={setSearchTerm}
          onRefresh={handleRefresh}
          placeholder="Search levels by name..."
          isLoading={loading}
        />
      </div>

      {/* LEVELS TABLE */}
      <Table
        columns={columns}
        renderRow={renderRow}
        data={filteredLevels}
        emptyMessage="No levels found"
      />
    </div>
  );
};

export default LevelsPage;
