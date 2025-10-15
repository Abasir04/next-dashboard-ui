export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-transparent backdrop-blur-sm rounded-lg shadow-md p-8 text-center max-w-md w-full">
        <div className="text-6xl mb-2">🧭</div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Page not found
        </h1>
        <p className="text-gray-600 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <a
          href="/"
          className="inline-block bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Go back home
        </a>
      </div>
    </div>
  );
}
