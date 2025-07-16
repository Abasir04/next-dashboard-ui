import { prisma } from "./prisma";

// Get current user role (you'll need to implement this based on your auth system)
export const getCurrentUserRole = async (): Promise<string> => {
  // This should be implemented based on your authentication system
  // For now, returning a default role
  return "admin";
};

// Lecturers data
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
        courses: {
          include: {
            course: true,
          },
        },
        levels: {
          include: {
            level: true,
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
      courses: lecturer.courses.map((lc) => lc.course.name),
      levels: lecturer.levels.map((ll) => ll.level.name),
      address: lecturer.address,
    }));
  } catch (error) {
    console.error("Error fetching lecturers:", error);
    return [];
  }
};

// Courses data
export const getCoursesData = async () => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        lecturers: {
          include: {
            lecturer: true,
          },
        },
      },
    });

    return courses.map((course) => ({
      id: course.id,
      name: course.name,
      lecturers: course.lecturers.map((lc) => lc.lecturer.name),
    }));
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
};

// Levels data
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

// Students data
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
        class: true,
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
      class: student.class.name,
      address: student.address,
    }));
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
};

// Parents data
export const getParentsData = async () => {
  try {
    const parents = await prisma.parent.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        students: {
          include: {
            student: true,
          },
        },
      },
    });

    return parents.map((parent) => ({
      id: parent.id,
      name: parent.name,
      email: parent.email,
      students: parent.students.map((ps) => ps.student.name),
      phone: parent.phone,
      address: parent.address,
    }));
  } catch (error) {
    console.error("Error fetching parents:", error);
    return [];
  }
};

// Subjects data
export const getSubjectsData = async () => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        lecturers: {
          include: {
            lecturer: true,
          },
        },
      },
    });

    return subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      lecturers: subject.lecturers.map((ts) => ts.lecturer.name),
    }));
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return [];
  }
};

// Classes data
export const getClassesData = async () => {
  try {
    const classes = await prisma.class.findMany();

    return classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      capacity: cls.capacity,
      grade: cls.grade,
      supervisor: cls.supervisor,
    }));
  } catch (error) {
    console.error("Error fetching classes:", error);
    return [];
  }
};

// Lessons data
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

// Exams data
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

// Assignments data
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

// Results data
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

// Events data
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

// Announcements data
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

// Calendar events data
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
