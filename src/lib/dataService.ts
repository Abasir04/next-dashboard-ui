import { prisma } from "./prisma";

// Get current user role (you'll need to implement this based on your auth system)
export const getCurrentUserRole = async (): Promise<string> => {
  // This should be implemented based on your authentication system
  // For now, returning a default role
  return "admin";
};

// Teachers data
export const getTeachersData = async () => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subjects: {
          include: {
            subject: true,
          },
        },
        classes: {
          include: {
            class: true,
          },
        },
      },
    });

    return teachers.map((teacher) => ({
      id: teacher.id,
      teacherId: teacher.teacherId,
      name: teacher.name,
      email: teacher.email,
      photo: teacher.photo || "",
      phone: teacher.phone,
      subjects: teacher.subjects.map((ts) => ts.subject.name),
      classes: teacher.classes.map((tc) => tc.class.name),
      address: teacher.address,
    }));
  } catch (error) {
    console.error("Error fetching teachers:", error);
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
        teachers: {
          include: {
            teacher: true,
          },
        },
      },
    });

    return subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      teachers: subject.teachers.map((ts) => ts.teacher.name),
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
        subject: true,
        class: true,
        teacher: true,
      },
    });

    return lessons.map((lesson) => ({
      id: lesson.id,
      subject: lesson.subject.name,
      class: lesson.class.name,
      teacher: lesson.teacher.name,
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
        subject: true,
        class: true,
        teacher: true,
      },
    });

    return exams.map((exam) => ({
      id: exam.id,
      subject: exam.subject.name,
      class: exam.class.name,
      teacher: exam.teacher.name,
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
        subject: true,
        class: true,
        teacher: true,
      },
    });

    return assignments.map((assignment) => ({
      id: assignment.id,
      subject: assignment.subject.name,
      class: assignment.class.name,
      teacher: assignment.teacher.name,
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
        subject: true,
        class: true,
        teacher: true,
        student: true,
      },
    });

    return results.map((result) => ({
      id: result.id,
      subject: result.subject.name,
      class: result.class.name,
      teacher: result.teacher.name,
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
        class: true,
      },
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      class: event.class.name,
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
        class: true,
      },
    });

    return announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      class: announcement.class.name,
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

// Materials data (aggregate lessons and assignments as course materials)
export const getMaterialsData = async () => {
  try {
    const [lessons, assignments] = await Promise.all([
      prisma.lesson.findMany({
        include: { subject: true, class: true, teacher: true },
      }),
      prisma.assignment.findMany({
        include: { subject: true, class: true, teacher: true },
      }),
    ]);

    const lessonMaterials = lessons.map((lesson) => ({
      id: `lesson-${lesson.id}`,
      type: "lesson" as const,
      subject: lesson.subject.name,
      class: lesson.class.name,
      teacher: lesson.teacher.name,
      date: lesson.createdAt.toISOString().split("T")[0],
    }));

    const assignmentMaterials = assignments.map((assignment) => ({
      id: `assignment-${assignment.id}`,
      type: "assignment" as const,
      subject: assignment.subject.name,
      class: assignment.class.name,
      teacher: assignment.teacher.name,
      date: assignment.dueDate.toISOString().split("T")[0],
    }));

    // Merge and sort by date desc
    return [...lessonMaterials, ...assignmentMaterials].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    );
  } catch (error) {
    console.error("Error fetching materials:", error);
    return [];
  }
};
