/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: 'default',
    unoptimized: true,
  },
  experimental: {
    // This is required for some environments (like Docker) where the output directory
    // is not directly writeable. It can help prevent build issues.
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
