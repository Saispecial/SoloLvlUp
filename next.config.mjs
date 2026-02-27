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
  output: 'export', // Required for Capacitor static export
  basePath: '', // Capacitor serves from root
  trailingSlash: true, // Helps with routing in mobile apps
}

export default nextConfig
