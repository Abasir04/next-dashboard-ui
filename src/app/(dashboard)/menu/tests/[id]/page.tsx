"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import InputField from "@/components/InputField";
import Table from "@/components/Table";

interface Test {
  id: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  shareToken: string;
  allowViewScore: boolean;
  timeLimit?: number;
  startDate: string;
  dueDate: string;
  course: {
    id: number;
    name: string;
    code: string;
  };
  level: {
    id: number;
    name: string;
  };
  lecturer: {
    id: number;
    name: string;
    email: string;
  };
  questions: Array<{
    id: number;
    question: string;
    type: string;
    options: string[];
    correct: string[];
    required: boolean;
    points: number;
    order: number;
  }>;
  _count: {
    responses: number;
  };
}

interface TestResponse {
  id: number;
  score?: number;
  submittedAt: string;
  timeSpent?: number;
  student: {
    id: number;
    name: string;
    email: string;
    matricNumber: string;
  };
}

export default function TestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [responses, setResponses] = useState<TestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"edit" | "responses">("edit");
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    fetchTest();
    fetchResponses();
  }, [params.id]);

  const fetchTest = async () => {
    try {
      const response = await fetch(`/api/tests/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch test");

      const data = await response.json();
      setTest(data);
      reset({
        title: data.title,
        description: data.description || "",
        timeLimit: data.timeLimit || "",
        startDate: data.startDate
          ? new Date(data.startDate).toISOString().slice(0, 16)
          : "",
        dueDate: data.dueDate
          ? new Date(data.dueDate).toISOString().slice(0, 16)
          : "",
        allowViewScore: data.allowViewScore,
        isPublished: data.isPublished,
      });
    } catch (error) {
      console.error("Error fetching test:", error);
      toast.error("Failed to fetch test");
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async () => {
    try {
      const response = await fetch(`/api/tests/${params.id}/responses`);
      if (!response.ok) throw new Error("Failed to fetch responses");

      const data = await response.json();
      setResponses(data);
    } catch (error) {
      console.error("Error fetching responses:", error);
      toast.error("Failed to fetch responses");
    }
  };

  const onSubmit = async (data: any) => {
    if (!test) return;

    try {
      const response = await fetch(`/api/tests/${test.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          timeLimit: data.timeLimit ? parseInt(data.timeLimit) : null,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update test");

      toast.success("Test updated successfully");
      fetchTest();
      setEditing(false);
    } catch (error) {
      console.error("Error updating test:", error);
      toast.error("Failed to update test");
    }
  };

  const copyShareLink = () => {
    if (!test) return;
    const link = `${window.location.origin}/test/${test.shareToken}`;
    navigator.clipboard.writeText(link);
    toast.success("Share link copied to clipboard");
  };

  const handlePublish = async () => {
    if (!test) return;

    try {
      const response = await fetch(`/api/tests/${test.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...test, isPublished: !test.isPublished }),
      });

      if (!response.ok) throw new Error("Failed to update test");

      toast.success(
        `Test ${test.isPublished ? "unpublished" : "published"} successfully`
      );
      fetchTest();
    } catch (error) {
      console.error("Error updating test:", error);
      toast.error("Failed to update test");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  if (!test) {
    return <div className="text-center text-red-600">Test not found</div>;
  }

  const responseColumns = [
    { header: "Student", accessor: "student" },
    { header: "Matric Number", accessor: "matricNumber" },
    { header: "Score", accessor: "score" },
    { header: "Submitted At", accessor: "submittedAt" },
    { header: "Time Spent", accessor: "timeSpent" },
  ];

  const renderResponseRow = (response: TestResponse) => (
    <tr key={response.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {response.student.name}
        </div>
        <div className="text-sm text-gray-500">{response.student.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {response.student.matricNumber}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">
          {response.score !== null && response.score !== undefined
            ? `${response.score.toFixed(1)}%`
            : "Not graded"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(response.submittedAt).toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {response.timeSpent ? `${response.timeSpent} min` : "N/A"}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <button
            onClick={copyShareLink}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Copy Share Link
          </button>
          <button
            onClick={handlePublish}
            className={`px-4 py-2 rounded-md ${
              test.isPublished
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {test.isPublished ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("edit")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "edit"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Test Details
            </button>
            <button
              onClick={() => setActiveTab("responses")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "responses"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Responses ({responses.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "edit" ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  Test Information
                </h2>
                <button
                  onClick={() => setEditing(!editing)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  {editing ? "Cancel" : "Edit"}
                </button>
              </div>

              {editing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Test Title"
                      name="title"
                      register={register}
                      error={errors.title as any}
                      inputProps={{ required: true }}
                    />
                    <InputField
                      label="Time Limit (minutes)"
                      name="timeLimit"
                      type="number"
                      register={register}
                      error={errors.timeLimit as any}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Start Date & Time"
                      name="startDate"
                      type="datetime-local"
                      register={register}
                      error={errors.startDate as any}
                      inputProps={{ required: true }}
                    />
                    <InputField
                      label="Due Date & Time"
                      name="dueDate"
                      type="datetime-local"
                      register={register}
                      error={errors.dueDate as any}
                      inputProps={{ required: true }}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      {...register("allowViewScore")}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Allow students to view their score
                    </label>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{test.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Time Limit
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {test.timeLimit
                          ? `${test.timeLimit} minutes`
                          : "No limit"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Course
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {test.course.name} ({test.course.code})
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Level
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {test.level.name}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {test.description || "No description"}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(test.startDate).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Due Date
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(test.dueDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            test.isPublished
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {test.isPublished ? "Published" : "Draft"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Questions ({test.questions.length})
                </h3>
                <div className="space-y-4">
                  {test.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-gray-700">
                          Question {index + 1} -{" "}
                          {question.type.replace("_", " ")}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {question.points} point(s)
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-2">
                        {question.question}
                      </p>
                      {question.options.length > 0 && (
                        <div className="space-y-1">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type={
                                  question.type === "MULTIPLE_CHOICE"
                                    ? "radio"
                                    : "checkbox"
                                }
                                disabled
                                checked={question.correct.includes(option)}
                                className="h-4 w-4 text-indigo-600"
                              />
                              <span className="text-sm text-gray-700">
                                {option}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Student Responses
              </h2>
              {responses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No responses yet
                </div>
              ) : (
                <Table
                  columns={responseColumns}
                  data={responses}
                  renderRow={renderResponseRow}
                  emptyMessage="No responses found"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
