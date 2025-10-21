import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import SessionValidator from "@/components/SessionValidator";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <SessionValidator>
        <div className="h-screen flex">
          {/* LEFT */}
          <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] h-screen flex flex-col bg-white p-2">
            <Link
              href="/"
              className="flex items-center justify-center lg:justify-start gap-3 m-1"
            >
              <Image src="/logo.png" alt="logo" width={32} height={32} />
              <span className="hidden lg:block font-bold">
                University of Ibadan
              </span>
            </Link>
            <div className="flex-1 min-h-0 py-1">
              <Menu />
            </div>
          </div>
          {/* RIGHT */}
          <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#dadde7] overflow-scroll flex flex-col">
            <Navbar />
            <div className="p-2">{children}</div>
          </div>
        </div>
      </SessionValidator>
    </AuthGuard>
  );
}
