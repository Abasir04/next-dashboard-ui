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
  // Menu pages
  menu: {
    students: "/menu/students",
    lecturers: "/menu/lecturers",
    parents: "/menu/parents",
    levels: "/menu/levels",
    courses: "/menu/courses",
    lessons: "/menu/lessons",
    exams: "/menu/exams",
    assignments: "/menu/assignments",
    results: "/menu/results",
    events: "/menu/events",
    announcements: "/menu/announcements",
    attendance: "/menu/attendance",
    messages: "/menu/messages",
  },

  // Standalone pages
  profile: "/profile",
  settings: "/settings",
  logout: "/logout",

  // Dynamic routes
  dynamic: {
    student: (id: string) => `/menu/students/${id}`,
    lecturer: (id: string) => `/menu/lecturers/${id}`,
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

// Helper function to check if a path is a menu page
export const isMenuPage = (path: string): boolean => {
  return Object.values(paths.menu).includes(path as any);
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
    [paths.menu.students]: "Students",
    [paths.menu.lecturers]: "Lecturers",
    [paths.menu.parents]: "Parents",
    [paths.menu.levels]: "Levels",
    [paths.menu.courses]: "Courses",
    [paths.menu.lessons]: "Lessons",
    [paths.menu.exams]: "Exams",
    [paths.menu.assignments]: "Assignments",
    [paths.menu.results]: "Results",
    [paths.menu.events]: "Events",
    [paths.menu.announcements]: "Announcements",
    [paths.profile]: "Profile",
    [paths.settings]: "Settings",
    [paths.logout]: "Logout",
  };

  return pathMap[path] || "Page";
};
