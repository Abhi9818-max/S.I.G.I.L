/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    allowedDevOrigins: [
      // Allow requests from Firebase Studio development environment
      '*.cloudworkstations.dev',
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
