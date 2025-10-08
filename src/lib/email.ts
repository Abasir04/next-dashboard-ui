import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  // We throw in runtime-only paths if someone calls sendEmail without configuring env.
  // Avoid throwing on import during build to not crash Next.js.
  // Consumers should handle the thrown error from sendEmail.
}

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    throw new Error("Email service not configured. Missing RESEND_API_KEY.");
  }

  try {
    const from = process.env.RESEND_FROM || "LecturerDashboard@resend.dev";
    await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    // eslint-disable-next-line no-console
    console.log("Email sent to", to);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Email sending failed:", error);
    throw new Error("Email failed to send");
  }
}
