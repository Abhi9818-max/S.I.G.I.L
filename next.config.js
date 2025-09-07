
/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is required to allow the Next.js dev server to accept requests from
  // the Firebase Studio environment.
  // Using a more permissive setting for development to avoid cross-origin issues.
  allowedDevOrigins: ['**'],
  images: {
    loader: 'default',
    unoptimized: true, // Keep this if you want unoptimized images
  },
  webpack: (config, { isServer }) => {
    // Disable webpack caching to prevent ENOENT errors in some environments.
    config.cache = false;
    return config;
  },
};

module.exports = nextConfig;
