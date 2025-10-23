"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FiBook,
  FiArrowLeft,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { useParams } from "next/navigation";
import Table from "@/components/Table";
import TableSearchWithRefresh from "@/components/TableSearchWithRefresh";

interface Course {
  id: number;
  name: string;
  code: string;
  level: number;
  studentCount: number;
  materialsCount?: number;
  lecturer: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const columns = [
  {
    header: "Course Name",
    accessor: "name",
  },
  {
    header: "Course Code",
    accessor: "code",
  },
  {
    header: "Lecturer",
    accessor: "lecturer",
  },
  {
    header: "Students",
    accessor: "students",
  },
  {
    header: "Materials",
    accessor: "materials",
  },
  {
    header: "Created",
    accessor: "createdAt",
    className: "hidden md:table-cell",
  },
];

const LevelCoursesPage = () => {
  const params = useParams();
  const levelId = params.levelId as string;
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelName, setLevelName] = useState("");

  const fetchLevelCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/levels/${levelId}/courses`);

      if (!response.ok) {
        throw new Error("Failed to fetch level courses");
      }

      const data = await response.json();
      setCourses(data.courses || []);
      setLevelName(data.levelName || "");
    } catch (error) {
      console.error("Error fetching level courses:", error);
      toast.error("Failed to fetch level courses");
    } finally {
      setLoading(false);
    }
  }, [levelId]);

  useEffect(() => {
    if (levelId) {
      fetchLevelCourses();
    }
  }, [levelId, fetchLevelCourses]);

  const handleRefresh = () => {
    fetchLevelCourses();
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.lecturer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderRow = (course: Course) => (
    <tr
      key={course.id}
      className="text-center border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4 font-medium text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-lamaYellow to-orange-500 rounded-full flex items-center justify-center shadow-md">
            <FiBook className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">{course.name}</div>
            <div className="text-xs text-gray-500">Level {course.level}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-800">
          {course.code}
        </span>
      </td>
      <td className="p-4 text-left">
        <div className="text-sm text-gray-600">{course.lecturer.name}</div>
        <div className="text-xs text-gray-500">{course.lecturer.email}</div>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {course.studentCount} students
        </span>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {course.materialsCount ?? 0} materials
        </span>
      </td>
      <td className="hidden md:table-cell p-4 text-gray-500">
        {new Date(course.createdAt).toLocaleDateString()}
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
        <div className="flex items-center gap-4">
          <Link
            href="/menu/levels"
            className="p-2 text-gray-600 hover:text-lamaSky hover:bg-lamaSky/10 rounded-md transition-colors"
            title="Back to levels"
          >
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              Courses in {levelName} ({filteredCourses.length})
            </h1>
            <p className="text-sm text-gray-600">
              All courses available in this level
            </p>
          </div>
        </div>
        <TableSearchWithRefresh
          value={searchTerm}
          onChange={setSearchTerm}
          onRefresh={handleRefresh}
          placeholder="Search courses by name, code, or lecturer..."
          isLoading={loading}
        />
      </div>

      {/* COURSES TABLE */}
      <Table
        columns={columns}
        renderRow={renderRow}
        data={filteredCourses}
        emptyMessage="No courses found in this level"
      />
    </div>
  );
};

export default LevelCoursesPage;
