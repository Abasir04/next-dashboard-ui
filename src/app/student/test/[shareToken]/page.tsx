"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

interface Test {
  id: number;
  title: string;
  description?: string;
  timeLimit?: number;
  startDate: string;
  dueDate: string;
  allowViewScore: boolean;
  lecturer: {
    name: string;
  };
  course: {
    name: string;
    code: string;
  };
  level: {
    name: string;
  };
  questions: Array<{
    id: number;
    question: string;
    type: string;
    options: string[];
    required: boolean;
    points: number;
  }>;
  hasSubmitted: boolean;
  previousResponse?: {
    score?: number;
    submittedAt: string;
    answers: any;
  };
}

export default function TakeTestPage({
  params,
}: {
  params: { shareToken: string };
}) {
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  const fetchTest = useCallback(async () => {
    try {
      const response = await fetch(`/api/tests/public/${params.shareToken}`);
      const data = await response.json();
      if (!response.ok) {
        const message = data?.error || "Unable to load test";
        toast.error(
          message === "Test is not published"
            ? "This test is not published by the lecturer"
            : message
        );
        setTest(null);
        return;
      }

      setTest(data);

      if (data.previousResponse) {
        // Pre-fill form with previous response
        Object.entries(data.previousResponse.answers).forEach(
          ([questionId, answer]: any) => {
            setValue(questionId, answer);
          }
        );
      } else {
        setStartTime(new Date());
      }
    } catch (error) {
      console.error("Error fetching test:", error);
      toast.error("Network error while loading test");
    } finally {
      setLoading(false);
    }
  }, [params.shareToken, setValue]);

  useEffect(() => {
    fetchTest();
  }, [fetchTest]);

  // Timer effect runs after handlers are defined
  useEffect(() => {
    if (test?.timeLimit && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - startTime.getTime()) / 1000 / 60
        );
        const remaining = test.timeLimit! - elapsed;
        setTimeLeft(Math.max(0, remaining));

        if (remaining <= 0) {
          handleSubmit(onSubmit)();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [test?.timeLimit, startTime]);

  const onSubmit = useCallback(
    async (data: any) => {
      if (!test) return;

      try {
        setSubmitting(true);
        const timeSpent = startTime
          ? Math.floor((Date.now() - startTime.getTime()) / 1000 / 60)
          : null;

        const response = await fetch(`/api/tests/${test.id}/responses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: data,
            timeSpent,
          }),
        });

        if (!response.ok) throw new Error("Failed to submit test");

        const result = await response.json();
        toast.success("Test submitted successfully");

        // Update test state to show submitted
        setTest({
          ...test,
          hasSubmitted: true,
          previousResponse: result,
        });
      } catch (error) {
        console.error("Error submitting test:", error);
        toast.error("Failed to submit test");
      } finally {
        setSubmitting(false);
      }
    },
    [test, startTime, router]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  if (!test) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="bg-white shadow rounded-xl p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
            !
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Unable to access test
          </h1>
          <p className="text-gray-600 mb-6">
            The test is either not published yet, unavailable at this time, or
            the link is invalid. Please contact your lecturer for more details.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Do Nothing
            </button>
            <button
              onClick={fetchTest}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (test.hasSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Test Submitted
          </h1>
          <p className="text-gray-600 mb-4">
            You have already submitted this test on{" "}
            {new Date(test.previousResponse!.submittedAt).toLocaleString()}
          </p>
          {test.allowViewScore &&
            test.previousResponse?.score !== null &&
            test.previousResponse?.score !== undefined && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  Your Score
                </h2>
                <p className="text-3xl font-bold text-indigo-600">
                  {test.previousResponse!.score!.toFixed(1)}%
                </p>
              </div>
            )}
          <button
            onClick={() => router.push("/student")}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
              {test.description && (
                <p className="mt-2 text-gray-600">{test.description}</p>
              )}
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Course</p>
                  <p className="font-medium text-gray-900">
                    {test.course.name} ({test.course.code})
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Level</p>
                  <p className="font-medium text-gray-900">{test.level.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Lecturer</p>
                  <p className="font-medium text-gray-900">
                    {test.lecturer.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(test.dueDate).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            {timeLeft !== null && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Time Remaining</div>
                <div
                  className={`text-2xl font-bold ${
                    timeLeft < 5 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {Math.floor(timeLeft)}:
                  {((timeLeft % 1) * 60).toFixed(0).padStart(2, "0")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-8">
            {test.questions.map((question, index) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Question {index + 1}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {question.points} point(s)
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{question.question}</p>

                {question.type === "SHORT_ANSWER" && (
                  <input
                    {...register(question.id.toString(), {
                      required: question.required
                        ? "This field is required"
                        : false,
                    })}
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your answer"
                  />
                )}

                {question.type === "PARAGRAPH" && (
                  <textarea
                    {...register(question.id.toString(), {
                      required: question.required
                        ? "This field is required"
                        : false,
                    })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your answer"
                  />
                )}

                {question.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex items-center space-x-3"
                      >
                        <input
                          {...register(question.id.toString(), {
                            required: question.required
                              ? "Please select an option"
                              : false,
                          })}
                          type="radio"
                          value={option}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === "CHECKBOX" && (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex items-center space-x-3"
                      >
                        <input
                          {...register(question.id.toString(), {
                            required: question.required
                              ? "Please select at least one option"
                              : false,
                          })}
                          type="checkbox"
                          value={option}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {errors[question.id.toString()] && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors[question.id.toString()]?.message as string}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
