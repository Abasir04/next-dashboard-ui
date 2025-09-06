import { prisma } from "./prisma";
import { cookies } from "next/headers";
import { verifyToken } from "./auth";

// Get current user role (server-side)
export const getCurrentUserRole = async (): Promise<string> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return "";
    }

    const payload = verifyToken(token);

    if (!payload) {
      return "";
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        role: true,
      },
    });

    return user?.role?.toLowerCase() || "";
  } catch (error) {
    console.error("Error getting current user role:", error);
    return "";
  }
};

// Lecturers data (server-side)
export const getLecturersData = async () => {
  try {
    const lecturers = await prisma.lecturer.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return lecturers.map((lecturer) => ({
      id: lecturer.id,
      lecturerId: lecturer.lecturerId,
      name: lecturer.name,
      email: lecturer.email,
      photo: lecturer.photo || "",
      phone: lecturer.phone,
      address: lecturer.address,
      // Add more fields as needed
    }));
  } catch (error) {
    console.error("Error fetching lecturers:", error);
    return [];
  }
};

// Courses data (server-side)
export const getCoursesData = async () => {
  try {
    const courses = await prisma.course.findMany();
    return courses.map((course) => ({
      id: course.id,
      name: course.name,
    }));
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
};

// Levels data (server-side)
export const getLevelsData = async () => {
  try {
    const levels = await prisma.level.findMany();
    return levels.map((lvl) => ({
      id: lvl.id,
      name: lvl.name,
      capacity: lvl.capacity,
      grade: lvl.grade,
      supervisor: lvl.supervisor,
    }));
  } catch (error) {
    console.error("Error fetching levels:", error);
    return [];
  }
};

// Students data (server-side)
export const getStudentsData = async () => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        level: true,
      },
    });

    return students.map((student) => ({
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      photo: student.photo || "",
      phone: student.phone,
      grade: student.grade,
      level: student.level?.name,
      address: student.address,
    }));
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
};

// Lessons data (server-side)
export const getLessonsData = async () => {
  try {
    const lessons = await prisma.lesson.findMany({
      include: {
        course: true,
        level: true,
        lecturer: true,
      },
    });

    return lessons.map((lesson) => ({
      id: lesson.id,
      course: lesson.course.name,
      level: lesson.level.name,
      lecturer: lesson.lecturer.name,
    }));
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return [];
  }
};

// Exams data (server-side)
export const getExamsData = async () => {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        course: true,
        level: true,
        lecturer: true,
      },
    });

    return exams.map((exam) => ({
      id: exam.id,
      course: exam.course.name,
      level: exam.level.name,
      lecturer: exam.lecturer.name,
      date: exam.date.toISOString().split("T")[0],
    }));
  } catch (error) {
    console.error("Error fetching exams:", error);
    return [];
  }
};

// Assignments data (server-side)
export const getAssignmentsData = async () => {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        course: true,
        level: true,
        lecturer: true,
      },
    });

    return assignments.map((assignment) => ({
      id: assignment.id,
      course: assignment.course.name,
      level: assignment.level.name,
      lecturer: assignment.lecturer.name,
      dueDate: assignment.dueDate.toISOString().split("T")[0],
    }));
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return [];
  }
};

// Results data (server-side)
export const getResultsData = async () => {
  try {
    const results = await prisma.result.findMany({
      include: {
        course: true,
        level: true,
        lecturer: true,
        student: true,
      },
    });

    return results.map((result) => ({
      id: result.id,
      course: result.course.name,
      level: result.level.name,
      lecturer: result.lecturer.name,
      student: result.student.name,
      date: result.date.toISOString().split("T")[0],
      type: result.type,
      score: result.score,
    }));
  } catch (error) {
    console.error("Error fetching results:", error);
    return [];
  }
};

// Events data (server-side)
export const getEventsData = async () => {
  try {
    const events = await prisma.event.findMany({
      include: {
        level: true,
      },
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      level: event.level.name,
      date: event.date.toISOString().split("T")[0],
      startTime: event.startTime,
      endTime: event.endTime,
    }));
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
};

// Announcements data (server-side)
export const getAnnouncementsData = async () => {
  try {
    const announcements = await prisma.announcement.findMany({
      include: {
        level: true,
      },
    });

    return announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      level: announcement.level.name,
      date: announcement.date.toISOString().split("T")[0],
    }));
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }
};

// Calendar events data (server-side)
export const getCalendarEvents = async () => {
  try {
    const events = await prisma.calendarEvent.findMany();

    return events.map((event) => ({
      title: event.title,
      allDay: event.allDay,
      start: event.start,
      end: event.end,
    }));
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }
};
