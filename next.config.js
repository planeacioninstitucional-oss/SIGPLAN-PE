/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        // Required for 'xlsx' package to work in Next.js
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            stream: false,
            crypto: false,
        }
        return config
    },
}

module.exports = nextConfig
