
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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

export default nextConfig;
