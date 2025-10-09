import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const apiKey = process.env.MAILERSEND_API_KEY;

// Lazily construct the client only when the API key exists
const mailerSend = apiKey ? new MailerSend({ apiKey }) : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!mailerSend) {
    throw new Error(
      "Email service not configured. Missing MAILERSEND_API_KEY."
    );
  }

  const fromEmail = process.env.MAILERSEND_FROM;
  const fromName = process.env.MAILERSEND_FROM_NAME || "Lecturer Dashboard";

  if (!fromEmail) {
    throw new Error(
      "Email service not configured. Missing MAILERSEND_FROM (must be a verified domain/sender)."
    );
  }

  try {
    const sentFrom = new Sender(fromEmail, fromName);
    const recipients = [new Recipient(to, to)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(subject)
      .setHtml(html)
      .setText(html.replace(/<[^>]+>/g, ""));

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const getErrorCode = (err: unknown): string | undefined => {
      if (!err || typeof err !== "object") return undefined;
      const obj = err as Record<string, unknown>;
      if ("code" in obj && typeof obj.code === "string") {
        return obj.code as string;
      }
      if ("cause" in obj && obj.cause && typeof obj.cause === "object") {
        const causeObj = obj.cause as Record<string, unknown>;
        if ("code" in causeObj && typeof causeObj.code === "string") {
          return causeObj.code as string;
        }
      }
      if ("message" in obj && typeof obj.message === "string") {
        const msg = obj.message as string;
        if (msg.includes("EAI_AGAIN")) return "EAI_AGAIN";
        if (msg.includes("ETIMEDOUT")) return "ETIMEDOUT";
        if (msg.includes("ECONNRESET")) return "ECONNRESET";
        if (msg.includes("ENOTFOUND")) return "ENOTFOUND";
        if (msg.includes("EHOSTUNREACH")) return "EHOSTUNREACH";
      }
      return undefined;
    };
    const isTransientNetworkError = (err: unknown) => {
      const code = getErrorCode(err);
      return (
        code === "EAI_AGAIN" ||
        code === "ETIMEDOUT" ||
        code === "ECONNRESET" ||
        code === "ENOTFOUND" ||
        code === "EHOSTUNREACH"
      );
    };

    let attempt = 0;
    const maxAttempts = 3;
    while (true) {
      attempt += 1;
      try {
        await mailerSend.email.send(emailParams);
        break;
      } catch (err) {
        if (isTransientNetworkError(err) && attempt < maxAttempts) {
          // eslint-disable-next-line no-console
          const code = getErrorCode(err) || "UNKNOWN";
          console.warn(
            `MailerSend transient error (${code}). Retrying attempt ${
              attempt + 1
            }/${maxAttempts}...`
          );
          await delay(500 * attempt);
          continue;
        }
        throw err;
      }
    }
    // eslint-disable-next-line no-console
    console.log("Email sent to", to);
  } catch (error) {
    // eslint-disable-next-line no-console
    const details =
      (error as any)?.body ||
      (error as any)?.response ||
      (error as any)?.message ||
      error;
    console.error("Email sending failed:", details);
    throw new Error(
      process.env.NODE_ENV === "production"
        ? "Email failed to send"
        : `Email failed to send: ${
            typeof details === "string" ? details : JSON.stringify(details)
          }`
    );
  }
}

export function createPasswordResetEmail(
  resetLink: string,
  recipientName?: string
) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8fafc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .header p {
          margin: 8px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #1f2937;
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 20px 0;
        }
        .content p {
          color: #6b7280;
          font-size: 16px;
          margin: 0 0 20px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
          transition: transform 0.2s ease;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .info-box {
          background-color: #f3f4f6;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 30px 0;
          border-radius: 0 8px 8px 0;
        }
        .info-box h3 {
          color: #1f2937;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 10px 0;
        }
        .info-box p {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }
        .footer {
          background-color: #f8fafc;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          color: #9ca3af;
          font-size: 14px;
          margin: 0 0 10px 0;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        .security-note {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
        }
        .security-note p {
          color: #92400e;
          font-size: 14px;
          margin: 0;
          font-weight: 500;
        }
        @media (max-width: 600px) {
          .container {
            margin: 0;
            border-radius: 0;
          }
          .header, .content, .footer {
            padding: 30px 20px;
          }
          .header h1 {
            font-size: 24px;
          }
          .content h2 {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset</h1>
          <p>Lecturer Dashboard System</p>
        </div>
        
        <div class="content">
          <h2>Hello${recipientName ? ` ${recipientName}` : ""}!</h2>
          <p>We received a request to reset your password for your Lecturer Dashboard account. If you made this request, click the button below to set a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset My Password</a>
          </div>
          
          <div class="info-box">
            <h3>📋 What happens next?</h3>
            <p>After clicking the button, you'll be taken to a secure page where you can enter your new password. The link will expire in 15 minutes for security reasons.</p>
          </div>
          
          <div class="security-note">
            <p>⚠️ <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px; color: #374151;">
            ${resetLink}
          </p>
        </div>
        
        <div class="footer">
          <p>This email was sent from the Lecturer Dashboard System</p>
          <p>If you have any questions, please contact your system administrator</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
