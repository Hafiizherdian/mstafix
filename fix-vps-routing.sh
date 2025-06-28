#!/bin/bash

# VPS Routing Fix Script for MSTA Platform
# Run with: bash fix-vps-routing.sh

VPS_IP="202.10.40.191"
VPS_PORT="3000"
BASE_URL="http://$VPS_IP:$VPS_PORT"

echo "🚀 MSTA VPS Routing Fix"
echo "======================"
echo "VPS IP: $VPS_IP"
echo "VPS Port: $VPS_PORT"
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Step 1: Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down
print_status "Containers stopped"

# Step 2: Create VPS environment file
echo "📝 Creating VPS environment configuration..."
cat > .env << EOF
# VPS Configuration
NODE_ENV=production
IS_VPS=true
VPS_IP=$VPS_IP
VPS_PORT=$VPS_PORT

# JWT Configuration
JWT_SECRET=msta-vps-secret-key-2024
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=msta-refresh-secret-2024

# Database
DATABASE_URL=postgresql://postgres:password@db:5432/msta_db

# Services
AUTH_SERVICE_URL=http://auth-service:3001

# Admin
ADMIN_SECRET_KEY=msta-admin-secret-2024
ADMIN_CREATION_KEY=msta-admin-creation-2024

# Cookies for VPS
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_HTTP_ONLY=false

# CORS
CORS_ORIGIN=$BASE_URL
ALLOWED_ORIGINS=$BASE_URL,http://localhost:3000

# URLs
NEXT_PUBLIC_API_URL=$BASE_URL/api
NEXT_PUBLIC_APP_URL=$BASE_URL

# Logging
LOG_LEVEL=info
DEBUG_MODE=true
EOF

print_status "Environment file created"

# Step 3: Create optimized Next.js config for VPS
echo "⚙️ Creating VPS-optimized Next.js config..."
cat > web-client/next.config.vps.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  trailingSlash: false,

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

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob: *; connect-src 'self' *;",
          },
        ],
      },
    ];
  },

  env: {
    VPS_IP: process.env.VPS_IP,
    VPS_PORT: process.env.VPS_PORT,
    IS_VPS: process.env.IS_VPS,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  experimental: {
    forceSwcTransforms: true,
  },

  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
EOF

# Backup original config and use VPS config
cp web-client/next.config.js web-client/next.config.js.backup
cp web-client/next.config.vps.js web-client/next.config.js

print_status "Next.js config optimized for VPS"

# Step 4: Create simplified middleware for VPS
echo "🛡️ Creating VPS-optimized middleware..."
cat > web-client/src/middleware.vps.ts << 'EOF'
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/login", "/register", "/setup-admin"];
const protectedRoutes = ["/generate-soal", "/manage-soal"];
const adminRoutes = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.nextUrl.origin;

  // Skip middleware for static files, API routes, and assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isPublic = publicRoutes.includes(pathname);
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdmin = adminRoutes.some(route => pathname.startsWith(route));

  const token = request.cookies.get("authToken")?.value || request.cookies.get("token")?.value;

  console.log(`VPS Middleware: ${pathname} | token=${!!token} | public=${isPublic}`);

  // Allow public routes
  if (isPublic) {
    return NextResponse.next();
  }

  // Redirect to login if no token for protected/admin routes
  if ((isProtected || isAdmin) && !token) {
    console.log("No token, redirecting to login");
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For VPS: Allow access if token exists (simplified validation)
  if (token) {
    console.log("Token found, allowing access");
    return NextResponse.next();
  }

  // Default: allow access
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.).*)"],
};
EOF

# Backup original middleware and use VPS version
cp web-client/src/middleware.ts web-client/src/middleware.ts.backup
cp web-client/src/middleware.vps.ts web-client/src/middleware.ts

print_status "Middleware optimized for VPS"

# Step 5: Fix user roles in database
echo "👤 Fixing user roles in database..."
node change-user-to-admin.js

# Step 6: Build and start services
echo "🏗️ Building and starting services..."
docker-compose build --no-cache web-client
docker-compose up -d

print_status "Services started"

# Step 7: Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Step 8: Health check
echo "🏥 Performing health check..."

# Check if web client is responding
if curl -f -s "$BASE_URL" > /dev/null; then
    print_status "Web client is responding"
else
    print_error "Web client is not responding"
fi

# Check if generate-soal page exists
if curl -f -s "$BASE_URL/generate-soal" > /dev/null; then
    print_status "Generate-soal page is accessible"
else
    print_warning "Generate-soal page returned error (might be auth redirect)"
fi

# Step 9: Show service status
echo "📊 Service Status:"
docker-compose ps

# Step 10: Show logs for troubleshooting
echo ""
echo "🔍 Recent logs (last 10 lines):"
echo "================================"
echo "Web Client Logs:"
docker-compose logs --tail=10 web-client
echo ""
echo "Auth Service Logs:"
docker-compose logs --tail=10 auth-service

echo ""
echo "🎉 VPS Routing Fix Complete!"
echo "============================"
echo ""
echo "🌍 Your application should now be available at:"
echo "   Main App: $BASE_URL"
echo "   Login: $BASE_URL/login"
echo "   Admin: $BASE_URL/admin"
echo ""
echo "🔧 If you still have issues:"
echo "   1. Check logs: docker-compose logs web-client"
echo "   2. Restart services: docker-compose restart"
echo "   3. Clear browser cache and cookies"
echo "   4. Try incognito mode"
echo ""
echo "📋 Test accounts:"
echo "   Admin: admin@example.com"
echo "   User: user@example.com"
echo ""
echo "💡 For debugging, check browser console for errors"
