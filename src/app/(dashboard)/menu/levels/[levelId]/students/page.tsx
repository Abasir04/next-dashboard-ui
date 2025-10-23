"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FiUser, FiArrowLeft } from "react-icons/fi";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { useParams } from "next/navigation";
import Table from "@/components/Table";
import TableSearchWithRefresh from "@/components/TableSearchWithRefresh";

interface Student {
  id: number;
  matricNumber: string;
  name: string;
  email: string;
  phone: string;
  grade: number;
  levelId: number;
  address: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  role: string;
  title: string;
  level: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  courses: Array<{
    id: number;
    name: string;
    code: string;
  }>;
}

const columns = [
  {
    header: "Student Name",
    accessor: "name",
  },
  {
    header: "Matric Number",
    accessor: "matricNumber",
  },
  {
    header: "Email",
    accessor: "email",
  },
  {
    header: "Phone",
    accessor: "phone",
  },
  {
    header: "Courses",
    accessor: "courses",
  },
];

const LevelStudentsPage = () => {
  const params = useParams();
  const levelId = params.levelId as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelName, setLevelName] = useState("");

  const fetchLevelStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/levels/${levelId}/students`);

      if (!response.ok) {
        throw new Error("Failed to fetch level students");
      }

      const data = await response.json();
      setStudents(data.students || []);
      setLevelName(data.levelName || "");
    } catch (error) {
      console.error("Error fetching level students:", error);
      toast.error("Failed to fetch level students");
    } finally {
      setLoading(false);
    }
  }, [levelId]);

  useEffect(() => {
    if (levelId) {
      fetchLevelStudents();
    }
  }, [levelId, fetchLevelStudents]);

  const handleRefresh = () => {
    fetchLevelStudents();
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.courses.some(
        (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const renderRow = (student: Student) => (
    <tr
      key={student.id}
      className="text-center border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4 font-medium text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-lamaSky to-blue-600 rounded-full flex items-center justify-center shadow-md">
            <FiUser className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">{student.name}</div>
            <div className="text-xs text-gray-500">{student.title}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-800">
          {student.matricNumber}
        </span>
      </td>
      <td className="p-4 text-left">
        <div className="text-sm text-gray-600">{student.email}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-gray-600">{student.phone}</div>
      </td>
      <td className="p-4">
        <div className="flex flex-wrap gap-1 justify-center">
          {student.courses.slice(0, 2).map((course) => (
            <span
              key={course.id}
              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium"
            >
              {course.code}
            </span>
          ))}
          {student.courses.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
              +{student.courses.length - 2}
            </span>
          )}
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
              Students in {levelName} Level ({filteredStudents.length})
            </h1>
            <p className="text-sm text-gray-600">
              All students enrolled in this level
            </p>
          </div>
        </div>
        <TableSearchWithRefresh
          value={searchTerm}
          onChange={setSearchTerm}
          onRefresh={handleRefresh}
          placeholder="Search students by name, matric number, or course..."
          isLoading={loading}
        />
      </div>

      {/* STUDENTS TABLE */}
      <Table
        columns={columns}
        renderRow={renderRow}
        data={filteredStudents}
        emptyMessage="No students found in this level"
      />
    </div>
  );
};

export default LevelStudentsPage;
