#!/bin/bash

# VPS Environment Configuration for MSTA Platform
# Run with: source vps-env-config.sh

echo "🚀 Configuring VPS Environment for MSTA Platform"
echo "==============================================="

# Get VPS IP address
VPS_IP="202.10.40.191"
VPS_PORT="3000"

# Set environment variables for VPS
export NODE_ENV="production"
export IS_VPS="true"
export VPS_IP="$VPS_IP"
export VPS_PORT="$VPS_PORT"

# JWT Configuration
export JWT_SECRET="msta-vps-secret-key-2024"
export JWT_EXPIRES_IN="24h"
export REFRESH_TOKEN_SECRET="msta-refresh-secret-2024"

# Database Configuration
export DATABASE_URL="postgresql://postgres:password@db:5432/msta_db"

# Auth Service Configuration
export AUTH_SERVICE_URL="http://auth-service:3001"

# Admin Configuration
export ADMIN_SECRET_KEY="msta-admin-secret-2024"
export ADMIN_CREATION_KEY="msta-admin-creation-2024"

# Cookie Configuration for VPS
export COOKIE_SECURE="false"
export COOKIE_SAME_SITE="lax"
export COOKIE_HTTP_ONLY="false"

# CORS Configuration
export CORS_ORIGIN="http://$VPS_IP:$VPS_PORT"
export ALLOWED_ORIGINS="http://$VPS_IP:$VPS_PORT,http://localhost:3000"

# Logging Configuration
export LOG_LEVEL="info"
export DEBUG_MODE="true"

# Application URLs
export NEXT_PUBLIC_API_URL="http://$VPS_IP:$VPS_PORT/api"
export NEXT_PUBLIC_APP_URL="http://$VPS_IP:$VPS_PORT"

echo "✅ Environment variables configured for VPS:"
echo "   VPS IP: $VPS_IP"
echo "   VPS Port: $VPS_PORT"
echo "   App URL: http://$VPS_IP:$VPS_PORT"
echo "   JWT Secret: ${JWT_SECRET:0:10}..."
echo ""

# Create .env file for docker-compose
cat > .env << EOF
# VPS Configuration
NODE_ENV=production
IS_VPS=true
VPS_IP=$VPS_IP
VPS_PORT=$VPS_PORT

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=$JWT_EXPIRES_IN
REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET

# Database
DATABASE_URL=$DATABASE_URL

# Services
AUTH_SERVICE_URL=$AUTH_SERVICE_URL

# Admin
ADMIN_SECRET_KEY=$ADMIN_SECRET_KEY
ADMIN_CREATION_KEY=$ADMIN_CREATION_KEY

# Cookies
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_HTTP_ONLY=false

# CORS
CORS_ORIGIN=http://$VPS_IP:$VPS_PORT
ALLOWED_ORIGINS=http://$VPS_IP:$VPS_PORT,http://localhost:3000

# URLs
NEXT_PUBLIC_API_URL=http://$VPS_IP:$VPS_PORT/api
NEXT_PUBLIC_APP_URL=http://$VPS_IP:$VPS_PORT

# Logging
LOG_LEVEL=info
DEBUG_MODE=true
EOF

echo "📝 Created .env file with VPS configuration"

# Function to update docker-compose for VPS
update_docker_compose() {
    echo "🐳 Updating docker-compose for VPS..."

    # Backup original docker-compose
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml docker-compose.yml.backup
        echo "✅ Backed up original docker-compose.yml"
    fi

    # Update ports in docker-compose if needed
    if grep -q "3000:3000" docker-compose.yml; then
        sed -i "s/3000:3000/$VPS_PORT:3000/g" docker-compose.yml
        echo "✅ Updated port mapping in docker-compose.yml"
    fi
}

# Function to setup VPS-specific routing
setup_vps_routing() {
    echo "🌐 Setting up VPS routing configuration..."

    # Create next.config.js with VPS settings
    cat > web-client/next.config.vps.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    VPS_IP: process.env.VPS_IP,
    VPS_PORT: process.env.VPS_PORT,
    IS_VPS: process.env.IS_VPS,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
EOF

    echo "✅ Created VPS-specific next.config.js"
}

# Function to create VPS deployment script
create_deployment_script() {
    echo "📦 Creating VPS deployment script..."

    cat > deploy-vps.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying MSTA to VPS..."

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Pull latest images
echo "📥 Pulling latest images..."
docker-compose pull

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

# Test connectivity
echo "🌐 Testing connectivity..."
curl -f http://localhost:3000/api/health || echo "❌ Health check failed"

echo "✅ VPS deployment completed!"
echo "🌍 Application should be available at: http://202.10.40.191:3000"
EOF

    chmod +x deploy-vps.sh
    echo "✅ Created deploy-vps.sh script"
}

# Function to create health check script
create_health_check() {
    echo "🏥 Creating health check script..."

    cat > health-check.sh << 'EOF'
#!/bin/bash

VPS_IP="202.10.40.191"
VPS_PORT="3000"

echo "🏥 MSTA Health Check for VPS"
echo "============================"

# Check if containers are running
echo "🐳 Checking Docker containers..."
docker-compose ps

echo ""
echo "🌐 Testing connectivity..."

# Test web client
echo -n "Web Client: "
if curl -f -s "http://$VPS_IP:$VPS_PORT" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

# Test auth service
echo -n "Auth Service: "
if curl -f -s "http://localhost:3001/health" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

# Test API endpoints
echo -n "API Health: "
if curl -f -s "http://$VPS_IP:$VPS_PORT/api/health" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

echo ""
echo "📊 Resource Usage:"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"

echo ""
echo "🔗 Access URLs:"
echo "   Main App: http://$VPS_IP:$VPS_PORT"
echo "   Login: http://$VPS_IP:$VPS_PORT/login"
echo "   Admin: http://$VPS_IP:$VPS_PORT/admin"
EOF

    chmod +x health-check.sh
    echo "✅ Created health-check.sh script"
}

# Run setup functions
update_docker_compose
setup_vps_routing
create_deployment_script
create_health_check

echo ""
echo "🎉 VPS Configuration Complete!"
echo "==============================="
echo ""
echo "📋 Next Steps:"
echo "1. Review the generated .env file"
echo "2. Run: docker-compose down && docker-compose up -d"
echo "3. Wait for services to start"
echo "4. Run: node fix-vps-auth.js"
echo "5. Test login at: http://$VPS_IP:$VPS_PORT/login"
echo ""
echo "🔧 Useful Commands:"
echo "   ./deploy-vps.sh     - Deploy to VPS"
echo "   ./health-check.sh   - Check system health"
echo "   docker-compose logs - View logs"
echo ""
echo "🌍 Your app will be available at:"
echo "   http://$VPS_IP:$VPS_PORT"
echo ""
