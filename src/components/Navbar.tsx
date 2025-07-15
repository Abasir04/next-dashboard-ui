"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null>(null);
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
          role: data.user.role,
        });
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const getDisplayName = () => {
    if (loading) return "...";
    if (!user || !user.firstName) return "Guest";
    // If lastName is missing, just show firstName
    return user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName;
  };

  const getDisplayRole = () => {
    if (loading) return "...";
    if (!user || !user.role) return "Unknown";
    return user.role;
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white">
      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder="Search..."
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>
      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
          <Image src="/message.png" alt="" width={20} height={20} />
        </div>
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
