/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    loader: 'default',
    unoptimized: true, // Required if you're using <Image />
  },
  allowedDevOrigins: [
    '*.cloudworkstations.dev',
  ],
  devIndicators: {
    // other dev indicator configs if needed
  },
};

module.exports = nextConfig;
