/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 👈 REQUIRED for static export

  images: {
    loader: 'default',
    unoptimized: true, // 👈 Required if you're using <Image />
  },

  experimental: {
    // Useful for Docker & restricted environments
    outputFileTracingExcludes: {
      '*': [
        './node_modules/@swc/core-linux-x64-gnu',
        './node_modules/@swc/core-linux-x64-musl',
        './node_modules/esbuild-linux-64',
      ],
    },
  },
};

module.exports = nextConfig;
