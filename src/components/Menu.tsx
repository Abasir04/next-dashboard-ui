"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
// Remove the problematic import
import { paths } from "@/lib/paths";
import {
  FaHome,
  FaUser,
  FaUsers,
  FaChalkboardTeacher,
  FaBook,
  FaClipboardList,
  FaCalendarAlt,
  FaEnvelope,
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import LogoutModal from "./LogoutModal";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        label: "Home",
        href: paths.home,
        icon: FaHome,
        visible: ["admin", "lecturer"],
      },
      {
        label: "Lecturers",
        href: paths.menu.lecturers,
        icon: FaUser,
        visible: ["admin"],
      },
      {
        label: "Courses",
        href: paths.menu.courses,
        icon: FaBook,
        visible: ["admin", "lecturer"],
      },
      {
        label: "Levels",
        href: paths.menu.levels,
        icon: FaChalkboardTeacher,
        visible: ["admin", "lecturer"],
      },
      {
        label: "Students",
        href: paths.menu.students,
        icon: FaUsers,
        visible: ["admin", "lecturer"],
      },
      // {
      //   label: "Lessons",
      //   href: paths.menu.lessons,
      //   icon: FaBook,
      //   visible: ["admin", "lecturer"],
      // },
      {
        label: "Assignments",
        href: paths.menu.assignments,
        icon: FaClipboardList,
        visible: ["admin", "lecturer", "student", "parent"],
      },
      {
        label: "Attendance",
        href: paths.menu.attendance,
        icon: FaCheckCircle,
        visible: ["admin", "lecturer", "student", "parent"],
      },
      // {
      //   label: "Events",
      //   href: paths.menu.events,
      //   icon: FaCalendarAlt,
      //   visible: ["admin", "lecturer", "student", "parent"],
      // },
      {
        label: "Messages",
        href: paths.menu.messages,
        icon: FaEnvelope,
        visible: ["admin", "lecturer", "student", "parent"],
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        label: "Profile",
        href: paths.profile,
        icon: FaUserCircle,
        visible: ["admin", "lecturer", "student", "parent"],
      },
      {
        label: "Settings",
        href: paths.settings,
        icon: FaCog,
        visible: ["admin", "lecturer", "student", "parent"],
      },
      {
        label: "Logout",
        href: paths.logout,
        icon: FaSignOutAlt,
        visible: ["admin", "lecturer", "student", "parent"],
      },
    ],
  },
];

const Menu = () => {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          // Convert role to lowercase to match menu visibility checks
          setRole(data.user.role.toLowerCase());
        } else {
          setRole("");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const menuSection = menuItems[0].items.filter((item) =>
    item.visible.includes(role)
  );
  const otherSection = menuItems[1].items.filter((item) =>
    item.visible.includes(role)
  );

  const isActive = (href: string) => {
    // Exact match or startsWith for subpages
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLogoutModalOpen(true);
  };

  // Show loading state while fetching user role
  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 p-2">
        <span className="hidden lg:block text-black font-semibold my-2">
          MENU
        </span>
        <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 p-2">
      <span className="hidden lg:block text-black font-semibold my-2">
        MENU
      </span>
      <div className="flex-1 min-h-0 overflow-auto">
        {menuSection.length > 0 && (
          <div className="flex flex-col gap-2">
            {menuSection.map((item) => (
              <Link
                href={item.href}
                key={item.label}
                className={`flex items-center justify-center lg:justify-start gap-4 py-2 md:px-2 rounded-md transition-colors
                  ${
                    isActive(item.href)
                      ? "bg-primary text-white"
                      : "text-black hover:bg-primary hover:text-white"
                  }`}
              >
                <item.icon size={20} />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      {otherSection.length > 0 && (
        <div className="flex flex-col gap-2 pb-2 pt-2">
          <span className="hidden lg:block text-black font-semibold my-2">
            OTHER
          </span>
          {otherSection.map((item) => {
            if (item.label === "Logout") {
              return (
                <button
                  key={item.label}
                  onClick={handleLogoutClick}
                  className="flex items-center justify-center lg:justify-start gap-4 py-2 md:px-2 rounded-md transition-colors text-black hover:bg-primary hover:text-white w-full"
                >
                  <item.icon size={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </button>
              );
            }
            return (
              <Link
                href={item.href}
                key={item.label}
                className={`flex items-center justify-center lg:justify-start gap-4 py-2 md:px-2 rounded-md transition-colors
                  ${
                    isActive(item.href)
                      ? "bg-primary text-white"
                      : "text-black hover:bg-primary hover:text-white"
                  }`}
              >
                <item.icon size={20} />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
};

export default Menu;
