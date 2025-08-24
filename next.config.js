/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed: output: 'export',  // <-- This line is now removed
  
  images: {
    loader: 'default',
    unoptimized: true, // Keep this if you want unoptimized images
  },
  allowedDevOrigins: [
    '*.cloudworkstations.dev',
  ],
};

module.exports = nextConfig;
