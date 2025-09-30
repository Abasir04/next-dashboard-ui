import Link from "next/link";
import { getAuthUrl } from "@/lib/paths";

const Homepage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
      <h1 className="text-3xl font-bold mb-6">Lecturer Dashboard Website</h1>
      <div className="flex space-x-4">
        <Link
          href={getAuthUrl("sign-up")}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-primary hover:text-white transition"
        >
          Sign Up
        </Link>
        <Link
          href={getAuthUrl("sign-in")}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-primary hover:text-white transition"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Homepage;
