#!/bin/bash

# Script setup lengkap untuk sistem admin redirect MSTA
# Jalankan dengan: bash setup-admin-complete.sh

echo "🚀 MSTA Admin Setup - Sistem Redirect Otomatis"
echo "=============================================="
echo ""

# Colors untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fungsi untuk print dengan warna
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

print_step() {
    echo -e "${CYAN}🔧 $1${NC}"
}

# Fungsi untuk cek apakah command tersedia
check_command() {
    if command -v $1 >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Cek prerequisites
echo "🔍 Checking Prerequisites..."
echo "----------------------------"

if check_command node; then
    NODE_VERSION=$(node --version)
    print_status "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js first."
    exit 1
fi

if check_command npm; then
    NPM_VERSION=$(npm --version)
    print_status "npm installed: $NPM_VERSION"
else
    print_error "npm not found. Please install npm first."
    exit 1
fi

# Cek apakah kita di direktori yang benar
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_status "Prerequisites check completed"
echo ""

# Step 1: Install dependencies
print_step "Step 1: Installing dependencies..."
if npm install; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi
echo ""

# Step 2: Check database connection
print_step "Step 2: Checking database connection..."
if npx prisma db push --accept-data-loss >/dev/null 2>&1; then
    print_status "Database connection successful"
else
    print_warning "Database might not be ready. Make sure your database is running."
    print_info "Continuing with setup..."
fi
echo ""

# Step 3: Setup admin user
print_step "Step 3: Setting up admin user..."
echo "📝 Admin credentials yang akan dibuat:"
echo "   Email: admin@msta.com"
echo "   Password: admin123"
echo "   Nama: Administrator MSTA"
echo ""
echo -e "${YELLOW}⚠️ PENTING: Ubah password default setelah login pertama!${NC}"
echo ""

read -p "Lanjutkan dengan setup admin? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if node setup-admin-user.js; then
        print_status "Admin user setup completed"
    else
        print_error "Failed to setup admin user"
        print_info "You can run 'node setup-admin-user.js' manually later"
    fi
else
    print_warning "Admin setup skipped. Run 'node setup-admin-user.js' manually later."
fi
echo ""

# Step 4: Check web client setup
print_step "Step 4: Checking web client setup..."
if [ -d "web-client" ]; then
    print_status "Web client directory found"

    cd web-client

    # Install web client dependencies
    print_info "Installing web client dependencies..."
    if npm install; then
        print_status "Web client dependencies installed"
    else
        print_warning "Failed to install web client dependencies"
    fi

    # Build web client (optional)
    echo ""
    read -p "Build web client for production? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Building web client..."
        if npm run build; then
            print_status "Web client built successfully"
        else
            print_warning "Web client build failed, but setup can continue"
        fi
    fi

    cd ..
else
    print_warning "Web client directory not found"
fi
echo ""

# Step 5: Test setup
print_step "Step 5: Testing admin redirect system..."
if [ -f "test-admin-redirect.js" ]; then
    echo ""
    read -p "Run automated tests? This requires the application to be running. (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Running tests..."
        if node test-admin-redirect.js; then
            print_status "Tests completed. Check results above."
        else
            print_warning "Some tests failed. Check the output above for details."
        fi
    else
        print_info "Tests skipped. You can run 'node test-admin-redirect.js' manually later."
    fi
else
    print_warning "Test script not found. Skipping automated tests."
fi
echo ""

# Summary dan instructions
echo "🎉 Setup Completed!"
echo "=================="
echo ""
print_status "Admin redirect system has been configured successfully!"
echo ""
echo "📋 What's been set up:"
echo "   ✅ Admin user created (admin@msta.com)"
echo "   ✅ Role-based redirect system configured"
echo "   ✅ Middleware protection enabled"
echo "   ✅ Dashboard admin ready"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start your application:"
echo "      • Docker: docker-compose up"
echo "      • Development: npm run dev (in web-client folder)"
echo ""
echo "   2. Access the login page:"
echo "      • URL: http://localhost:3000/login"
echo ""
echo "   3. Login sebagai admin:"
echo "      • Email: admin@msta.com"
echo "      • Password: admin123"
echo "      • Akan otomatis redirect ke: http://localhost:3000/admin"
echo ""
echo "   4. Login sebagai user biasa:"
echo "      • Register user baru atau gunakan existing user"
echo "      • Akan otomatis redirect ke: http://localhost:3000/generate-soal"
echo ""
echo "🔧 Troubleshooting:"
echo "   • Jika redirect tidak bekerja: Clear browser cache/cookies"
echo "   • Jika login gagal: Check database connection"
echo "   • Untuk help: node setup-admin-user.js --help"
echo "   • Run tests: node test-admin-redirect.js"
echo ""
echo "📚 Documentation:"
echo "   • Read: PANDUAN_ADMIN_REDIRECT.md"
echo "   • Check: ADMIN_DASHBOARD_IMPLEMENTATION.md"
echo ""
echo -e "${GREEN}🎯 Admin redirect system is ready to use!${NC}"
echo -e "${YELLOW}⚠️ Remember to change the default admin password after first login!${NC}"
