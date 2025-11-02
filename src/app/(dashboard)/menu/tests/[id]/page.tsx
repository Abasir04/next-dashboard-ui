"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import PublishConfirmModal from "@/components/modals/PublishConfirmModal";
import Table from "@/components/Table";
import { toUTC, toDateTimeLocalFormat } from "@/lib/time";

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

interface Question {
  id: string;
  question: string;
  type: "SHORT_ANSWER" | "PARAGRAPH" | "MULTIPLE_CHOICE" | "CHECKBOX";
  options: string[];
  correct: string[];
  required: boolean;
  points: number;
}

interface Course {
  id: number;
  name: string;
  code: string;
  level: {
    id: number;
    name: string;
  };
}

interface TestFormInputs {
  title: string;
  description: string;
  courseId: string;
  levelId: string;
  startDate: string;
  dueDate: string;
  timeLimit: string;
  allowViewScore: boolean;
}

const TIME_LIMIT_OPTIONS = [
  { value: "5", label: "5 minutes" },
  { value: "10", label: "10 minutes" },
  { value: "20", label: "20 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1 hour 30 minutes" },
];

export default function TestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [responses, setResponses] = useState<TestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"edit" | "responses">("edit");
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors: _errors },
    reset,
    watch,
    setValue,
  } = useForm<TestFormInputs>({
    defaultValues: {
      title: "",
      description: "",
      courseId: "",
      levelId: "",
      startDate: "",
      dueDate: "",
      timeLimit: "",
      allowViewScore: true,
    },
  });

  const courseId = watch("courseId");
  const startDate = watch("startDate");
  const timeLimit = watch("timeLimit");

  useEffect(() => {
    fetchTest();
    fetchResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Fetch lecturer's courses for editing
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/lecturers/courses", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to fetch courses");
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Failed to fetch courses");
      }
    };
    fetchCourses();
  }, []);

  // Update level when course changes
  useEffect(() => {
    if (courseId) {
      const course = courses.find((c) => c.id.toString() === courseId);
      if (course) {
        setSelectedCourse(course);
        setValue("levelId", course.level.id.toString());
      }
    } else {
      setSelectedCourse(null);
      setValue("levelId", "");
    }
  }, [courseId, courses, setValue]);

  // Auto-calc due date from start + timeLimit
  useEffect(() => {
    if (startDate && timeLimit) {
      const start = new Date(startDate);
      const minutes = parseInt(timeLimit);
      const due = new Date(start.getTime() + minutes * 60000);
      const year = due.getFullYear();
      const month = String(due.getMonth() + 1).padStart(2, "0");
      const day = String(due.getDate()).padStart(2, "0");
      const hours = String(due.getHours()).padStart(2, "0");
      const minutesStr = String(due.getMinutes()).padStart(2, "0");
      setValue("dueDate", `${year}-${month}-${day}T${hours}:${minutesStr}`);
    }
  }, [startDate, timeLimit, setValue]);

  const fetchTest = async () => {
    try {
      const response = await fetch(`/api/tests/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch test");

      const data = await response.json();
      setTest(data);
      reset({
        title: data.title,
        description: data.description || "",
        timeLimit: data.timeLimit ? String(data.timeLimit) : "",
        startDate: data.startDate ? toDateTimeLocalFormat(data.startDate) : "",
        dueDate: data.dueDate ? toDateTimeLocalFormat(data.dueDate) : "",
        allowViewScore: data.allowViewScore,
        courseId: data.course?.id ? String(data.course.id) : "",
        levelId: data.level?.id ? String(data.level.id) : "",
      });
      setQuestions(
        (data.questions || []).map((q: any) => ({
          id: String(q.id),
          question: q.question,
          type: q.type,
          options: q.options || [],
          correct: q.correct || [],
          required: q.required,
          points: q.points ?? 1,
        }))
      );
      // Set selected course if already loaded
      const found = courses.find((c) => c.id === data.course?.id);
      if (found) setSelectedCourse(found);
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

  const onSubmit = async (data: TestFormInputs) => {
    if (!test) return;

    try {
      setIsSaving(true);
      // Convert local times to UTC and auto-calc due date from start + time limit
      const startDateUTC = toUTC(data.startDate);
      let dueDateUTC: string | null = null;
      if (data.startDate && data.timeLimit) {
        const minutes = parseInt(data.timeLimit);
        const due = new Date(
          new Date(startDateUTC).getTime() + minutes * 60000
        );
        dueDateUTC = due.toISOString();
      }
      const response = await fetch(`/api/tests/${test.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          courseId: data.courseId,
          levelId: data.levelId,
          startDate: startDateUTC,
          timeLimit: data.timeLimit ? parseInt(data.timeLimit) : null,
          dueDate: dueDateUTC,
          allowViewScore: data.allowViewScore,
          questions: questions.map((q, index) => ({
            question: q.question,
            type: q.type,
            options: q.options,
            correct: q.correct,
            required: q.required,
            order: index + 1,
            points: q.points,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to update test");

      toast.success("Test updated successfully");
      fetchTest();
      setEditing(false);
    } catch (error) {
      console.error("Error updating test:", error);
      toast.error("Failed to update test");
    } finally {
      setIsSaving(false);
    }
  };

  // share link handled elsewhere on list; omit here to keep header minimal

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

  const [publishOpen, setPublishOpen] = useState(false);

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
    <tr key={response.id} className="hover:bg-gray-50 text-center">
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

  // Question editor helpers (mirror create page behavior)
  const addQuestion = (type: Question["type"]) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: "",
      type,
      options:
        type === "MULTIPLE_CHOICE" || type === "CHECKBOX" ? ["", ""] : [],
      correct: [],
      required: false,
      points: 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const addOption = (questionId: string) => {
    const q = questions.find((qq) => qq.id === questionId)!;
    updateQuestion(questionId, { options: [...q.options, ""] });
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    const q = questions.find((qq) => qq.id === questionId)!;
    const newOptions = [...q.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionId, { options: newOptions });
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const q = questions.find((qq) => qq.id === questionId)!;
    const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
    updateQuestion(questionId, { options: newOptions });
  };

  const toggleCorrectAnswer = (questionId: string, option: string) => {
    const q = questions.find((qq) => qq.id === questionId)!;

    // For MULTIPLE_CHOICE (radio), only allow one correct answer
    if (q.type === "MULTIPLE_CHOICE") {
      const newCorrect = q.correct.includes(option) ? [] : [option];
      updateQuestion(questionId, { correct: newCorrect });
    } else {
      // For CHECKBOX, allow multiple correct answers
      const newCorrect = q.correct.includes(option)
        ? q.correct.filter((c) => c !== option)
        : [...q.correct, option];
      updateQuestion(questionId, { correct: newCorrect });
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="flex items-center justify-between p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
        </div>
        <PublishConfirmButton
          isPublished={test.isPublished}
          onConfirm={handlePublish}
        />
      </div>
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
                {/* Title and Time Limit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("title", {
                        required: "Test title is required",
                      })}
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter test title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Limit <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("timeLimit", {
                        required: "Time limit is required",
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select time limit</option>
                      {TIME_LIMIT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Course and Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("courseId", {
                        required: "Course is required",
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Level
                    </label>
                    <input
                      type="text"
                      value={
                        selectedCourse?.level.name || test?.level.name || ""
                      }
                      disabled
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                      placeholder="Level will be auto-filled based on course"
                    />
                  </div>
                </div>

                {/* Start and Due (disabled) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("startDate", {
                        required: "Start date is required",
                      })}
                      type="datetime-local"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date & Time (Auto-calculated)
                    </label>
                    <input
                      type="datetime-local"
                      {...register("dueDate")}
                      disabled
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                      placeholder="Due date will be calculated automatically"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Due date is automatically calculated based on start date
                      and time limit
                    </p>
                  </div>
                </div>

                {/* Description and allow view */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter test description (optional)"
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

                {/* Questions Editor */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Questions
                    </h2>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => addQuestion("MULTIPLE_CHOICE")}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                      >
                        + Multiple Choice
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuestion("CHECKBOX")}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                      >
                        + Checkbox
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuestion("SHORT_ANSWER")}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                      >
                        + Short Answer
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuestion("PARAGRAPH")}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                      >
                        + Paragraph
                      </button>
                    </div>
                  </div>

                  {questions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No questions added yet. Click the buttons above to add
                      questions.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {questions.map((question, index) => (
                        <div
                          key={question.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-sm font-medium text-gray-700">
                              Question {index + 1} -{" "}
                              {question.type.replace("_", " ")}
                            </h3>
                            <button
                              type="button"
                              onClick={() => removeQuestion(question.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Question Text
                              </label>
                              <input
                                type="text"
                                value={question.question}
                                onChange={(e) =>
                                  updateQuestion(question.id, {
                                    question: e.target.value,
                                  })
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter your question"
                              />
                            </div>

                            {(question.type === "MULTIPLE_CHOICE" ||
                              question.type === "CHECKBOX") && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Options
                                </label>
                                <div className="space-y-2">
                                  {question.options.map(
                                    (option, optionIndex) => (
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
                                          checked={question.correct.includes(
                                            option
                                          )}
                                          onChange={() =>
                                            toggleCorrectAnswer(
                                              question.id,
                                              option
                                            )
                                          }
                                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) =>
                                            updateOption(
                                              question.id,
                                              optionIndex,
                                              e.target.value
                                            )
                                          }
                                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          placeholder={`Option ${
                                            optionIndex + 1
                                          }`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeOption(
                                              question.id,
                                              optionIndex
                                            )
                                          }
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    )
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => addOption(question.id)}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                                  >
                                    + Add Option
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={question.required}
                                    onChange={(e) =>
                                      updateQuestion(question.id, {
                                        required: e.target.checked,
                                      })
                                    }
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">
                                    Required
                                  </span>
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <label className="text-sm text-gray-700">
                                  Points:
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={question.points}
                                  onChange={(e) =>
                                    updateQuestion(question.id, {
                                      points: parseInt(e.target.value) || 1,
                                    })
                                  }
                                  className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSaving || questions.length === 0}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
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
                        Question {index + 1} - {question.type.replace("_", " ")}
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
            <h2 className="text-lg font-medium text-gray-900 mb-6">
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

      {/* Shared Publish Confirm Modal */}
      <PublishConfirmModal
        isOpen={publishOpen}
        isPublished={!!test?.isPublished}
        onClose={() => setPublishOpen(false)}
        onConfirm={() => {
          setPublishOpen(false);
          handlePublish();
        }}
      />
    </div>
  );
}

function PublishConfirmButton({
  isPublished,
  onConfirm,
}: {
  isPublished: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`px-4 py-2 rounded-md ${
          isPublished
            ? "bg-orange-600 hover:bg-orange-700 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {isPublished ? "Unpublish Test" : "Publish Test"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {isPublished
                ? "Are you sure you want to unpublish this test? Students will no longer be able to take it."
                : "Are you sure you want to publish this test? Students with the link will be able to take it."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onConfirm();
                }}
                className={`px-4 py-2 rounded-md ${
                  isPublished
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isPublished ? "Unpublish" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
