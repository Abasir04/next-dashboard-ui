// Centralized path configuration for the application
export const paths = {
  // Public routes
  landing: "/",
  auth: "/auth",

  // Dashboard routes
  dashboard: {
    admin: "/admin",
    lecturer: "/lecturer",
    student: "/student",
    parent: "/parent",
  },

  home: "/home",
  // List pages
  list: {
    students: "/list/students",
    lecturers: "/list/lecturers",
    parents: "/list/parents",
    levels: "/list/levels",
    courses: "/list/courses",
    lessons: "/list/lessons",
    exams: "/list/exams",
    assignments: "/list/assignments",
    results: "/list/results",
    events: "/list/events",
    announcements: "/list/announcements",
    attendance: "/list/attendance",
    messages: "/list/messages",
  },

  // Standalone pages
  profile: "/profile",
  settings: "/settings",
  logout: "/logout",

  // Dynamic routes
  dynamic: {
    student: (id: string) => `/list/students/${id}`,
    lecturer: (id: string) => `/list/lecturers/${id}`,
  },

  // API routes
  api: {
    auth: {
      signup: "/api/auth/signup",
      signin: "/api/auth/signin",
      signout: "/api/auth/signout",
      me: "/api/auth/me",
    },
  },
} as const;

// Type for all available paths
export type AppPaths = typeof paths;

// Helper function to get auth URL with mode
export const getAuthUrl = (mode: "sign-in" | "sign-up") =>
  `${paths.auth}?mode=${mode}`;

// Helper function to check if a path is a list page
export const isListPage = (path: string): boolean => {
  return Object.values(paths.list).includes(path as any);
};

// Helper function to get the page title from path
export const getPageTitle = (path: string): string => {
  const pathMap: Record<string, string> = {
    [paths.home]: "Home",
    [paths.auth]: "Authentication",
    [paths.dashboard.admin]: "Admin Dashboard",
    [paths.dashboard.lecturer]: "Lecturer Dashboard",
    [paths.dashboard.student]: "Student Dashboard",
    [paths.dashboard.parent]: "Parent Dashboard",
    [paths.list.students]: "Students",
    [paths.list.lecturers]: "Lecturers",
    [paths.list.parents]: "Parents",
    [paths.list.levels]: "Levels",
    [paths.list.courses]: "Courses",
    [paths.list.lessons]: "Lessons",
    [paths.list.exams]: "Exams",
    [paths.list.assignments]: "Assignments",
    [paths.list.results]: "Results",
    [paths.list.events]: "Events",
    [paths.list.announcements]: "Announcements",
    [paths.profile]: "Profile",
    [paths.settings]: "Settings",
    [paths.logout]: "Logout",
  };

  return pathMap[path] || "Page";
};
