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
  await prisma.teacherClass.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.parentStudent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  // Create subjects
  console.log("📚 Creating subjects...");
  const subjects = [
    { name: "Math" },
    { name: "English" },
    { name: "Physics" },
    { name: "Chemistry" },
    { name: "Biology" },
    { name: "History" },
    { name: "Geography" },
    { name: "Art" },
    { name: "Music" },
    { name: "Literature" },
    { name: "Geometry" },
    { name: "Spanish" },
  ];

  const createdSubjects = await Promise.all(
    subjects.map((subject) => prisma.subject.create({ data: subject }))
  );

  // Create classes
  console.log("🏫 Creating classes...");
  const classes = [
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

  const createdClasses = await Promise.all(
    classes.map((cls) => prisma.class.create({ data: cls }))
  );

  // Create users and teachers
  console.log("👨‍🏫 Creating teachers...");
  const teachersData = [
    {
      teacherId: "T001",
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
      teacherId: "T002",
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
      teacherId: "T003",
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
      teacherId: "T004",
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
      teacherId: "T005",
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
      teacherId: "T006",
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
      teacherId: "T007",
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
      teacherId: "T008",
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
      teacherId: "T009",
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
      teacherId: "T010",
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
  const createdTeachers = [];

  for (const teacherData of teachersData) {
    const user = await prisma.user.create({
      data: {
        email: teacherData.email,
        password: hashedPassword,
        firstName: teacherData.name.split(" ")[0],
        lastName: teacherData.name.split(" ")[1] || "",
        role: "TEACHER",
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        teacherId: teacherData.teacherId,
        name: teacherData.name,
        email: teacherData.email,
        photo: teacherData.photo,
        phone: teacherData.phone,
        address: teacherData.address,
        userId: user.id,
      },
    });

    // Create teacher-subject relationships
    for (const subjectName of teacherData.subjects) {
      const subject = createdSubjects.find((s) => s.name === subjectName);
      if (subject) {
        await prisma.teacherSubject.create({
          data: {
            teacherId: teacher.id,
            subjectId: subject.id,
          },
        });
      }
    }

    // Create teacher-class relationships
    for (const className of teacherData.classes) {
      const classObj = createdClasses.find((c) => c.name === className);
      if (classObj) {
        await prisma.teacherClass.create({
          data: {
            teacherId: teacher.id,
            classId: classObj.id,
          },
        });
      }
    }

    createdTeachers.push(teacher);
  }

  // Create users and students
  console.log("👨‍🎓 Creating students...");
  const studentsData = [
    {
      studentId: "S001",
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
      studentId: "S002",
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
      studentId: "S003",
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
      studentId: "S004",
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
      studentId: "S005",
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
      studentId: "S006",
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
      studentId: "S007",
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
      studentId: "S008",
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
      studentId: "S009",
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
      studentId: "S010",
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
    const classObj = createdClasses.find((c) => c.name === studentData.class);
    if (!classObj) continue;

    const user = await prisma.user.create({
      data: {
        email: studentData.email,
        password: hashedPassword,
        firstName: studentData.name.split(" ")[0],
        lastName: studentData.name.split(" ")[1] || "",
        role: "STUDENT",
      },
    });

    const student = await prisma.student.create({
      data: {
        studentId: studentData.studentId,
        name: studentData.name,
        email: studentData.email,
        photo: studentData.photo,
        phone: studentData.phone,
        grade: studentData.grade,
        classId: classObj.id,
        address: studentData.address,
        userId: user.id,
      },
    });

    createdStudents.push(student);
  }

  // Create users and parents
  console.log("👨‍👩‍👧‍👦 Creating parents...");
  const parentsData = [
    {
      name: "John Doe",
      students: ["John Doe"],
      email: "john.parent@doe.com",
      phone: "1234567890",
      address: "123 Main St, Anytown, USA",
    },
    {
      name: "Jane Doe",
      students: ["Jane Doe"],
      email: "jane.parent@doe.com",
      phone: "1234567890",
      address: "123 Main St, Anytown, USA",
    },
    {
      name: "Mike Geller",
      students: ["Mike Geller"],
      email: "mike.parent@geller.com",
      phone: "1234567890",
      address: "123 Main St, Anytown, USA",
    },
    {
      name: "Jay French",
      students: ["Jay French"],
      email: "jay.parent@gmail.com",
      phone: "1234567890",
      address: "123 Main St, Anytown, USA",
    },
    {
      name: "Jane Smith",
      students: ["Jane Smith"],
      email: "jane.parent@gmail.com",
      phone: "1234567890",
      address: "123 Main St, Anytown, USA",
    },
    {
      name: "Anna Santiago",
      students: ["Anna Santiago"],
      email: "anna.parent@gmail.com",
      phone: "1234567890",
      address: "123 Main St, Anytown, USA",
    },
    {
      name: "Allen Black",
      students: ["Allen Black"],
      email: "allen.parent@black.com",
      phone: "1234567890",
      address: "123 Main St, Anytown, USA",
    },
    {
      name: "Ophelia Castro",
      students: ["Ophelia Castro"],
      email: "ophelia.parent@castro.com",
      phone: "1234567890",
      address: "123 Main St, Anytown, USA",
    },
    {
      name: "Derek Briggs",
      students: ["Derek Briggs"],
      email: "derek.parent@briggs.com",
      phone: "1234567890",
      address: "123 Main St, Anytown, USA",
    },
    {
      name: "John Glover",
      students: ["John Glover"],
      email: "john.parent@glover.com",
      phone: "1234567890",
      address: "123 Main St, Anytown, USA",
    },
  ];

  const createdParents = [];

  for (const parentData of parentsData) {
    const user = await prisma.user.create({
      data: {
        email: parentData.email,
        password: hashedPassword,
        firstName: parentData.name.split(" ")[0],
        lastName: parentData.name.split(" ")[1] || "",
        role: "PARENT",
      },
    });

    const parent = await prisma.parent.create({
      data: {
        name: parentData.name,
        email: parentData.email,
        phone: parentData.phone,
        address: parentData.address,
        userId: user.id,
      },
    });

    // Create parent-student relationships
    for (const studentName of parentData.students) {
      const student = createdStudents.find((s) => s.name === studentName);
      if (student) {
        await prisma.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: student.id,
          },
        });
      }
    }

    createdParents.push(parent);
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
    const subject = createdSubjects.find((s) => s.name === lessonData.subject);
    const classObj = createdClasses.find((c) => c.name === lessonData.class);
    const teacher = createdTeachers.find((t) => t.name === lessonData.teacher);

    if (subject && classObj && teacher) {
      await prisma.lesson.create({
        data: {
          subjectId: subject.id,
          classId: classObj.id,
          teacherId: teacher.id,
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
    const subject = createdSubjects.find((s) => s.name === examData.subject);
    const classObj = createdClasses.find((c) => c.name === examData.class);
    const teacher = createdTeachers.find((t) => t.name === examData.teacher);

    if (subject && classObj && teacher) {
      await prisma.exam.create({
        data: {
          subjectId: subject.id,
          classId: classObj.id,
          teacherId: teacher.id,
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
    const subject = createdSubjects.find(
      (s) => s.name === assignmentData.subject
    );
    const classObj = createdClasses.find(
      (c) => c.name === assignmentData.class
    );
    const teacher = createdTeachers.find(
      (t) => t.name === assignmentData.teacher
    );

    if (subject && classObj && teacher) {
      await prisma.assignment.create({
        data: {
          subjectId: subject.id,
          classId: classObj.id,
          teacherId: teacher.id,
          dueDate: new Date(assignmentData.dueDate),
        },
      });
    }
  }

  // Create results
  console.log("📊 Creating results...");
  for (const student of createdStudents) {
    for (const subject of createdSubjects.slice(0, 5)) {
      // First 5 subjects
      const classObj = createdClasses.find((c) => c.name === student.class);
      const teacher = createdTeachers[0]; // Use first teacher

      if (classObj && teacher) {
        await prisma.result.create({
          data: {
            subjectId: subject.id,
            classId: classObj.id,
            teacherId: teacher.id,
            studentId: student.id,
            date: new Date("2025-01-01"),
            type: "exam",
            score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
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
    const classObj = createdClasses.find((c) => c.name === eventData.class);
    if (classObj) {
      await prisma.event.create({
        data: {
          title: eventData.title,
          classId: classObj.id,
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
    const classObj = createdClasses.find(
      (c) => c.name === announcementData.class
    );
    if (classObj) {
      await prisma.announcement.create({
        data: {
          title: announcementData.title,
          classId: classObj.id,
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
  - ${createdSubjects.length} subjects
  - ${createdClasses.length} classes
  - ${createdTeachers.length} teachers
  - ${createdStudents.length} students
  - ${createdParents.length} parents
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
