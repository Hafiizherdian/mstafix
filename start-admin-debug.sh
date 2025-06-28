#!/bin/bash

# MSTAFIX Admin Dashboard Debug Startup Script
# Script ini membantu debugging masalah dashboard admin

set -e

echo "🚀 MSTAFIX Admin Dashboard Debug Startup"
echo "========================================"
echo "Timestamp: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i:$port > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    print_status $YELLOW "⏳ Waiting for $name to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url/health" > /dev/null 2>&1; then
            print_status $GREEN "✅ $name is ready!"
            return 0
        fi

        echo "   Attempt $attempt/$max_attempts - waiting..."
        sleep 2
        attempt=$((attempt + 1))
    done

    print_status $RED "❌ $name failed to start after $max_attempts attempts"
    return 1
}

# Function to start service in background
start_service() {
    local name=$1
    local directory=$2
    local port=$3
    local start_command=$4

    echo ""
    print_status $BLUE "🔧 Starting $name..."

    if check_port $port; then
        print_status $YELLOW "⚠️  Port $port is already in use. $name might already be running."
        return 0
    fi

    if [ ! -d "$directory" ]; then
        print_status $RED "❌ Directory $directory not found!"
        return 1
    fi

    cd "$directory"

    # Install dependencies if needed
    if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
        print_status $YELLOW "📦 Installing dependencies for $name..."
        npm install
    fi

    # Start the service
    print_status $GREEN "▶️  Starting $name on port $port..."
    eval "$start_command" > "../logs/${name,,}.log" 2>&1 &
    local pid=$!
    echo $pid > "../pids/${name,,}.pid"

    print_status $GREEN "✅ $name started with PID $pid"

    # Return to original directory
    cd - > /dev/null
}

# Create necessary directories
mkdir -p logs pids

# Clear old logs
rm -f logs/*.log
rm -f pids/*.pid

print_status $BLUE "📁 Created log and PID directories"

# Check system requirements
echo ""
print_status $BLUE "🔍 Checking System Requirements..."

# Check Node.js
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_status $GREEN "✅ Node.js: $NODE_VERSION"
else
    print_status $RED "❌ Node.js not found! Please install Node.js 18+"
    exit 1
fi

# Check npm
if command -v npm > /dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    print_status $GREEN "✅ npm: $NPM_VERSION"
else
    print_status $RED "❌ npm not found!"
    exit 1
fi

# Check if PostgreSQL is running (optional)
if command -v psql > /dev/null 2>&1; then
    print_status $GREEN "✅ PostgreSQL client available"
else
    print_status $YELLOW "⚠️  PostgreSQL client not found - database services might not work"
fi

# Environment setup
echo ""
print_status $BLUE "🔧 Setting up Environment..."

# Set environment variables for development
export NODE_ENV=development
export JWT_SECRET=${JWT_SECRET:-"mstafix-dev-secret-key-2024"}
export AUTH_SERVICE_URL=${AUTH_SERVICE_URL:-"http://localhost:3001"}
export GENERATE_SOAL_SERVICE_URL=${GENERATE_SOAL_SERVICE_URL:-"http://localhost:3002"}
export MANAGE_SOAL_SERVICE_URL=${MANAGE_SOAL_SERVICE_URL:-"http://localhost:3003"}
export NOTIFICATION_SERVICE_URL=${NOTIFICATION_SERVICE_URL:-"http://localhost:3004"}
export API_GATEWAY_URL=${API_GATEWAY_URL:-"http://localhost:3000"}
export WEB_CLIENT_URL=${WEB_CLIENT_URL:-"http://localhost:3005"}

print_status $GREEN "✅ Environment variables set"

# Start services in order
echo ""
print_status $BLUE "🚀 Starting Microservices..."

# 1. Auth Service
start_service "Auth-Service" "auth-service" 3001 "npm start"

# 2. Manage Soal Service
start_service "Manage-Soal-Service" "manage-soal-service" 3003 "npm start"

# 3. Generate Soal Service
start_service "Generate-Soal-Service" "generate-soal-service" 3002 "npm start"

# 4. Notification Service
start_service "Notification-Service" "notification-service" 3004 "npm start"

# 5. API Gateway (optional)
if [ -d "api-gateway" ]; then
    start_service "API-Gateway" "api-gateway" 3000 "npm start"
fi

# Wait for services to be ready
echo ""
print_status $BLUE "⏳ Waiting for Services to Initialize..."

sleep 5

# Check service health
services_ready=true

if ! wait_for_service "Auth Service" "http://localhost:3001"; then
    services_ready=false
fi

if ! wait_for_service "Manage Soal Service" "http://localhost:3003"; then
    services_ready=false
fi

if ! wait_for_service "Generate Soal Service" "http://localhost:3002"; then
    services_ready=false
fi

if ! wait_for_service "Notification Service" "http://localhost:3004"; then
    services_ready=false
fi

# Start Web Client
echo ""
print_status $BLUE "🌐 Starting Web Client..."

if [ ! -d "web-client" ]; then
    print_status $RED "❌ web-client directory not found!"
    exit 1
fi

cd web-client

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    print_status $YELLOW "📝 Creating .env.local file..."
    cp .env.example .env.local 2>/dev/null || cat > .env.local << EOF
JWT_SECRET=mstafix-dev-secret-key-2024
AUTH_SERVICE_URL=http://localhost:3001
GENERATE_SOAL_SERVICE_URL=http://localhost:3002
MANAGE_SOAL_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3004
API_GATEWAY_URL=http://localhost:3000
NODE_ENV=development
ENABLE_DEBUG_LOGS=true
EOF
fi

# Install web client dependencies
if [ ! -d "node_modules" ]; then
    print_status $YELLOW "📦 Installing web client dependencies..."
    npm install
fi

# Build web client
print_status $YELLOW "🔨 Building web client..."
npm run build

# Start web client in development mode
print_status $GREEN "▶️  Starting web client on port 3005..."
npm run dev > ../logs/web-client.log 2>&1 &
WEB_CLIENT_PID=$!
echo $WEB_CLIENT_PID > ../pids/web-client.pid

cd - > /dev/null

# Wait for web client
sleep 3

if check_port 3005; then
    print_status $GREEN "✅ Web Client started successfully!"
else
    print_status $RED "❌ Web Client failed to start"
    services_ready=false
fi

# Run service tests
echo ""
print_status $BLUE "🧪 Running Service Tests..."

if [ -f "test-admin-services.js" ]; then
    node test-admin-services.js
else
    print_status $YELLOW "⚠️  Test script not found, skipping tests"
fi

# Final status
echo ""
print_status $BLUE "📊 STARTUP SUMMARY"
print_status $BLUE "=================="

echo ""
print_status $BLUE "🔗 Service URLs:"
echo "   Auth Service:           http://localhost:3001"
echo "   Generate Soal Service:  http://localhost:3002"
echo "   Manage Soal Service:    http://localhost:3003"
echo "   Notification Service:   http://localhost:3004"
echo "   API Gateway:            http://localhost:3000"
echo "   Web Client:             http://localhost:3005"

echo ""
print_status $BLUE "📊 Running Processes:"
for pidfile in pids/*.pid; do
    if [ -f "$pidfile" ]; then
        service_name=$(basename "$pidfile" .pid)
        pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            print_status $GREEN "   ✅ $service_name (PID: $pid)"
        else
            print_status $RED "   ❌ $service_name (PID: $pid) - Not running"
        fi
    fi
done

echo ""
print_status $BLUE "📝 Log Files:"
echo "   Check logs/ directory for service logs"
echo "   Real-time monitoring: tail -f logs/*.log"

if [ "$services_ready" = true ]; then
    echo ""
    print_status $GREEN "🎉 SUCCESS! All services are running"
    print_status $GREEN "🌐 Admin Dashboard: http://localhost:3005/admin"
    echo ""
    print_status $BLUE "📋 Next Steps:"
    echo "   1. Open browser to http://localhost:3005/admin"
    echo "   2. Use test admin credentials to login"
    echo "   3. Check service health in dashboard"
    echo ""
    print_status $BLUE "🛠️  Debugging Commands:"
    echo "   Monitor logs:     tail -f logs/*.log"
    echo "   Stop services:    ./stop-admin-debug.sh"
    echo "   Test services:    node test-admin-services.js"

    # Create stop script
    cat > stop-admin-debug.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping MSTAFIX services..."
for pidfile in pids/*.pid; do
    if [ -f "$pidfile" ]; then
        pid=$(cat "$pidfile")
        service_name=$(basename "$pidfile" .pid)
        if kill -0 "$pid" 2>/dev/null; then
            echo "   Stopping $service_name (PID: $pid)"
            kill "$pid"
        fi
        rm -f "$pidfile"
    fi
done
echo "✅ All services stopped"
EOF
    chmod +x stop-admin-debug.sh

else
    echo ""
    print_status $RED "❌ SOME SERVICES FAILED TO START"
    print_status $YELLOW "🔍 Check logs/ directory for error details"
    print_status $YELLOW "🛠️  Try running individual services manually"
    exit 1
fi

# Keep script running to monitor
echo ""
print_status $BLUE "👀 Monitoring services... (Press Ctrl+C to stop)"
echo "   Use './stop-admin-debug.sh' to stop all services"

# Monitor loop
while true; do
    sleep 30

    # Check if any service died
    for pidfile in pids/*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            if ! kill -0 "$pid" 2>/dev/null; then
                service_name=$(basename "$pidfile" .pid)
                print_status $RED "⚠️  Service $service_name (PID: $pid) has stopped unexpectedly!"
            fi
        fi
    done
done
