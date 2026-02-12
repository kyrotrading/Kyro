/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow connecting to backend in dev and prod
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [{ source: '/api/socket', destination: 'http://localhost:4000' }]
      : [];
  },
};

module.exports = nextConfig;
