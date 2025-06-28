/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' ws: wss: http: https:",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/manage-soal/:path*",
        destination: "http://api-gateway:3000/api/v1/manage-soal/:path*",
      },
      {
        source: "/api/generate-soal/:path*",
        destination: "http://api-gateway:3000/api/v1/generate-soal/:path*",
      },
      {
        source: "/api/auth/:path*",
        destination: "http://api-gateway:3000/api/v1/auth/:path*",
      },
    ];
  },
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GENERATE_SOAL_SERVICE_URL: process.env.GENERATE_SOAL_SERVICE_URL,
    MANAGE_SOAL_SERVICE_URL: process.env.MANAGE_SOAL_SERVICE_URL,
    API_GATEWAY_URL: process.env.API_GATEWAY_URL || "http://api-gateway:3000",
  },
  httpAgentOptions: {
    keepAlive: true,
  },
};

module.exports = nextConfig;
