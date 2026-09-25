import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  // Keep a running dev server's client assets separate from production builds.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next'
};
export default nextConfig;
