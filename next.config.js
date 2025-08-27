/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This is required to allow the Next.js dev server to accept requests from
    // the Firebase Studio environment.
    allowedDevOrigins: ["*.cloudworkstations.dev"],
  },
  images: {
    loader: 'default',
    unoptimized: true, // Keep this if you want unoptimized images
  },
};

module.exports = nextConfig;
