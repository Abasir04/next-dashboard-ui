/* eslint-disable unused-imports/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { toUTC } from "@/lib/time";

interface Question {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "CHECKBOX";
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

export default function CreateTestPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
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

  // Fetch lecturer's courses
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

  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Auto-calculate due date when start date or time limit changes
  useEffect(() => {
    if (startDate && timeLimit) {
      const start = new Date(startDate);
      const minutes = parseInt(timeLimit);
      const due = new Date(start.getTime() + minutes * 60000);
      setValue("dueDate", formatDateTimeLocal(due));
    }
  }, [startDate, timeLimit, setValue]);

  const addQuestion = (type: Question["type"]) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: "",
      type,
      options: ["", ""],
      correct: [],
      required: true, // Auto-mark as required
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
    updateQuestion(questionId, {
      options: [...questions.find((q) => q.id === questionId)!.options, ""],
    });
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    const question = questions.find((q) => q.id === questionId)!;
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionId, { options: newOptions });
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find((q) => q.id === questionId)!;
    const newOptions = question.options.filter(
      (_, index) => index !== optionIndex
    );
    updateQuestion(questionId, { options: newOptions });
  };

  const toggleCorrectAnswer = (questionId: string, option: string) => {
    const question = questions.find((q) => q.id === questionId)!;

    // For MULTIPLE_CHOICE (radio), only allow one correct answer
    if (question.type === "MULTIPLE_CHOICE") {
      const newCorrect = question.correct.includes(option) ? [] : [option];
      updateQuestion(questionId, { correct: newCorrect });
    } else {
      // For CHECKBOX, allow multiple correct answers
      const newCorrect = question.correct.includes(option)
        ? question.correct.filter((c) => c !== option)
        : [...question.correct, option];
      updateQuestion(questionId, { correct: newCorrect });
    }
  };

  const onSubmit = async (data: TestFormInputs) => {
    // Validate required fields
    if (!data.courseId || !data.levelId || !data.startDate || !data.timeLimit) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    // Validate questions
    for (const question of questions) {
      if (!question.question.trim()) {
        toast.error("All questions must have text");
        return;
      }
      if (question.options.some((opt) => !opt.trim())) {
        toast.error("All options must be filled");
        return;
      }
      if (question.correct.length === 0) {
        toast.error(
          `Question ${
            questions.indexOf(question) + 1
          }: Please select at least one correct answer`
        );
        return;
      }
    }

    // Auto-calculate due date and convert to UTC
    const startDateUTC = toUTC(data.startDate);
    const minutes = parseInt(data.timeLimit);
    const dueDateUTC = new Date(
      new Date(startDateUTC).getTime() + minutes * 60000
    ).toISOString();

    try {
      setLoading(true);
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startDate: startDateUTC,
          dueDate: dueDateUTC,
          questions: questions.map((q, index) => ({
            ...q,
            order: index + 1,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create test");
      }

      const test = await response.json();
      toast.success("Test created successfully");
      router.push(`/menu/tests`);
    } catch (error) {
      console.error("Error creating test:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create test"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        {/* Test Basic Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center justify-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Create New Test
              </h1>
            </div>
            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push("/menu/tests")}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || questions.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Test"}
              </button>
            </div>
          </div>
          {/* Test Title - Full Width */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register("title", { required: "Test title is required" })}
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter test title"
                required
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
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
              {errors.timeLimit && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.timeLimit.message}
                </p>
              )}
            </div>
          </div>
          {/* Course and Level - Side by Side */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                {...register("courseId", { required: "Course is required" })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
              {errors.courseId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.courseId.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <input
                type="text"
                value={selectedCourse?.level.name || ""}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                placeholder="Level will be auto-filled based on course"
              />
            </div>
          </div>
          {/* Start Date and Time Limit - Side by Side */}{" "}
          {/* Due Date - Full Width (Auto-calculated) */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.startDate.message}
                </p>
              )}
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
                Due date is automatically calculated based on start date and
                time limit
              </p>
            </div>
          </div>
          {/* Description - Full Width */}
          <div className="mt-4">
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
          <div className="mt-4">
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
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Questions</h2>
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
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No questions added yet. Click the buttons above to add questions.
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  index={index}
                  onUpdate={(updates) => updateQuestion(question.id, updates)}
                  onRemove={() => removeQuestion(question.id)}
                  onAddOption={() => addOption(question.id)}
                  onUpdateOption={(optionIndex, value) =>
                    updateOption(question.id, optionIndex, value)
                  }
                  onRemoveOption={(optionIndex) =>
                    removeOption(question.id, optionIndex)
                  }
                  onToggleCorrect={(option) =>
                    toggleCorrectAnswer(question.id, option)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

interface QuestionEditorProps {
  question: Question;
  index: number;
  onUpdate: (updates: Partial<Question>) => void;
  onRemove: () => void;
  onAddOption: () => void;
  onUpdateOption: (optionIndex: number, value: string) => void;
  onRemoveOption: (optionIndex: number) => void;
  onToggleCorrect: (option: string) => void;
}

function QuestionEditor({
  question,
  index,
  onUpdate,
  onRemove,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onToggleCorrect,
}: QuestionEditorProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-700">
          Question {index + 1} - {question.type.replace("_", " ")}
        </h3>
        <button
          type="button"
          onClick={onRemove}
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
            onChange={(e) => onUpdate({ question: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter your question"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <input
                  type={
                    question.type === "MULTIPLE_CHOICE" ? "radio" : "checkbox"
                  }
                  checked={question.correct.includes(option)}
                  onChange={() => onToggleCorrect(option)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => onUpdateOption(optionIndex, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={`Option ${optionIndex + 1}`}
                />
                <button
                  type="button"
                  onClick={() => onRemoveOption(optionIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={onAddOption}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              + Add Option
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Required</span>
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Points:</label>
            <input
              type="number"
              min="1"
              value={question.points}
              onChange={(e) =>
                onUpdate({ points: parseInt(e.target.value) || 1 })
              }
              className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
