/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/DumpStack.log.tmp',
          '**/System Volume Information/**',
          '**/pagefile.sys',
          '**/D:/**'
        ]
      }
    }
    return config
  }
}

export default nextConfig