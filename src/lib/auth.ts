import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function createUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  title: string;
  role: string;
}) {
  try {
    console.log("Creating user:", userData.email);
    const hashedPassword = await hashPassword(userData.password);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        title: userData.title,
        role: (userData.role as any) || "LECTURER",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        title: true,
        role: true,
        createdAt: true,
      },
    });

    console.log("User created successfully:", user.id);
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function authenticateUser(identifier: string, password: string) {
  try {
    console.log("Authenticating user:", identifier);

    // Try to find user by email first, then by matric number through student table
    let user = await prisma.user.findUnique({
      where: { email: identifier },
    });

    // If not found by email, try to find by matric number
    if (!user) {
      const student = await prisma.student.findUnique({
        where: { matricNumber: identifier },
        include: { user: true },
      });

      if (student) {
        user = student.user;
      }
    }

    if (!user) {
      console.log("User not found:", identifier);
      return null;
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      console.log("Invalid password for user:", identifier);
      return null;
    }

    console.log("User authenticated successfully:", identifier);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  } catch (error) {
    console.error("Error authenticating user:", error);
    throw error;
  }
}
