/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable standalone output for Docker
    output: 'standalone',

    // Your existing config
    reactStrictMode: true,
    swcMinify: true,

    // Add any other config you have
};

module.exports = nextConfig;
