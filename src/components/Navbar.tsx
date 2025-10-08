"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    title?: string;
    role?: string;
  } | null>(null);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error("Not authenticated");
        const data = await res.json();
        setUser({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          title: data.user.title,
          role: data.user.role,
        });
        setRole(data.user?.role?.toLowerCase() || "");
      } catch (err) {
        setUser(null);
        setRole("");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const capitalize = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  const getDisplayName = () => {
    if (loading) return "...";
    if (!user || !user.firstName) return "Guest";
    const title = capitalize(user.title);
    return user.lastName
      ? `${title} ${user.firstName} ${user.lastName}`.trim()
      : `${title} ${user.firstName}`.trim();
  };

  const getDisplayRole = () => {
    if (loading) return "...";
    if (!role) return "Unknown";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Get current academic session (University of Ibadan format)
  const getCurrentAcademicSession = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11 (Jan = 0, Dec = 11)

    // Academic year starts in September (month 8) and ends in August (month 7)
    // We are one session behind, so we show the previous academic year
    if (currentMonth >= 8) {
      // September-December: Show previous academic year
      return `${currentYear - 1}/${currentYear}`;
    } else {
      // January-August: Show the academic year that started in previous September
      return `${currentYear - 1}/${currentYear}`;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white">
      {/* ACADEMIC SESSION & QUICK ACTIONS */}
      <div className="flex items-center gap-4">
        {/* Academic Session Display - Desktop */}
        <div className="hidden md:flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-blue-700 whitespace-nowrap">
            Academic Session: {getCurrentAcademicSession()}
          </span>
        </div>

        {/* Academic Session Display - Mobile */}
        <div className="md:hidden flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-blue-700 whitespace-nowrap">
            {getCurrentAcademicSession()}
          </span>
        </div>
      </div>
      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        {/* Message icon commented out as requested */}
        {/* <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
          <Image src="/message.png" alt="" width={20} height={20} />
        </div> */}
        {/* <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative'>
          <Image src="/announcement.png" alt="" width={20} height={20}/>
          <div className='absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs'>1</div>
        </div> */}
        <div className="flex flex-col">
          <span className="text-sm leading-3 font-medium">
            {getDisplayName()}
          </span>
          <span className="text-[10px] text-gray-700 text-right">
            {getDisplayRole()}
          </span>
        </div>
        <Image
          src="/avatar.png"
          alt=""
          width={36}
          height={36}
          className="rounded-full"
        />
      </div>
    </div>
  );
};

export default Navbar;
