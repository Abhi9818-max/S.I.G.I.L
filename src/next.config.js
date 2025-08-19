/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: 'default',
    unoptimized: true, // 👈 Required if you're using <Image />
  },
  devIndicators: {
    allowedDevOrigins: [
      '*.cloudworkstations.dev',
    ],
  },
};

module.exports = nextConfig;
