/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    loader: 'default',
    unoptimized: true, // Required for static export with images
  },
  allowedDevOrigins: [
    '*.cloudworkstations.dev',
  ],
  // Optional: Customize output directory
  // distDir: 'dist',
  
  // Optional: Add trailing slashes to URLs  
  // trailingSlash: true,
};

module.exports = nextConfig;
