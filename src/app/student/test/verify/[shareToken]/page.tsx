"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import {
  FiCheckCircle,
  FiXCircle,
  FiLock,
  FiHash,
  FiFileText,
} from "react-icons/fi";
import { showError, showSuccess } from "@/lib/toast";

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

interface TestVerificationResult {
  success: boolean;
  message: string;
  student?: {
    id: number;
    name: string;
    matricNumber: string;
    email: string;
  };
}

const StudentTestVerificationPage = () => {
  const router = useRouter();
  const params = useParams();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authForm, setAuthForm] = useState({
    matricNumber: "",
    password: "",
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<TestVerificationResult | null>(null);

  // Test taking states
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    score?: number;
    message: string;
  } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm();

  // Get share token from URL params
  const shareToken = params.shareToken as string;

  // Save test state to localStorage
  const saveTestState = useCallback(
    (data: any, timeLeft: number | null, startTime: Date | null) => {
      const state = {
        formData: data,
        timeLeft,
        startTime: startTime?.getTime(),
        timestamp: Date.now(),
      };
      localStorage.setItem(`test_state_${shareToken}`, JSON.stringify(state));
    },
    [shareToken]
  );

  // Load test state from localStorage
  const loadTestState = useCallback(() => {
    try {
      const saved = localStorage.getItem(`test_state_${shareToken}`);
      if (saved) {
        const state = JSON.parse(saved);
        // Only restore if saved within last 24 hours
        if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          return state;
        }
      }
    } catch (error) {
      console.error("Error loading test state:", error);
    }
    return null;
  }, [shareToken]);

  // Watch form changes and save state
  const watchedData = watch();
  useEffect(() => {
    if (isAuthenticated && Object.keys(watchedData).length > 0) {
      saveTestState(watchedData, timeLeft, startTime);
    }
  }, [watchedData, timeLeft, startTime, saveTestState, isAuthenticated]);

  const fetchTestDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tests/public/${shareToken}/verify`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch test details");
      }

      const data = await response.json();
      setTest(data.test);
    } catch (error) {
      console.error("Error fetching test details:", error);
      showError(
        error instanceof Error ? error.message : "Failed to fetch test details"
      );
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  const fetchFullTest = useCallback(async () => {
    try {
      // Get JWT token from sessionStorage
      const token = sessionStorage.getItem(`test_token_${shareToken}`);

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/tests/public/${shareToken}`, {
        headers,
      });
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
        // Try to restore saved state
        const savedState = loadTestState();
        if (savedState) {
          // Restore form data
          Object.entries(savedState.formData).forEach(
            ([questionId, answer]: any) => {
              setValue(questionId, answer);
            }
          );
          // Restore timer state
          if (savedState.startTime) {
            setStartTime(new Date(savedState.startTime));
          }
          if (savedState.timeLeft !== null) {
            setTimeLeft(savedState.timeLeft);
          }
        } else {
          setStartTime(new Date());
        }
      }
    } catch (error) {
      console.error("Error fetching test:", error);
      toast.error("Network error while loading test");
    }
  }, [shareToken, setValue, loadTestState]);

  useEffect(() => {
    if (shareToken) {
      fetchTestDetails();
    }
  }, [shareToken, fetchTestDetails]);

  // Timer effect - starts immediately when authenticated and test loads
  useEffect(() => {
    if (isAuthenticated && test?.timeLimit) {
      const start = startTime || new Date();
      setStartTime(start);

      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start.getTime()) / 1000);
        const remaining = test.timeLimit! * 60 - elapsed; // Convert minutes to seconds
        setTimeLeft(Math.max(0, remaining));

        if (remaining <= 0) {
          handleSubmit(onSubmit)();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, test?.timeLimit, startTime, handleSubmit]);

  // Due date warning (5 minutes before expiration)
  useEffect(() => {
    if (!isAuthenticated || !test) return;

    const dueMs = new Date(test.dueDate).getTime();
    const fiveMinutesMs = 5 * 60 * 1000;
    const warnAt = dueMs - fiveMinutesMs;

    // If already within 5 minutes, warn immediately once
    if (Date.now() >= warnAt && Date.now() < dueMs) {
      toast(
        <div className="text-sm">
          Session expires in less than 5 minutes (due date approaching).
        </div>
      );
      return;
    }

    if (Date.now() >= dueMs) {
      // If already past due, redirect to verify if needed
      return;
    }

    const timeoutId = window.setTimeout(() => {
      toast(
        <div className="text-sm">
          Session expires in 5 minutes (test due date).
        </div>
      );
    }, warnAt - Date.now());

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, test, shareToken]);

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setAuthLoading(true);

      const response = await fetch(`/api/tests/public/${shareToken}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricNumber: authForm.matricNumber,
          password: authForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setIsAuthenticated(true);
      setVerificationResult({
        success: true,
        message: data.message,
        student: data.student,
      });

      // Store JWT token in sessionStorage
      if (data.token) {
        console.log("Storing JWT token:", data.token.substring(0, 20) + "...");
        sessionStorage.setItem(`test_token_${shareToken}`, data.token);
      } else {
        console.error("No JWT token received from server");
      }

      showSuccess("Authentication successful! Loading test...");

      // Fetch full test data after authentication
      await fetchFullTest();
    } catch (error) {
      console.error("Error authenticating:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      showError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const onSubmit = useCallback(
    (_data: any) => {
      if (!test) return;
      setShowSubmitModal(true);
    },
    [test]
  );

  const handleConfirmSubmit = useCallback(
    async (data: any) => {
      if (!test) return;

      try {
        setSubmitting(true);
        const timeSpent = startTime
          ? Math.floor((Date.now() - startTime.getTime()) / 1000 / 60)
          : null;

        // Get JWT token from sessionStorage
        const token = sessionStorage.getItem(`test_token_${shareToken}`);
        console.log("JWT Token:", token ? "Found" : "Not found");

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        } else {
          console.error("No JWT token found in sessionStorage");
        }

        const response = await fetch(`/api/tests/${test.id}/responses`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            answers: data,
            timeSpent,
          }),
        });

        if (!response.ok) throw new Error("Failed to submit test");

        const result = await response.json();

        setSubmissionResult({
          success: true,
          score: result.score,
          message: "Test submitted successfully!",
        });

        // Update test state to show submitted
        setTest({
          ...test,
          hasSubmitted: true,
          previousResponse: result,
        });

        // Clear saved test state and JWT token after successful submission
        localStorage.removeItem(`test_state_${shareToken}`);
        sessionStorage.removeItem(`test_token_${shareToken}`);
      } catch (error) {
        console.error("Error submitting test:", error);
        setSubmissionResult({
          success: false,
          message: "Failed to submit test",
        });
      } finally {
        setSubmitting(false);
        setShowSubmitModal(false);
      }
    },
    [test, startTime, shareToken]
  );

  const handleCancelTest = useCallback(async () => {
    if (!test) return;

    try {
      setSubmitting(true);

      // Get JWT token from sessionStorage
      const token = sessionStorage.getItem(`test_token_${shareToken}`);

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/tests/${test.id}/cancel`, {
        method: "POST",
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to cancel test");
      }

      // Clear saved state and token
      localStorage.removeItem(`test_state_${shareToken}`);
      sessionStorage.removeItem(`test_token_${shareToken}`);

      // Redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Error cancelling test:", error);
      toast.error("Failed to cancel test");
    } finally {
      setSubmitting(false);
      setShowCancelModal(false);
    }
  }, [test, shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <FiXCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Test Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The test link you&apos;re trying to access is invalid or has
            expired.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Go to home
          </button>
        </div>
      </div>
    );
  }

  // Show submission success message
  if (submissionResult?.success) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
            <FiCheckCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {submissionResult.message}
          </h1>
          {test.allowViewScore && submissionResult.score !== undefined && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Your Score
              </h2>
              <p className="text-3xl font-bold text-indigo-600">
                {submissionResult.score.toFixed(1)}%
              </p>
            </div>
          )}
          <button
            onClick={() => router.push("/student")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
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

  // Show loading state if authenticated but questions not yet loaded
  if (isAuthenticated && !test.questions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test questions...</p>
        </div>
      </div>
    );
  }

  // Show test taking interface if authenticated and questions are loaded
  if (isAuthenticated && test.questions) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {test.title}
                </h1>
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
                    <p className="font-medium text-gray-900">
                      {test.level.name}
                    </p>
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
                      timeLeft < 300 ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {Math.floor(timeLeft / 3600)
                      .toString()
                      .padStart(2, "0")}
                    :
                    {Math.floor((timeLeft % 3600) / 60)
                      .toString()
                      .padStart(2, "0")}
                    :
                    {Math.floor(timeLeft % 60)
                      .toString()
                      .padStart(2, "0")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-8">
              {test.questions &&
                test.questions.map((question, index) => (
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
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel Test
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Test"}
              </button>
            </div>
          </form>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-4">
                  <FiXCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Confirm Test Submission
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to submit your test? This action cannot
                  be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Get form data from react-hook-form
                      const formValues: { [key: string]: any } = {};
                      test?.questions.forEach((question) => {
                        if (question.type === "CHECKBOX") {
                          const checkboxes = document.querySelectorAll(
                            `[name="${question.id}"]`
                          ) as NodeListOf<HTMLInputElement>;
                          formValues[question.id.toString()] = Array.from(
                            checkboxes
                          )
                            .filter((cb) => cb.checked)
                            .map((cb) => cb.value);
                        } else if (question.type === "MULTIPLE_CHOICE") {
                          const checkedRadio = document.querySelector(
                            `[name="${question.id}"]:checked`
                          ) as HTMLInputElement;
                          if (checkedRadio) {
                            formValues[question.id.toString()] = [
                              checkedRadio.value,
                            ];
                          } else {
                            formValues[question.id.toString()] = [];
                          }
                        }
                      });
                      handleConfirmSubmit(formValues);
                    }}
                    disabled={submitting}
                    className={`flex-1 px-4 py-2 rounded-md font-medium ${
                      submitting
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {submitting ? "Submitting..." : "Confirm Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Test Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cancel Test
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this test? Your progress will be
                lost and you will need to restart the verification process.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Keep Test
                </button>
                <button
                  onClick={handleCancelTest}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Cancelling..." : "Cancel Test"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show verification form if not authenticated
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center py-8">
      <div className="w-full max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Left Side - Test Details */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Test Verification
            </h1>

            {/* Test Details */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <FiFileText className="mr-3 text-blue-600" />
                {test.title}
              </h2>

              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">
                    Course:
                  </span>
                  <span className="text-gray-800">
                    {test.course.name} ({test.course.code})
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">
                    Lecturer:
                  </span>
                  <span className="text-gray-800">{test.lecturer.name}</span>
                </div>

                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">Level:</span>
                  <span className="text-gray-800">{test.level.name}</span>
                </div>

                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-24">
                    Due Date:
                  </span>
                  <span className="text-gray-800">
                    {new Date(test.dueDate).toLocaleString()}
                  </span>
                </div>

                {test.timeLimit && (
                  <div className="flex items-center">
                    <span className="font-medium text-gray-600 w-24">
                      Time Limit:
                    </span>
                    <span className="text-gray-800">
                      {test.timeLimit} minutes
                    </span>
                  </div>
                )}

                {test.description && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-600">
                      Description:
                    </span>
                    <p className="text-gray-800 mt-1">{test.description}</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-6 text-xs text-gray-500 space-y-1">
                <p>• You must be registered for this course to take the test</p>
                <p>
                  • Student authentication is required (matric number +
                  password)
                </p>
                <p>• Test can be taken from anywhere</p>
                <p>• You can only submit the test once</p>
                <p>• Make sure you have a stable internet connection</p>
              </div>
            </div>
          </div>

          {/* Right Side - Verification Form */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Student Verification
            </h2>
            <p className="text-gray-600 mb-4">
              Complete the verification below to access the test
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> You must be registered for this course to
                take the test. Student authentication is required.
              </p>
            </div>

            <div className="space-y-6">
              {/* Authentication Form */}
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiLock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Student Authentication Required
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Please enter your credentials to verify and access the test
                  </p>
                </div>

                <form onSubmit={handleAuthentication} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Matric Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiHash className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={authForm.matricNumber}
                          onChange={(e) =>
                            setAuthForm({
                              ...authForm,
                              matricNumber: e.target.value,
                            })
                          }
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Enter matric number"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          value={authForm.password}
                          onChange={(e) =>
                            setAuthForm({
                              ...authForm,
                              password: e.target.value,
                            })
                          }
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Enter password"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                      authLoading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {authLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      "Verify & Continue"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTestVerificationPage;
