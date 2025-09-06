
/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is required to allow the Next.js dev server to accept requests from
  // the Firebase Studio environment.
  allowedDevOrigins: ["*.cloudworkstations.dev"],
  images: {
    loader: 'default',
    unoptimized: true, // Keep this if you want unoptimized images
  },
  experimental: {
    // This can help with ChunkLoadError in some development environments
    // by changing how files are loaded.
    appDir: true,
  },
};

module.exports = nextConfig;
