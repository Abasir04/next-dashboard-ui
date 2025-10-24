/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "images.pexels.com" },
      { hostname: "f004.backblazeb2.com" },
      { hostname: "s3.eu-central-003.backblazeb2.com" }
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'jsonwebtoken', 'bcryptjs'],
  },
  // Webpack configuration for non-Turbopack builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'crypto' module on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }
    return config;
  },
  // Ensure API routes work properly on Vercel
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
