/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: 'default',
    unoptimized: true, // Keep this if you want unoptimized images
  },
  allowedDevOrigins: [
    '*.cloudworkstations.dev',
  ],
};

module.exports = nextConfig;
