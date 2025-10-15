import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import { paths } from "@/lib/paths";
import SessionMonitor from "@/components/SessionMonitor";

const ClientBackButton = dynamic(
  () => import("@/components/ClientBackButton"),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ui Dev Lecturer Dashboard",
  description: "Next.js Lecturer Dashboard Management System",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{
          backgroundImage: "url('/bg-academic-2.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <SessionMonitor>
          <Toaster position="top-center" reverseOrder={false} />
          <ClientBackButton showOn={paths.auth} backTo={paths.landing} />
          {children}
        </SessionMonitor>
      </body>
    </html>
  );
}
