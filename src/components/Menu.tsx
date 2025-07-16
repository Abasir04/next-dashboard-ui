"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentUserRole } from "@/lib/dataService";
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

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        label: "Home",
        href: paths.home,
        icon: FaHome,
        visible: ["admin", "lecturer", "student", "parent"],
      },
      {
        label: "Lecturers",
        href: paths.list.lecturers,
        icon: FaUser,
        visible: ["admin", "lecturer"],
      },
      {
        label: "Students",
        href: paths.list.students,
        icon: FaUsers,
        visible: ["admin", "lecturer"],
      },
      {
        label: "Courses",
        href: paths.list.courses,
        icon: FaBook,
        visible: ["admin"],
      },
      {
        label: "Levels",
        href: paths.list.levels,
        icon: FaChalkboardTeacher,
        visible: ["admin", "lecturer"],
      },
      {
        label: "Lessons",
        href: paths.list.lessons,
        icon: FaBook,
        visible: ["admin", "lecturer"],
      },
      {
        label: "Assignments",
        href: paths.list.assignments,
        icon: FaClipboardList,
        visible: ["admin", "lecturer", "student", "parent"],
      },
      {
        label: "Attendance",
        href: paths.list.attendance,
        icon: FaCheckCircle,
        visible: ["admin", "lecturer", "student", "parent"],
      },
      {
        label: "Events",
        href: paths.list.events,
        icon: FaCalendarAlt,
        visible: ["admin", "lecturer", "student", "parent"],
      },
      {
        label: "Messages",
        href: paths.list.messages,
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

  useEffect(() => {
    (async () => {
      const r = await getCurrentUserRole();
      setRole(r);
    })();
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
          {otherSection.map((item) => (
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
  );
};

export default Menu;
