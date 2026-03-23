import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    allowedDevOrigins: ['https://192.168.0.180:3000'],
    // swcMinify is enabled by default in Next.js 16+, no need to specify
};

export default nextConfig;
