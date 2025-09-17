import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data
  console.log("🧹 Clearing existing data...");
  await prisma.calendarEvent.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.event.deleteMany();
  await prisma.result.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.student.deleteMany();
  await prisma.lecturer.deleteMany();
  await prisma.course.deleteMany();
  await prisma.level.deleteMany();
  await prisma.user.deleteMany();

  // Create levels first
  console.log("🏫 Creating levels...");
  const levels = [
    { name: "1A", capacity: 20, grade: 1, supervisor: "Joseph Padilla" },
    { name: "2B", capacity: 22, grade: 2, supervisor: "Blake Joseph" },
    { name: "3C", capacity: 20, grade: 3, supervisor: "Tom Bennett" },
    { name: "4B", capacity: 18, grade: 4, supervisor: "Aaron Collins" },
    { name: "5A", capacity: 16, grade: 5, supervisor: "Iva Frank" },
    { name: "5B", capacity: 20, grade: 5, supervisor: "Leila Santos" },
    { name: "7A", capacity: 18, grade: 7, supervisor: "Carrie Walton" },
    { name: "6B", capacity: 22, grade: 6, supervisor: "Christopher Butler" },
    { name: "6C", capacity: 18, grade: 6, supervisor: "Marc Miller" },
    { name: "6D", capacity: 20, grade: 6, supervisor: "Ophelia Marsh" },
  ];

  const createdLevels = await Promise.all(
    levels.map((lvl) => prisma.level.create({ data: lvl }))
  );

  // Create users and lecturers
  console.log("👨‍🏫 Creating lecturers...");
  const lecturersData = [
    {
      lecturerId: "T001",
      name: "John Doe",
      email: "john@doe.com",
      photo:
        "https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      subjects: ["Math", "Geometry"],
      classes: ["1B", "2A", "3C"],
      address: "123 Main St, Anytown, USA",
    },
    {
      lecturerId: "T002",
      name: "Jane Doe",
      email: "jane@doe.com",
      photo:
        "https://images.pexels.com/photos/936126/pexels-photo-936126.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      subjects: ["Physics", "Chemistry"],
      classes: ["5A", "4B", "3C"],
      address: "123 Main St, Anytown, USA",
    },
    {
      lecturerId: "T003",
      name: "Mike Geller",
      email: "mike@geller.com",
      photo:
        "https://images.pexels.com/photos/428328/pexels-photo-428328.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      subjects: ["Biology"],
      classes: ["5A", "4B", "3C"],
      address: "123 Main St, Anytown, USA",
    },
    {
      lecturerId: "T004",
      name: "Jay French",
      email: "jay@gmail.com",
      photo:
        "https://images.pexels.com/photos/1187765/pexels-photo-1187765.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      subjects: ["History"],
      classes: ["5A", "4B", "3C"],
      address: "123 Main St, Anytown, USA",
    },
    {
      lecturerId: "T005",
      name: "Jane Smith",
      email: "jane@gmail.com",
      photo:
        "https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      subjects: ["Music", "History"],
      classes: ["5A", "4B", "3C"],
      address: "123 Main St, Anytown, USA",
    },
    {
      lecturerId: "T006",
      name: "Anna Santiago",
      email: "anna@gmail.com",
      photo:
        "https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      subjects: ["Physics"],
      classes: ["5A", "4B", "3C"],
      address: "123 Main St, Anytown, USA",
    },
    {
      lecturerId: "T007",
      name: "Allen Black",
      email: "allen@black.com",
      photo:
        "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      subjects: ["English", "Spanish"],
      classes: ["5A", "4B", "3C"],
      address: "123 Main St, Anytown, USA",
    },
    {
      lecturerId: "T008",
      name: "Ophelia Castro",
      email: "ophelia@castro.com",
      photo:
        "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      subjects: ["Math", "Geometry"],
      classes: ["5A", "4B", "3C"],
      address: "123 Main St, Anytown, USA",
    },
    {
      lecturerId: "T009",
      name: "Derek Briggs",
      email: "derek@briggs.com",
      photo:
        "https://images.pexels.com/photos/842980/pexels-photo-842980.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      subjects: ["Literature", "English"],
      classes: ["5A", "4B", "3C"],
      address: "123 Main St, Anytown, USA",
    },
    {
      lecturerId: "T010",
      name: "John Glover",
      email: "john@glover.com",
      photo:
        "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      subjects: ["Biology"],
      classes: ["5A", "4B", "3C"],
      address: "123 Main St, Anytown, USA",
    },
  ];

  const hashedPassword = await bcrypt.hash("password123", 12);
  const createdLecturers = [];

  for (const lecturerData of lecturersData) {
    const user = await prisma.user.create({
      data: {
        email: lecturerData.email,
        password: hashedPassword,
        firstName: lecturerData.name.split(" ")[0],
        lastName: lecturerData.name.split(" ")[1] || "",
        role: "LECTURER",
        title: "mr",
      },
    });

    const lecturer = await prisma.lecturer.create({
      data: {
        lecturerId: lecturerData.lecturerId,
        name: lecturerData.name,
        email: lecturerData.email,
        photo: lecturerData.photo,
        phone: lecturerData.phone,
        address: lecturerData.address,
        userId: user.id,
        title: "mr",
        role: "lecturer",
      },
    });

    // Note: Course assignments are handled after all lecturers are created

    // Create lecturer-class relationships
    for (const className of lecturerData.classes) {
      const classObj = createdLevels.find((c) => c.name === className);
      if (classObj) {
        // This block is removed as per the edit hint.
      }
    }

    createdLecturers.push(lecturer);
  }

  // Create courses and assign them to lecturers
  console.log("📚 Creating courses...");
  const courses = [
    { name: "Math", code: "MATH101", level: 100 },
    { name: "English", code: "ENG101", level: 100 },
    { name: "Physics", code: "PHYS101", level: 100 },
    { name: "Chemistry", code: "CHEM101", level: 100 },
    { name: "Biology", code: "BIOL101", level: 100 },
    { name: "History", code: "HIST101", level: 100 },
    { name: "Geography", code: "GEOG101", level: 100 },
    { name: "Art", code: "ART101", level: 100 },
    { name: "Music", code: "MUS101", level: 100 },
    { name: "Literature", code: "LIT101", level: 100 },
    { name: "Geometry", code: "MATH201", level: 200 },
    { name: "Spanish", code: "SPAN101", level: 100 },
  ];

  const createdCourses = [];
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const lecturer = createdLecturers[i % createdLecturers.length]; // Distribute courses among lecturers

    const createdCourse = await prisma.course.create({
      data: {
        ...course,
        lecturerId: lecturer.id,
      },
    });
    createdCourses.push(createdCourse);
  }

  // Create users and students
  console.log("👨‍🎓 Creating students...");
  const studentsData = [
    {
      matricNumber: "100001",
      name: "John Doe",
      email: "john.student@doe.com",
      photo:
        "https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      grade: 5,
      class: "5A",
      address: "123 Main St, Anytown, USA",
    },
    {
      matricNumber: "100002",
      name: "Jane Doe",
      email: "jane.student@doe.com",
      photo:
        "https://images.pexels.com/photos/936126/pexels-photo-936126.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      grade: 5,
      class: "5A",
      address: "123 Main St, Anytown, USA",
    },
    {
      matricNumber: "100003",
      name: "Mike Geller",
      email: "mike.student@geller.com",
      photo:
        "https://images.pexels.com/photos/428328/pexels-photo-428328.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      grade: 5,
      class: "5A",
      address: "123 Main St, Anytown, USA",
    },
    {
      matricNumber: "100004",
      name: "Jay French",
      email: "jay.student@gmail.com",
      photo:
        "https://images.pexels.com/photos/1187765/pexels-photo-1187765.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      grade: 5,
      class: "5A",
      address: "123 Main St, Anytown, USA",
    },
    {
      matricNumber: "100005",
      name: "Jane Smith",
      email: "jane.student@gmail.com",
      photo:
        "https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      grade: 5,
      class: "5A",
      address: "123 Main St, Anytown, USA",
    },
    {
      matricNumber: "100006",
      name: "Anna Santiago",
      email: "anna.student@gmail.com",
      photo:
        "https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      grade: 5,
      class: "5A",
      address: "123 Main St, Anytown, USA",
    },
    {
      matricNumber: "100007",
      name: "Allen Black",
      email: "allen.student@black.com",
      photo:
        "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      grade: 5,
      class: "5A",
      address: "123 Main St, Anytown, USA",
    },
    {
      matricNumber: "100008",
      name: "Ophelia Castro",
      email: "ophelia.student@castro.com",
      photo:
        "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      grade: 5,
      class: "5A",
      address: "123 Main St, Anytown, USA",
    },
    {
      matricNumber: "100009",
      name: "Derek Briggs",
      email: "derek.student@briggs.com",
      photo:
        "https://images.pexels.com/photos/842980/pexels-photo-842980.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      grade: 5,
      class: "5A",
      address: "123 Main St, Anytown, USA",
    },
    {
      matricNumber: "100010",
      name: "John Glover",
      email: "john.student@glover.com",
      photo:
        "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1200",
      phone: "1234567890",
      grade: 5,
      class: "5A",
      address: "123 Main St, Anytown, USA",
    },
  ];

  const createdStudents = [];

  for (const studentData of studentsData) {
    const classObj = createdLevels.find((c) => c.name === studentData.class);
    if (!classObj) continue;
    // Use levelId instead of classId
    const user = await prisma.user.create({
      data: {
        email: studentData.email,
        password: hashedPassword,
        firstName: studentData.name.split(" ")[0],
        lastName: studentData.name.split(" ")[1] || "",
        role: "STUDENT",
        title: "mr",
      },
    });
    const student = await (prisma as any).student.create({
      data: {
        matricNumber: studentData.matricNumber,
        name: `${studentData.name.split(" ")[1] ?? ""} ${
          studentData.name.split(" ")[0]
        }`,
        email: studentData.email,
        photo: studentData.photo,
        phone: studentData.phone,
        grade: studentData.grade,
        levelId: classObj.id,
        address: studentData.address,
        userId: user.id,
        title: "mr",
        role: "student",
      },
    });

    createdStudents.push(student);
  }

  // Create lessons
  console.log("📖 Creating lessons...");
  const lessonsData = [
    { subject: "Math", class: "1A", teacher: "John Doe" },
    { subject: "English", class: "2A", teacher: "Jane Doe" },
    { subject: "Science", class: "3A", teacher: "Mike Geller" },
    { subject: "Social Studies", class: "1B", teacher: "Jay French" },
    { subject: "Art", class: "4A", teacher: "Jane Smith" },
    { subject: "Music", class: "5A", teacher: "Anna Santiago" },
    { subject: "History", class: "6A", teacher: "Allen Black" },
    { subject: "Geography", class: "6B", teacher: "Ophelia Castro" },
    { subject: "Physics", class: "6C", teacher: "Derek Briggs" },
    { subject: "Chemistry", class: "4B", teacher: "John Glover" },
  ];

  for (const lessonData of lessonsData) {
    const subject = createdCourses.find((s) => s.name === lessonData.subject);
    const levelObj = createdLevels.find((c) => c.name === lessonData.class);
    const teacher = createdLecturers.find((t) => t.name === lessonData.teacher);
    if (subject && levelObj && teacher) {
      await prisma.lesson.create({
        data: {
          courseId: subject.id,
          levelId: levelObj.id,
          lecturerId: teacher.id,
        },
      });
    }
  }

  // Create exams
  console.log("📝 Creating exams...");
  const examsData = [
    { subject: "Math", class: "1A", teacher: "John Doe", date: "2025-01-01" },
    {
      subject: "English",
      class: "2A",
      teacher: "Jane Doe",
      date: "2025-01-01",
    },
    {
      subject: "Science",
      class: "3A",
      teacher: "Mike Geller",
      date: "2025-01-01",
    },
    {
      subject: "Social Studies",
      class: "1B",
      teacher: "Jay French",
      date: "2025-01-01",
    },
    { subject: "Art", class: "4A", teacher: "Jane Smith", date: "2025-01-01" },
    {
      subject: "Music",
      class: "5A",
      teacher: "Anna Santiago",
      date: "2025-01-01",
    },
    {
      subject: "History",
      class: "6A",
      teacher: "Allen Black",
      date: "2025-01-01",
    },
    {
      subject: "Geography",
      class: "6B",
      teacher: "Ophelia Castro",
      date: "2025-01-01",
    },
    {
      subject: "Physics",
      class: "7A",
      teacher: "Derek Briggs",
      date: "2025-01-01",
    },
    {
      subject: "Chemistry",
      class: "8A",
      teacher: "John Glover",
      date: "2025-01-01",
    },
  ];

  for (const examData of examsData) {
    const subject = createdCourses.find((s) => s.name === examData.subject);
    const levelObj = createdLevels.find((c) => c.name === examData.class);
    const teacher = createdLecturers.find((t) => t.name === examData.teacher);
    if (subject && levelObj && teacher) {
      await prisma.exam.create({
        data: {
          courseId: subject.id,
          levelId: levelObj.id,
          lecturerId: teacher.id,
          date: new Date(examData.date),
        },
      });
    }
  }

  // Create assignments
  console.log("📋 Creating assignments...");
  const assignmentsData = [
    {
      subject: "Math",
      class: "1A",
      teacher: "John Doe",
      dueDate: "2025-01-01",
    },
    {
      subject: "English",
      class: "2A",
      teacher: "Jane Doe",
      dueDate: "2025-01-01",
    },
    {
      subject: "Science",
      class: "3A",
      teacher: "Mike Geller",
      dueDate: "2025-01-01",
    },
    {
      subject: "Social Studies",
      class: "1B",
      teacher: "Jay French",
      dueDate: "2025-01-01",
    },
    {
      subject: "Art",
      class: "4A",
      teacher: "Jane Smith",
      dueDate: "2025-01-01",
    },
    {
      subject: "Music",
      class: "5A",
      teacher: "Anna Santiago",
      dueDate: "2025-01-01",
    },
    {
      subject: "History",
      class: "6A",
      teacher: "Allen Black",
      dueDate: "2025-01-01",
    },
    {
      subject: "Geography",
      class: "6B",
      teacher: "Ophelia Castro",
      dueDate: "2025-01-01",
    },
    {
      subject: "Physics",
      class: "7A",
      teacher: "Derek Briggs",
      dueDate: "2025-01-01",
    },
    {
      subject: "Chemistry",
      class: "8A",
      teacher: "John Glover",
      dueDate: "2025-01-01",
    },
  ];

  for (const assignmentData of assignmentsData) {
    const subject = createdCourses.find(
      (s) => s.name === assignmentData.subject
    );
    const levelObj = createdLevels.find((c) => c.name === assignmentData.class);
    const teacher = createdLecturers.find(
      (t) => t.name === assignmentData.teacher
    );

    if (subject && levelObj && teacher) {
      await prisma.assignment.create({
        data: {
          title: `Assignment for ${subject.name}`,
          description: `Assignment description for ${subject.name}`,
          courseId: subject.id,
          levelId: levelObj.id,
          lecturerId: teacher.id,
          startDate: new Date(assignmentData.dueDate),
          dueDate: new Date(assignmentData.dueDate),
        },
      });
    }
  }

  // Create results
  console.log("📊 Creating results...");
  for (const student of createdStudents) {
    for (const course of createdCourses.slice(0, 5)) {
      const levelObj = createdLevels.find((c) => c.id === student.levelId);
      const lecturer = createdLecturers[0];
      if (levelObj && lecturer) {
        await prisma.result.create({
          data: {
            courseId: course.id,
            levelId: levelObj.id,
            lecturerId: lecturer.id,
            studentId: student.id,
            date: new Date("2025-01-01"),
            type: "exam",
            score: Math.floor(Math.random() * 30) + 70,
          },
        });
      }
    }
  }

  // Create events
  console.log("🎉 Creating events...");
  const eventsData = [
    {
      title: "Lake Trip",
      class: "1A",
      date: "2025-01-01",
      startTime: "10:00",
      endTime: "11:00",
    },
    {
      title: "Picnic",
      class: "2A",
      date: "2025-01-01",
      startTime: "10:00",
      endTime: "11:00",
    },
    {
      title: "Beach Trip",
      class: "3A",
      date: "2025-01-01",
      startTime: "10:00",
      endTime: "11:00",
    },
    {
      title: "Museum Trip",
      class: "4A",
      date: "2025-01-01",
      startTime: "10:00",
      endTime: "11:00",
    },
    {
      title: "Music Concert",
      class: "5A",
      date: "2025-01-01",
      startTime: "10:00",
      endTime: "11:00",
    },
    {
      title: "Magician Show",
      class: "1B",
      date: "2025-01-01",
      startTime: "10:00",
      endTime: "11:00",
    },
    {
      title: "Lake Trip",
      class: "2B",
      date: "2025-01-01",
      startTime: "10:00",
      endTime: "11:00",
    },
    {
      title: "Cycling Race",
      class: "3B",
      date: "2025-01-01",
      startTime: "10:00",
      endTime: "11:00",
    },
    {
      title: "Art Exhibition",
      class: "4B",
      date: "2025-01-01",
      startTime: "10:00",
      endTime: "11:00",
    },
    {
      title: "Sports Tournament",
      class: "5B",
      date: "2025-01-01",
      startTime: "10:00",
      endTime: "11:00",
    },
  ];

  for (const eventData of eventsData) {
    const levelObj = createdLevels.find((c) => c.name === eventData.class);
    if (levelObj) {
      await prisma.event.create({
        data: {
          title: eventData.title,
          levelId: levelObj.id,
          date: new Date(eventData.date),
          startTime: eventData.startTime,
          endTime: eventData.endTime,
        },
      });
    }
  }

  // Create announcements
  console.log("📢 Creating announcements...");
  const announcementsData = [
    { title: "About 4A Math Test", class: "4A", date: "2025-01-01" },
    { title: "About 3A Math Test", class: "3A", date: "2025-01-01" },
    { title: "About 3B Math Test", class: "3B", date: "2025-01-01" },
    { title: "About 6A Math Test", class: "6A", date: "2025-01-01" },
    { title: "About 8C Math Test", class: "8C", date: "2025-01-01" },
    { title: "About 2A Math Test", class: "2A", date: "2025-01-01" },
    { title: "About 4C Math Test", class: "4C", date: "2025-01-01" },
    { title: "About 4B Math Test", class: "4B", date: "2025-01-01" },
    { title: "About 3C Math Test", class: "3C", date: "2025-01-01" },
    { title: "About 1C Math Test", class: "1C", date: "2025-01-01" },
  ];

  for (const announcementData of announcementsData) {
    const levelObj = createdLevels.find(
      (c) => c.name === announcementData.class
    );
    if (levelObj) {
      await prisma.announcement.create({
        data: {
          title: announcementData.title,
          levelId: levelObj.id,
          date: new Date(announcementData.date),
        },
      });
    }
  }

  // Create calendar events
  console.log("📅 Creating calendar events...");
  const calendarEvents = [
    {
      title: "Math",
      allDay: false,
      start: new Date(2024, 7, 12, 8, 0),
      end: new Date(2024, 7, 12, 8, 45),
    },
    {
      title: "English",
      allDay: false,
      start: new Date(2024, 7, 12, 9, 0),
      end: new Date(2024, 7, 12, 9, 45),
    },
    {
      title: "Biology",
      allDay: false,
      start: new Date(2024, 7, 12, 10, 0),
      end: new Date(2024, 7, 12, 10, 45),
    },
    {
      title: "Physics",
      allDay: false,
      start: new Date(2024, 7, 12, 11, 0),
      end: new Date(2024, 7, 12, 11, 45),
    },
    {
      title: "Chemistry",
      allDay: false,
      start: new Date(2024, 7, 12, 13, 0),
      end: new Date(2024, 7, 12, 13, 45),
    },
    {
      title: "History",
      allDay: false,
      start: new Date(2024, 7, 12, 14, 0),
      end: new Date(2024, 7, 12, 14, 45),
    },
    {
      title: "English",
      allDay: false,
      start: new Date(2024, 7, 13, 9, 0),
      end: new Date(2024, 7, 13, 9, 45),
    },
    {
      title: "Biology",
      allDay: false,
      start: new Date(2024, 7, 13, 10, 0),
      end: new Date(2024, 7, 13, 10, 45),
    },
    {
      title: "Physics",
      allDay: false,
      start: new Date(2024, 7, 13, 11, 0),
      end: new Date(2024, 7, 13, 11, 45),
    },
    {
      title: "History",
      allDay: false,
      start: new Date(2024, 7, 13, 14, 0),
      end: new Date(2024, 7, 13, 14, 45),
    },
  ];

  for (const event of calendarEvents) {
    await prisma.calendarEvent.create({
      data: event,
    });
  }

  console.log("✅ Database seeding completed successfully!");
  console.log(`📊 Created:
  - ${createdCourses.length} courses
  - ${createdLevels.length} levels
  - ${createdLecturers.length} lecturers
  - ${createdStudents.length} students
  - Multiple lessons, exams, assignments, results, events, announcements, and calendar events
  `);
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
