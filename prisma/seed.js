"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🌱 Starting database seeding...");
        // Clear existing data
        console.log("🧹 Clearing existing data...");
        yield prisma.calendarEvent.deleteMany();
        yield prisma.announcement.deleteMany();
        yield prisma.event.deleteMany();
        yield prisma.result.deleteMany();
        yield prisma.assignment.deleteMany();
        yield prisma.exam.deleteMany();
        yield prisma.lesson.deleteMany();
        yield prisma.lecturerCourse.deleteMany();
        yield prisma.lecturerLevel.deleteMany();
        yield prisma.student.deleteMany();
        yield prisma.lecturer.deleteMany();
        yield prisma.course.deleteMany();
        yield prisma.level.deleteMany();
        yield prisma.user.deleteMany();
        // Create courses
        console.log("📚 Creating courses...");
        const courses = [
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
        const createdCourses = yield Promise.all(courses.map((course) => prisma.course.create({ data: course })));
        // Create levels
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
        const createdLevels = yield Promise.all(levels.map((lvl) => prisma.level.create({ data: lvl })));
        // Create users and lecturers
        console.log("👨‍🏫 Creating lecturers...");
        const lecturersData = [
            {
                lecturerId: "T001",
                name: "John Doe",
                email: "john@doe.com",
                photo: "https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                courses: ["Math", "Geometry"],
                levels: ["1B", "2A", "3C"],
                address: "123 Main St, Anytown, USA",
            },
            {
                lecturerId: "T002",
                name: "Jane Doe",
                email: "jane@doe.com",
                photo: "https://images.pexels.com/photos/936126/pexels-photo-936126.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                courses: ["Physics", "Chemistry"],
                levels: ["5A", "4B", "3C"],
                address: "123 Main St, Anytown, USA",
            },
            {
                lecturerId: "T003",
                name: "Mike Geller",
                email: "mike@geller.com",
                photo: "https://images.pexels.com/photos/428328/pexels-photo-428328.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                courses: ["Biology"],
                levels: ["5A", "4B", "3C"],
                address: "123 Main St, Anytown, USA",
            },
            {
                lecturerId: "T004",
                name: "Jay French",
                email: "jay@gmail.com",
                photo: "https://images.pexels.com/photos/1187765/pexels-photo-1187765.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                courses: ["History"],
                levels: ["5A", "4B", "3C"],
                address: "123 Main St, Anytown, USA",
            },
            {
                lecturerId: "T005",
                name: "Jane Smith",
                email: "jane@gmail.com",
                photo: "https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                courses: ["Music", "History"],
                levels: ["5A", "4B", "3C"],
                address: "123 Main St, Anytown, USA",
            },
            {
                lecturerId: "T006",
                name: "Anna Santiago",
                email: "anna@gmail.com",
                photo: "https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                courses: ["Physics"],
                levels: ["5A", "4B", "3C"],
                address: "123 Main St, Anytown, USA",
            },
            {
                lecturerId: "T007",
                name: "Allen Black",
                email: "allen@black.com",
                photo: "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                courses: ["English", "Spanish"],
                levels: ["5A", "4B", "3C"],
                address: "123 Main St, Anytown, USA",
            },
            {
                lecturerId: "T008",
                name: "Ophelia Castro",
                email: "ophelia@castro.com",
                photo: "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                courses: ["Math", "Geometry"],
                levels: ["5A", "4B", "3C"],
                address: "123 Main St, Anytown, USA",
            },
            {
                lecturerId: "T009",
                name: "Derek Briggs",
                email: "derek@briggs.com",
                photo: "https://images.pexels.com/photos/842980/pexels-photo-842980.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                courses: ["Literature", "English"],
                levels: ["5A", "4B", "3C"],
                address: "123 Main St, Anytown, USA",
            },
            {
                lecturerId: "T010",
                name: "John Glover",
                email: "john@glover.com",
                photo: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                courses: ["Biology"],
                levels: ["5A", "4B", "3C"],
                address: "123 Main St, Anytown, USA",
            },
        ];
        const hashedPassword = yield bcryptjs_1.default.hash("password123", 12);
        const createdLecturers = [];
        for (const lecturerData of lecturersData) {
            const user = yield prisma.user.create({
                data: {
                    email: lecturerData.email,
                    password: hashedPassword,
                    firstName: lecturerData.name.split(" ")[0],
                    lastName: lecturerData.name.split(" ")[1] || "",
                    role: "LECTURER",
                },
            });
            const lecturer = yield prisma.lecturer.create({
                data: {
                    lecturerId: lecturerData.lecturerId,
                    name: lecturerData.name,
                    email: lecturerData.email,
                    photo: lecturerData.photo,
                    phone: lecturerData.phone,
                    address: lecturerData.address,
                    userId: user.id,
                },
            });
            // Create lecturer-course relationships
            for (const courseName of lecturerData.courses) {
                const course = createdCourses.find((c) => c.name === courseName);
                if (course) {
                    yield prisma.lecturerCourse.create({
                        data: {
                            lecturerId: lecturer.id,
                            courseId: course.id,
                        },
                    });
                }
            }
            // Create lecturer-level relationships
            for (const levelName of lecturerData.levels) {
                const level = createdLevels.find((l) => l.name === levelName);
                if (level) {
                    yield prisma.lecturerLevel.create({
                        data: {
                            lecturerId: lecturer.id,
                            levelId: level.id,
                        },
                    });
                }
            }
            createdLecturers.push(lecturer);
        }
        // Create users and students
        console.log("👨‍🎓 Creating students...");
        const studentsData = [
            {
                studentId: "S001",
                name: "John Doe",
                email: "john.student@doe.com",
                photo: "https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                grade: 5,
                level: "5A",
                address: "123 Main St, Anytown, USA",
            },
            {
                studentId: "S002",
                name: "Jane Doe",
                email: "jane.student@doe.com",
                photo: "https://images.pexels.com/photos/936126/pexels-photo-936126.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                grade: 5,
                level: "5A",
                address: "123 Main St, Anytown, USA",
            },
            {
                studentId: "S003",
                name: "Mike Geller",
                email: "mike.student@geller.com",
                photo: "https://images.pexels.com/photos/428328/pexels-photo-428328.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                grade: 5,
                level: "5A",
                address: "123 Main St, Anytown, USA",
            },
            {
                studentId: "S004",
                name: "Jay French",
                email: "jay.student@gmail.com",
                photo: "https://images.pexels.com/photos/1187765/pexels-photo-1187765.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                grade: 5,
                level: "5A",
                address: "123 Main St, Anytown, USA",
            },
            {
                studentId: "S005",
                name: "Jane Smith",
                email: "jane.student@gmail.com",
                photo: "https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                grade: 5,
                level: "5A",
                address: "123 Main St, Anytown, USA",
            },
            {
                studentId: "S006",
                name: "Anna Santiago",
                email: "anna.student@gmail.com",
                photo: "https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                grade: 5,
                level: "5A",
                address: "123 Main St, Anytown, USA",
            },
            {
                studentId: "S007",
                name: "Allen Black",
                email: "allen.student@black.com",
                photo: "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                grade: 5,
                level: "5A",
                address: "123 Main St, Anytown, USA",
            },
            {
                studentId: "S008",
                name: "Ophelia Castro",
                email: "ophelia.student@castro.com",
                photo: "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                grade: 5,
                level: "5A",
                address: "123 Main St, Anytown, USA",
            },
            {
                studentId: "S009",
                name: "Derek Briggs",
                email: "derek.student@briggs.com",
                photo: "https://images.pexels.com/photos/842980/pexels-photo-842980.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                grade: 5,
                level: "5A",
                address: "123 Main St, Anytown, USA",
            },
            {
                studentId: "S010",
                name: "John Glover",
                email: "john.student@glover.com",
                photo: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1200",
                phone: "1234567890",
                grade: 5,
                level: "5A",
                address: "123 Main St, Anytown, USA",
            },
        ];
        const createdStudents = [];
        for (const studentData of studentsData) {
            const levelObj = createdLevels.find((l) => l.name === studentData.level);
            if (!levelObj)
                continue;
            const user = yield prisma.user.create({
                data: {
                    email: studentData.email,
                    password: hashedPassword,
                    firstName: studentData.name.split(" ")[0],
                    lastName: studentData.name.split(" ")[1] || "",
                    role: "STUDENT",
                },
            });
            const student = yield prisma.student.create({
                data: {
                    studentId: studentData.studentId,
                    name: studentData.name,
                    email: studentData.email,
                    photo: studentData.photo,
                    phone: studentData.phone,
                    grade: studentData.grade,
                    levelId: levelObj.id,
                    address: studentData.address,
                    userId: user.id,
                },
            });
            createdStudents.push(student);
        }
        // Create lessons
        console.log("📖 Creating lessons...");
        const lessonsData = [
            { course: "Math", level: "1A", lecturer: "John Doe" },
            { course: "English", level: "2A", lecturer: "Jane Doe" },
            { course: "Science", level: "3A", lecturer: "Mike Geller" },
            { course: "Social Studies", level: "1B", lecturer: "Jay French" },
            { course: "Art", level: "4A", lecturer: "Jane Smith" },
            { course: "Music", level: "5A", lecturer: "Anna Santiago" },
            { course: "History", level: "6A", lecturer: "Allen Black" },
            { course: "Geography", level: "6B", lecturer: "Ophelia Castro" },
            { course: "Physics", level: "6C", lecturer: "Derek Briggs" },
            { course: "Chemistry", level: "4B", lecturer: "John Glover" },
        ];
        for (const lessonData of lessonsData) {
            const course = createdCourses.find((c) => c.name === lessonData.course);
            const level = createdLevels.find((l) => l.name === lessonData.level);
            const lecturer = createdLecturers.find((t) => t.name === lessonData.lecturer);
            if (course && level && lecturer) {
                yield prisma.lesson.create({
                    data: {
                        courseId: course.id,
                        levelId: level.id,
                        lecturerId: lecturer.id,
                    },
                });
            }
        }
        // Create exams
        console.log("📝 Creating exams...");
        const examsData = [
            { course: "Math", level: "1A", lecturer: "John Doe", date: "2025-01-01" },
            {
                course: "English",
                level: "2A",
                lecturer: "Jane Doe",
                date: "2025-01-01",
            },
            {
                course: "Science",
                level: "3A",
                lecturer: "Mike Geller",
                date: "2025-01-01",
            },
            {
                course: "Social Studies",
                level: "1B",
                lecturer: "Jay French",
                date: "2025-01-01",
            },
            { course: "Art", level: "4A", lecturer: "Jane Smith", date: "2025-01-01" },
            {
                course: "Music",
                level: "5A",
                lecturer: "Anna Santiago",
                date: "2025-01-01",
            },
            {
                course: "History",
                level: "6A",
                lecturer: "Allen Black",
                date: "2025-01-01",
            },
            {
                course: "Geography",
                level: "6B",
                lecturer: "Ophelia Castro",
                date: "2025-01-01",
            },
            {
                course: "Physics",
                level: "7A",
                lecturer: "Derek Briggs",
                date: "2025-01-01",
            },
            {
                course: "Chemistry",
                level: "8A",
                lecturer: "John Glover",
                date: "2025-01-01",
            },
        ];
        for (const examData of examsData) {
            const course = createdCourses.find((c) => c.name === examData.course);
            const level = createdLevels.find((l) => l.name === examData.level);
            const lecturer = createdLecturers.find((t) => t.name === examData.lecturer);
            if (course && level && lecturer) {
                yield prisma.exam.create({
                    data: {
                        courseId: course.id,
                        levelId: level.id,
                        lecturerId: lecturer.id,
                        date: new Date(examData.date),
                    },
                });
            }
        }
        // Create assignments
        console.log("📋 Creating assignments...");
        const assignmentsData = [
            {
                course: "Math",
                level: "1A",
                lecturer: "John Doe",
                dueDate: "2025-01-01",
            },
            {
                course: "English",
                level: "2A",
                lecturer: "Jane Doe",
                dueDate: "2025-01-01",
            },
            {
                course: "Science",
                level: "3A",
                lecturer: "Mike Geller",
                dueDate: "2025-01-01",
            },
            {
                course: "Social Studies",
                level: "1B",
                lecturer: "Jay French",
                dueDate: "2025-01-01",
            },
            {
                course: "Art",
                level: "4A",
                lecturer: "Jane Smith",
                dueDate: "2025-01-01",
            },
            {
                course: "Music",
                level: "5A",
                lecturer: "Anna Santiago",
                dueDate: "2025-01-01",
            },
            {
                course: "History",
                level: "6A",
                lecturer: "Allen Black",
                dueDate: "2025-01-01",
            },
            {
                course: "Geography",
                level: "6B",
                lecturer: "Ophelia Castro",
                dueDate: "2025-01-01",
            },
            {
                course: "Physics",
                level: "7A",
                lecturer: "Derek Briggs",
                dueDate: "2025-01-01",
            },
            {
                course: "Chemistry",
                level: "8A",
                lecturer: "John Glover",
                dueDate: "2025-01-01",
            },
        ];
        for (const assignmentData of assignmentsData) {
            const course = createdCourses.find((c) => c.name === assignmentData.course);
            const level = createdLevels.find((l) => l.name === assignmentData.level);
            const lecturer = createdLecturers.find((t) => t.name === assignmentData.lecturer);
            if (course && level && lecturer) {
                yield prisma.assignment.create({
                    data: {
                        courseId: course.id,
                        levelId: level.id,
                        lecturerId: lecturer.id,
                        dueDate: new Date(assignmentData.dueDate),
                    },
                });
            }
        }
        // Create results
        console.log("📊 Creating results...");
        for (const student of createdStudents) {
            for (const course of createdCourses.slice(0, 5)) {
                const level = createdLevels.find((l) => l.id === student.levelId);
                const lecturer = createdLecturers[0]; // Use first lecturer
                if (level && lecturer) {
                    yield prisma.result.create({
                        data: {
                            courseId: course.id,
                            levelId: level.id,
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
                level: "1A",
                date: "2025-01-01",
                startTime: "10:00",
                endTime: "11:00",
            },
            {
                title: "Picnic",
                level: "2A",
                date: "2025-01-01",
                startTime: "10:00",
                endTime: "11:00",
            },
            {
                title: "Beach Trip",
                level: "3A",
                date: "2025-01-01",
                startTime: "10:00",
                endTime: "11:00",
            },
            {
                title: "Museum Trip",
                level: "4A",
                date: "2025-01-01",
                startTime: "10:00",
                endTime: "11:00",
            },
            {
                title: "Music Concert",
                level: "5A",
                date: "2025-01-01",
                startTime: "10:00",
                endTime: "11:00",
            },
            {
                title: "Magician Show",
                level: "1B",
                date: "2025-01-01",
                startTime: "10:00",
                endTime: "11:00",
            },
            {
                title: "Lake Trip",
                level: "2B",
                date: "2025-01-01",
                startTime: "10:00",
                endTime: "11:00",
            },
            {
                title: "Cycling Race",
                level: "3B",
                date: "2025-01-01",
                startTime: "10:00",
                endTime: "11:00",
            },
            {
                title: "Art Exhibition",
                level: "4B",
                date: "2025-01-01",
                startTime: "10:00",
                endTime: "11:00",
            },
            {
                title: "Sports Tournament",
                level: "5B",
                date: "2025-01-01",
                startTime: "10:00",
                endTime: "11:00",
            },
        ];
        for (const eventData of eventsData) {
            const level = createdLevels.find((l) => l.name === eventData.level);
            if (level) {
                yield prisma.event.create({
                    data: {
                        title: eventData.title,
                        levelId: level.id,
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
            { title: "About 4A Math Test", level: "4A", date: "2025-01-01" },
            { title: "About 3A Math Test", level: "3A", date: "2025-01-01" },
            { title: "About 3B Math Test", level: "3B", date: "2025-01-01" },
            { title: "About 6A Math Test", level: "6A", date: "2025-01-01" },
            { title: "About 8C Math Test", level: "8C", date: "2025-01-01" },
            { title: "About 2A Math Test", level: "2A", date: "2025-01-01" },
            { title: "About 4C Math Test", level: "4C", date: "2025-01-01" },
            { title: "About 4B Math Test", level: "4B", date: "2025-01-01" },
            { title: "About 3C Math Test", level: "3C", date: "2025-01-01" },
            { title: "About 1C Math Test", level: "1C", date: "2025-01-01" },
        ];
        for (const announcementData of announcementsData) {
            const level = createdLevels.find((l) => l.name === announcementData.level);
            if (level) {
                yield prisma.announcement.create({
                    data: {
                        title: announcementData.title,
                        levelId: level.id,
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
            yield prisma.calendarEvent.create({
                data: event,
            });
        }
        console.log("✅ Database seeding completed successfully!");
        console.log(`📊 Created:\n  - ${createdCourses.length} courses\n  - ${createdLevels.length} levels\n  - ${createdLecturers.length} lecturers\n  - ${createdStudents.length} students\n  - Multiple lessons, exams, assignments, results, events, announcements, and calendar events\n  `);
    });
}
main()
    .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
