/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/manage-soal/:path*',
        destination: 'http://api-gateway:3000/api/v1/manage-soal/:path*'
      },
      {
        source: '/api/generate-soal/:path*',
        destination: 'http://api-gateway:3000/api/v1/generate-soal/:path*'
      },
      {
        source: '/api/auth/:path*',
        destination: 'http://api-gateway:3000/api/v1/auth/:path*'
      },
      // tambahkan rewrites lain jika perlu
    ]
  },
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GENERATE_SOAL_SERVICE_URL: process.env.GENERATE_SOAL_SERVICE_URL,
    MANAGE_SOAL_SERVICE_URL: process.env.MANAGE_SOAL_SERVICE_URL,
    API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://api-gateway:3000'
  },
  httpAgentOptions: {
    keepAlive: true,
  },
}

module.exports = nextConfig 