"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiUsers,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiTrendingUp,
  FiActivity,
  FiTarget,
  FiAward,
  FiZap,
  FiRefreshCw,
  FiChevronRight,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import { CreateAssignmentModal } from "@/components/modals/AssignmentModals";

interface DashboardStats {
  totalStudents: number;
  totalLecturers: number;
  totalCourses: number;
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
  upcomingEvents: number;
  recentAnnouncements: number;
  previousStats?: {
    totalStudents: number;
    totalCourses: number;
    totalAssignments: number;
    upcomingEvents: number;
  };
}

interface RecentActivity {
  id: string;
  type: "assignment" | "course" | "student" | "event" | "announcement";
  title: string;
  description: string;
  time: string;
  status?: "pending" | "completed" | "urgent";
  icon: React.ReactNode;
  color: string;
  timestamp?: string;
  studentName?: string;
  courseName?: string;
  courseCode?: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  action?: () => void;
}

const HomePage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalLecturers: 0,
    totalCourses: 0,
    totalAssignments: 0,
    pendingAssignments: 0,
    completedAssignments: 0,
    upcomingEvents: 0,
    recentAnnouncements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] =
    useState(false);

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all stats in parallel
        const [
          studentsRes,
          lecturersRes,
          coursesRes,
          assignmentsRes,
          eventsRes,
          announcementsRes,
          registrationsRes,
        ] = await Promise.all([
          fetch("/api/counts/lecturer-students"),
          fetch("/api/counts/lecturer"),
          fetch("/api/courses"),
          fetch("/api/assignments"),
          fetch("/api/events"),
          fetch("/api/announcements"),
          fetch("/api/course-registration"),
        ]);

        const [
          students,
          lecturers,
          courses,
          assignments,
          events,
          announcements,
          registrations,
        ] = await Promise.all([
          studentsRes.json(),
          lecturersRes.json(),
          coursesRes.json(),
          assignmentsRes.json(),
          eventsRes.json(),
          announcementsRes.json(),
          registrationsRes.json(),
        ]);

        const assignmentsData = assignments.assignments || [];
        const pendingAssignments = assignmentsData.filter(
          (a: any) => new Date(a.dueDate) > new Date()
        ).length;
        const completedAssignments = assignmentsData.filter(
          (a: any) => new Date(a.dueDate) <= new Date()
        ).length;

        setStats({
          totalStudents: students.count || 0,
          totalLecturers: lecturers.count || 0,
          totalCourses: courses.length || 0,
          totalAssignments: assignmentsData.length || 0,
          pendingAssignments,
          completedAssignments,
          upcomingEvents: events.length || 0,
          recentAnnouncements: announcements.length || 0,
        });

        // Generate recent activity - get most recent 2 activities across all types
        const allActivities: RecentActivity[] = [];

        // Add assignments
        if (assignments.assignments) {
          assignments.assignments.forEach((assignment: any) => {
            allActivities.push({
              id: `assignment-${assignment.id}`,
              type: "assignment" as const,
              title: `Assignment Created: ${assignment.title}`,
              description: `New assignment created for ${
                assignment.course?.name || "Unknown Course"
              }`,
              time: formatTimeAgo(assignment.createdAt),
              status:
                new Date(assignment.dueDate) > new Date()
                  ? "pending"
                  : "completed",
              icon: <FiClipboard />,
              color: "text-orange-600",
              timestamp: assignment.createdAt,
              courseName: assignment.course?.name,
              courseCode: assignment.course?.code,
            });
          });
        }

        // Add courses
        if (courses) {
          courses.forEach((course: any) => {
            allActivities.push({
              id: `course-${course.id}`,
              type: "course" as const,
              title: `Course Created: ${course.name}`,
              description: `New course "${course.name}" (${course.code}) created`,
              time: formatTimeAgo(course.createdAt),
              icon: <FiBookOpen />,
              color: "text-purple-600",
              timestamp: course.createdAt,
              courseName: course.name,
              courseCode: course.code,
            });
          });
        }

        // Add student registrations
        if (registrations.registrations) {
          registrations.registrations.forEach((registration: any) => {
            allActivities.push({
              id: `registration-${registration.id}`,
              type: "student" as const,
              title: `Student Registration: ${
                registration.studentName || registration.studentEmail
              }`,
              description: `Student registered for ${
                registration.course?.name || "Unknown Course"
              }`,
              time: formatTimeAgo(registration.createdAt),
              status:
                registration.status === "APPROVED" ? "completed" : "pending",
              icon: <FiUsers />,
              color: "text-green-600",
              timestamp: registration.createdAt,
              studentName: registration.studentName,
              courseName: registration.course?.name,
              courseCode: registration.course?.code,
            });
          });
        }

        // Add events
        if (events) {
          events.forEach((event: any) => {
            allActivities.push({
              id: `event-${event.id}`,
              type: "event" as const,
              title: `Event Created: ${event.title}`,
              description: `New event "${event.title}" scheduled`,
              time: formatTimeAgo(event.createdAt),
              icon: <FiCalendar />,
              color: "text-pink-600",
              timestamp: event.createdAt,
            });
          });
        }

        // Add announcements
        if (announcements) {
          announcements.forEach((announcement: any) => {
            allActivities.push({
              id: `announcement-${announcement.id}`,
              type: "announcement" as const,
              title: `Announcement Created: ${announcement.title}`,
              description: `New announcement "${announcement.title}" published`,
              time: formatTimeAgo(announcement.createdAt),
              icon: <FiUsers />,
              color: "text-cyan-600",
              timestamp: announcement.createdAt,
            });
          });
        }

        // Sort by timestamp (newest first) and take only the 2 most recent
        const recentActivities = allActivities
          .sort(
            (a, b) =>
              new Date(b.timestamp || 0).getTime() -
              new Date(a.timestamp || 0).getTime()
          )
          .slice(0, 2);

        setRecentActivity(recentActivities);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions: QuickAction[] = [
    {
      title: "Create Course",
      description: "Set up new course for students",
      icon: <FiBookOpen />,
      href: "/menu/courses",
      color: "text-green-600",
      action: () => {
        router.push("/menu/courses?action=create");
      },
    },
    {
      title: "Create Assignment",
      description: "Set up new assignment for students",
      icon: <FiClipboard />,
      href: "/menu/assignments",
      color: "text-blue-600",
      action: () => {
        setShowCreateAssignmentModal(true);
      },
    },
  ];

  // Calculate trend percentage
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    trend,
    subtitle,
    trendValue,
  }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center text-sm ${
              trendValue && parseFloat(trendValue.replace(/[+%]/g, "")) >= 0
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            <FiTrendingUp
              className={`mr-1 ${
                trendValue && parseFloat(trendValue.replace(/[+%]/g, "")) < 0
                  ? "rotate-180"
                  : ""
              }`}
            />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-gray-600 text-sm">{title}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  const getActivityColor = (type: string) => {
    switch (type) {
      case "student":
        return "text-green-600 bg-green-50";
      case "assignment":
        return "text-orange-600 bg-orange-50";
      case "course":
        return "text-purple-600 bg-purple-50";
      case "event":
        return "text-pink-600 bg-pink-50";
      case "announcement":
        return "text-cyan-600 bg-cyan-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "student":
        return <FiUsers className="h-5 w-5" />;
      case "assignment":
        return <FiClipboard className="h-5 w-5" />;
      case "course":
        return <FiBookOpen className="h-5 w-5" />;
      case "event":
        return <FiCalendar className="h-5 w-5" />;
      case "announcement":
        return <FiUsers className="h-5 w-5" />;
      default:
        return <FiActivity className="h-5 w-5" />;
    }
  };

  const ActivityItem = ({ activity }: { activity: RecentActivity }) => (
    <div className="p-4 hover:bg-gray-50 transition-colors duration-200">
      <div className="flex items-start space-x-4">
        <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
          {getActivityIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {activity.title}
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 flex items-center space-x-1">
                <FiClock className="h-3 w-3" />
                <span>{activity.time}</span>
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
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
                    {activity.courseName} ({activity.courseCode})
                  </span>
                </span>
              )}
            </div>
          )}
          <div className="flex items-center space-x-2 mt-2">
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
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 mb-8">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to Your Dashboard
              </h1>
              <p className="text-gray-600">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                •{" "}
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <FiRefreshCw className="h-5 w-5" />
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-500">System Status</p>
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium">
                    All Systems Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Courses"
            value={stats.totalCourses}
            icon={<FiBookOpen className="h-6 w-6" />}
            color="text-green-600"
            trend={
              stats.previousStats
                ? calculateTrend(
                    stats.totalCourses,
                    stats.previousStats.totalCourses
                  )
                : "0%"
            }
            trendValue={
              stats.previousStats
                ? calculateTrend(
                    stats.totalCourses,
                    stats.previousStats.totalCourses
                  )
                : "0%"
            }
            subtitle="Registered courses"
          />
          <StatCard
            title="Registered Students"
            value={stats.totalStudents.toLocaleString()}
            icon={<FiUsers className="h-6 w-6" />}
            color="text-blue-600"
            trend={
              stats.previousStats
                ? calculateTrend(
                    stats.totalStudents,
                    stats.previousStats.totalStudents
                  )
                : "0%"
            }
            trendValue={
              stats.previousStats
                ? calculateTrend(
                    stats.totalStudents,
                    stats.previousStats.totalStudents
                  )
                : "0%"
            }
            subtitle="In your courses"
          />
          <StatCard
            title="Assignments"
            value={stats.totalAssignments}
            icon={<FiClipboard className="h-6 w-6" />}
            color="text-purple-600"
            trend={
              stats.previousStats
                ? calculateTrend(
                    stats.totalAssignments,
                    stats.previousStats.totalAssignments
                  )
                : "0%"
            }
            trendValue={
              stats.previousStats
                ? calculateTrend(
                    stats.totalAssignments,
                    stats.previousStats.totalAssignments
                  )
                : "0%"
            }
            subtitle={`${stats.pendingAssignments} pending`}
          />
          <StatCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon={<FiCalendar className="h-6 w-6" />}
            color="text-orange-600"
            trend={
              stats.previousStats
                ? calculateTrend(
                    stats.upcomingEvents,
                    stats.previousStats.upcomingEvents
                  )
                : "0%"
            }
            trendValue={
              stats.previousStats
                ? calculateTrend(
                    stats.upcomingEvents,
                    stats.previousStats.upcomingEvents
                  )
                : "0%"
            }
            subtitle="This week"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FiActivity className="mr-2 text-blue-600" />
                    Recent Activity
                  </h2>
                  <button
                    onClick={() => router.push("/home/activity")}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    View All
                    <FiChevronRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <FiActivity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FiZap className="mr-2 text-yellow-600" />
                  Quick Actions
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="w-full text-left p-5 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg ${action.color} bg-opacity-10 group-hover:scale-110 transition-transform duration-200`}
                      >
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {action.description}
                        </p>
                      </div>
                      <FiArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Assignment Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiTarget className="mr-2 text-green-600" />
                Assignment Progress
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Completed
                  </span>
                  <span className="text-sm text-gray-500">
                    {stats.completedAssignments}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        stats.totalAssignments > 0
                          ? (stats.completedAssignments /
                              stats.totalAssignments) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Pending
                  </span>
                  <span className="text-sm text-gray-500">
                    {stats.pendingAssignments}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        stats.totalAssignments > 0
                          ? (stats.pendingAssignments /
                              stats.totalAssignments) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiAward className="mr-2 text-purple-600" />
                System Health
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Database
                  </span>
                  <div className="flex items-center text-green-600">
                    <FiCheckCircle className="mr-1 h-4 w-4" />
                    <span className="text-sm">Healthy</span>
                  </div>
                </div>
                {/* <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    API Response
                  </span>
                  <div className="flex items-center text-green-600">
                    <FiCheckCircle className="mr-1 h-4 w-4" />
                    <span className="text-sm">Fast</span>
                  </div>
                </div> */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Storage
                  </span>
                  <div className="flex items-center text-green-600">
                    <FiCheckCircle className="mr-1 h-4 w-4" />
                    <span className="text-sm">Available</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Security
                  </span>
                  <div className="flex items-center text-green-600">
                    <FiCheckCircle className="mr-1 h-4 w-4" />
                    <span className="text-sm">Secure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Courses",
              href: "/menu/courses",
              icon: <FiBookOpen />,
              color: "green",
            },
            {
              title: "Students",
              href: "/menu/students",
              icon: <FiUsers />,
              color: "blue",
            },
            {
              title: "Assignments",
              href: "/menu/assignments",
              icon: <FiClipboard />,
              color: "purple",
            },
            {
              title: "Events",
              href: "/menu/events",
              icon: <FiCalendar />,
              color: "orange",
            },
          ].map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-lg text-${item.color}-600 bg-${item.color}-50 group-hover:scale-110 transition-transform duration-300`}
                >
                  {item.icon}
                </div>
                <FiArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Manage {item.title.toLowerCase()}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showCreateAssignmentModal && (
        <CreateAssignmentModal
          onClose={() => setShowCreateAssignmentModal(false)}
          onSuccess={() => {
            setShowCreateAssignmentModal(false);
            // Refresh the page data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default HomePage;
