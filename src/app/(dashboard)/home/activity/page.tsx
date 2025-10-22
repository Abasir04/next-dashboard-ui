"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiSearch,
  FiFilter,
  FiUsers,
  FiClipboard,
  FiBookOpen,
  FiFileText,
  FiUserPlus,
  FiClock,
  FiTrendingUp,
  FiRefreshCw,
  FiDownload,
  FiMoreVertical,
  FiActivity,
} from "react-icons/fi";
import { showError } from "@/lib/toast";

interface Activity {
  id: string;
  type:
    | "registration"
    | "submission"
    | "course_created"
    | "assignment_created"
    | "material_uploaded";
  title: string;
  description: string;
  timestamp: string;
  studentName?: string;
  studentEmail?: string;
  courseName?: string;
  courseCode?: string;
  assignmentTitle?: string;
  status?: "pending" | "completed" | "overdue";
  priority?: "low" | "medium" | "high";
  metadata?: any;
}

interface ActivityGroup {
  date: string;
  activities: Activity[];
}

const RecentActivityPage = () => {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [groupedActivities, setGroupedActivities] = useState<ActivityGroup[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<"date" | "type" | "course">("date");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority">(
    "newest"
  );
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  const activityTypes = [
    { value: "all", label: "All Activities", icon: <FiTrendingUp /> },
    {
      value: "registration",
      label: "Student Registrations",
      icon: <FiUserPlus />,
    },
    {
      value: "submission",
      label: "Assignment Submissions",
      icon: <FiClipboard />,
    },
    { value: "course_created", label: "Course Created", icon: <FiBookOpen /> },
    {
      value: "assignment_created",
      label: "Assignment Created",
      icon: <FiFileText />,
    },
    {
      value: "material_uploaded",
      label: "Material Uploaded",
      icon: <FiFileText />,
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "registration":
        return <FiUserPlus className="h-5 w-5" />;
      case "submission":
        return <FiClipboard className="h-5 w-5" />;
      case "course_created":
        return <FiBookOpen className="h-5 w-5" />;
      case "assignment_created":
        return <FiFileText className="h-5 w-5" />;
      case "material_uploaded":
        return <FiFileText className="h-5 w-5" />;
      default:
        return <FiActivity className="h-5 w-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "registration":
        return "text-green-600 bg-green-50";
      case "submission":
        return "text-blue-600 bg-blue-50";
      case "course_created":
        return "text-purple-600 bg-purple-50";
      case "assignment_created":
        return "text-orange-600 bg-orange-50";
      case "material_uploaded":
        return "text-indigo-600 bg-indigo-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatGroupHeader = (groupKey: string, groupBy: string) => {
    if (groupBy === "type") {
      // Format activity type names
      switch (groupKey) {
        case "registration":
          return "Student Registrations";
        case "submission":
          return "Assignment Submissions";
        case "course_created":
          return "Course Created";
        case "assignment_created":
          return "Assignment Created";
        case "material_uploaded":
          return "Material Uploaded";
        default:
          return groupKey
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
      }
    } else if (groupBy === "course") {
      return groupKey === "Other" ? "Other Activities" : groupKey;
    } else {
      // For date grouping, format the date nicely
      const date = new Date(groupKey);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    }
  };

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all related data
      const [assignmentsRes, coursesRes, registrationsRes] = await Promise.all([
        fetch("/api/assignments"),
        fetch("/api/courses"),
        fetch("/api/course-registration"),
      ]);

      const [assignments, courses, registrations] = await Promise.all([
        assignmentsRes.json(),
        coursesRes.json(),
        registrationsRes.json(),
      ]);

      const allActivities: Activity[] = [];

      // Process assignments
      if (assignments.assignments) {
        assignments.assignments.forEach((assignment: any) => {
          allActivities.push({
            id: `assignment-${assignment.id}`,
            type: "assignment_created",
            title: `Assignment Created: ${assignment.title}`,
            description: `New assignment created for ${
              assignment.course?.name || "Unknown Course"
            }`,
            timestamp: assignment.createdAt,
            courseName: assignment.course?.name,
            courseCode: assignment.course?.code,
            assignmentTitle: assignment.title,
            priority: "medium",
          });
        });
      }

      // Process courses
      if (courses) {
        courses.forEach((course: any) => {
          allActivities.push({
            id: `course-${course.id}`,
            type: "course_created",
            title: `Course Created: ${course.name}`,
            description: `New course "${course.name}" (${course.code}) created`,
            timestamp: course.createdAt,
            courseName: course.name,
            courseCode: course.code,
            priority: "high",
          });
        });
      }

      // Process registrations
      if (registrations.registrations) {
        registrations.registrations.forEach((registration: any) => {
          allActivities.push({
            id: `registration-${registration.id}`,
            type: "registration",
            title: `Student Registration: ${
              registration.studentName || registration.studentEmail
            }`,
            description: `Student registered for ${
              registration.course?.name || "Unknown Course"
            }`,
            timestamp: registration.createdAt,
            studentName: registration.studentName,
            studentEmail: registration.studentEmail,
            courseName: registration.course?.name,
            courseCode: registration.course?.code,
            status:
              registration.status === "APPROVED" ? "completed" : "pending",
            priority: "medium",
          });
        });
      }

      // Sort by timestamp (newest first)
      allActivities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(allActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      showError("Failed to fetch activities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Filter and group activities
  useEffect(() => {
    let filteredActivities = activities;

    // Apply search filter
    if (searchTerm) {
      filteredActivities = filteredActivities.filter(
        (activity) =>
          activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          activity.studentName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          activity.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      filteredActivities = filteredActivities.filter(
        (activity) => activity.type === filterType
      );
    }

    // Apply sorting
    filteredActivities.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        case "oldest":
          return (
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
          );
        default:
          return 0;
      }
    });

    // Group activities
    if (groupBy === "date") {
      const grouped = filteredActivities.reduce(
        (groups: { [key: string]: Activity[] }, activity) => {
          const date = new Date(activity.timestamp).toDateString();
          if (!groups[date]) {
            groups[date] = [];
          }
          groups[date].push(activity);
          return groups;
        },
        {}
      );

      setGroupedActivities(
        Object.entries(grouped).map(([date, activities]) => ({
          date,
          activities,
        }))
      );
    } else if (groupBy === "type") {
      const grouped = filteredActivities.reduce(
        (groups: { [key: string]: Activity[] }, activity) => {
          if (!groups[activity.type]) {
            groups[activity.type] = [];
          }
          groups[activity.type].push(activity);
          return groups;
        },
        {}
      );

      setGroupedActivities(
        Object.entries(grouped).map(([type, activities]) => ({
          date: type,
          activities,
        }))
      );
    } else if (groupBy === "course") {
      const grouped = filteredActivities.reduce(
        (groups: { [key: string]: Activity[] }, activity) => {
          const courseKey = activity.courseName || "Other";
          if (!groups[courseKey]) {
            groups[courseKey] = [];
          }
          groups[courseKey].push(activity);
          return groups;
        },
        {}
      );

      setGroupedActivities(
        Object.entries(grouped).map(([course, activities]) => ({
          date: course,
          activities,
        }))
      );
    }
  }, [activities, searchTerm, filterType, groupBy, sortBy]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleRefresh = () => {
    fetchActivities();
  };

  const handleExport = () => {
    // Simple CSV export
    const csvContent = [
      [
        "Type",
        "Title",
        "Description",
        "Timestamp",
        "Student",
        "Course",
        "Priority",
      ],
      ...activities.map((activity) => [
        activity.type,
        activity.title,
        activity.description,
        new Date(activity.timestamp).toLocaleString(),
        activity.studentName || "",
        activity.courseName || "",
        activity.priority || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recent-activities-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/home")}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Recent Activity
                </h1>
                <p className="text-gray-600">
                  Track all activities across your dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <FiRefreshCw className="h-5 w-5" />
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <FiDownload className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Filters & Search
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <FiFilter className="h-4 w-4" />
                <span>{showFilters ? "Hide" : "Show"} Filters</span>
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Activity Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {activityTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Group By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group By
                  </label>
                  <select
                    value={groupBy}
                    onChange={(e) =>
                      setGroupBy(e.target.value as "date" | "type" | "course")
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">Date</option>
                    <option value="type">Activity Type</option>
                    <option value="course">Course</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as "newest" | "oldest" | "priority"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-6">
          {groupedActivities.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <FiActivity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No activities found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            groupedActivities.map((group, groupIndex) => (
              <div
                key={groupIndex}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatGroupHeader(group.date, groupBy)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {group.activities.length} activities
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {group.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-start space-x-4">
                        <div
                          className={`p-2 rounded-lg ${getActivityColor(
                            activity.type
                          )}`}
                        >
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {activity.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {activity.priority && (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                    activity.priority
                                  )}`}
                                >
                                  {activity.priority}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 flex items-center space-x-1">
                                <FiClock className="h-3 w-3" />
                                <span>
                                  {formatTimestamp(activity.timestamp)}
                                </span>
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {activity.description}
                          </p>
                          {(activity.studentName || activity.courseName) && (
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              {activity.studentName && (
                                <span className="flex items-center space-x-1">
                                  <FiUsers className="h-3 w-3" />
                                  <span>{activity.studentName}</span>
                                </span>
                              )}
                              {activity.courseName && (
                                <span className="flex items-center space-x-1">
                                  <FiBookOpen className="h-3 w-3" />
                                  <span>
                                    {activity.courseName} ({activity.courseCode}
                                    )
                                  </span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {activity.status && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                activity.status === "completed"
                                  ? "text-green-800 bg-green-100"
                                  : activity.status === "pending"
                                  ? "text-yellow-800 bg-yellow-100"
                                  : "text-red-800 bg-red-100"
                              }`}
                            >
                              {activity.status}
                            </span>
                          )}
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                            <FiMoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivityPage;
