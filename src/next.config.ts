
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  devIndicators: {
    allowedDevOrigins: [
      // Allow requests from Firebase Studio development environment
      '*.cloudworkstations.dev',
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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

export default nextConfig;
