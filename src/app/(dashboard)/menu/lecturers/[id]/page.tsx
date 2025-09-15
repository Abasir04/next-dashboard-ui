import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import FormModal from "@/components/FormModal";
import Performance from "@/components/Performance";
import LecturerCourses from "@/components/LecturerCourses";
import { getCurrentUserRole } from "@/lib/serverDataService";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

interface SingleLecturerPageProps {
  params: { id: string };
}

const SingleLecturerPage = async ({ params }: SingleLecturerPageProps) => {
  const role = await getCurrentUserRole();
  const lecturerId = parseInt(params.id);

  // Fetch lecturer data
  const lecturer = await prisma.lecturer.findUnique({
    where: { id: lecturerId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      title: true,
      role: true,
      photo: true,
      createdAt: true,
    },
  });

  if (!lecturer) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Lecturer Not Found
          </h1>
          <p className="text-gray-600">
            The requested lecturer could not be found.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src="https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">{lecturer.name}</h1>
                <span className="text-sm text-gray-500">
                  ({lecturer.title})
                </span>
                {(role === "admin" || role === "lecturer") && (
                  <FormModal
                    table="lecturer"
                    type="update"
                    data={{
                      id: lecturer.id,
                      name: lecturer.name,
                      email: lecturer.email,
                      phone: lecturer.phone,
                      address: lecturer.address,
                      title: lecturer.title,
                      role: lecturer.role,
                      img:
                        lecturer.photo ||
                        "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=1200",
                    }}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500">
                {lecturer.role} - Joined{" "}
                {new Date(lecturer.createdAt).toLocaleDateString()}
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{lecturer.email}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{lecturer.phone}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/profile.png" alt="" width={14} height={14} />
                  <span>{lecturer.title}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">90%</h1>
                <span className="text-sm text-gray-400">Attendance</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">2</h1>
                <span className="text-sm text-gray-400">Branches</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">6</h1>
                <span className="text-sm text-gray-400">Lessons</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">6</h1>
                <span className="text-sm text-gray-400">Classes</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM - COURSES MODULE */}
        <div className="mt-4">
          <LecturerCourses lecturerId={lecturerId} userRole={role} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Quick Actions</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href="/menu/courses"
            >
              All Courses
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaPurpleLight"
              href="/menu/lessons"
            >
              Lessons
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaYellowLight"
              href="/menu/exams"
            >
              Exams
            </Link>
            <Link
              className="p-3 rounded-md bg-pink-50"
              href="/menu/assignments"
            >
              Assignments
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href="/menu/students"
            >
              Students
            </Link>
          </div>
        </div>

        {/* SCHEDULE */}
        <div className="bg-white rounded-md p-4 h-[400px]">
          <h1 className="text-xl font-semibold mb-4">Schedule</h1>
          <BigCalendar />
        </div>
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleLecturerPage;
