import { NextResponse } from "next/server";
import { sendEmail, createPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: "email and token are required" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000";
    const normalizedBase = baseUrl.startsWith("http")
      ? baseUrl
      : `https://${baseUrl}`;
    const resetLink = `${normalizedBase}/auth/reset-password?token=${encodeURIComponent(
      token
    )}`;

    const htmlEmail = createPasswordResetEmail(resetLink);

    await sendEmail({
      to: email,
      subject: "🔐 Reset Your Password - Lecturer Dashboard",
      html: htmlEmail,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send reset email" },
      { status: 500 }
    );
  }
}
