import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    // swcMinify is enabled by default in Next.js 16+, no need to specify
};

export default nextConfig;
