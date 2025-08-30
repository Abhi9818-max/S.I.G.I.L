
/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is required to allow the Next.js dev server to accept requests from
  // the Firebase Studio environment.
  allowedDevOrigins: ["*.cloudworkstations.dev"],
  images: {
    loader: 'default',
    unoptimized: true,
  },
};

export default nextConfig;
