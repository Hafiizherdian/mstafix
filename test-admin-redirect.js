// Script untuk test sistem redirect admin
// Jalankan dengan: node test-admin-redirect.js

const { PrismaClient } = require("@prisma/client");
const fetch = require("node-fetch");
const prisma = new PrismaClient();

// Konfigurasi test
const TEST_CONFIG = {
  baseUrl: "http://localhost:3000", // Ganti dengan URL aplikasi Anda
  adminCredentials: {
    email: "admin@msta.com",
    password: "admin123",
  },
  userCredentials: {
    email: "user@test.com",
    password: "user123",
  },
};

// Colors untuk console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(colors[color] + message + colors.reset);
}

// Test 1: Cek database setup
async function testDatabaseSetup() {
  log("\n🔍 Test 1: Checking Database Setup", "cyan");
  log("=" .repeat(50), "cyan");

  try {
    // Cek admin users
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, name: true, role: true },
    });

    if (admins.length === 0) {
      log("❌ No admin users found in database", "red");
      log("💡 Run: node setup-admin-user.js", "yellow");
      return false;
    }

    log(`✅ Found ${admins.length} admin user(s):`, "green");
    admins.forEach((admin, index) => {
      log(`   ${index + 1}. ${admin.name} (${admin.email}) - ${admin.role}`);
    });

    // Cek regular users
    const users = await prisma.user.findMany({
      where: { role: "USER" },
      select: { id: true, email: true, name: true, role: true },
    });

    log(`✅ Found ${users.length} regular user(s)`, "green");

    return true;
  } catch (error) {
    log(`❌ Database connection error: ${error.message}`, "red");
    return false;
  }
}

// Test 2: Test login API
async function testLoginAPI() {
  log("\n🔍 Test 2: Testing Login API", "cyan");
  log("=" .repeat(50), "cyan");

  try {
    // Test admin login
    log("📧 Testing admin login...");
    const adminResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_CONFIG.adminCredentials),
    });

    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      log(`✅ Admin login successful: ${adminData.user?.email}`, "green");
      log(`   Role: ${adminData.user?.role}`);
      log(`   Token: ${adminData.token ? "✅ Present" : "❌ Missing"}`);
    } else {
      log(`❌ Admin login failed: ${adminResponse.status}`, "red");
    }

    // Test user login (if user exists)
    const testUser = await prisma.user.findUnique({
      where: { email: TEST_CONFIG.userCredentials.email },
    });

    if (testUser) {
      log("📧 Testing regular user login...");
      const userResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(TEST_CONFIG.userCredentials),
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        log(`✅ User login successful: ${userData.user?.email}`, "green");
        log(`   Role: ${userData.user?.role}`);
      } else {
        log(`❌ User login failed: ${userResponse.status}`, "red");
      }
    } else {
      log("⚠️ Test user not found, skipping user login test", "yellow");
    }

    return true;
  } catch (error) {
    log(`❌ Login API test error: ${error.message}`, "red");
    return false;
  }
}

// Test 3: Test page access
async function testPageAccess() {
  log("\n🔍 Test 3: Testing Page Access", "cyan");
  log("=" .repeat(50), "cyan");

  try {
    // Test admin page without auth
    log("🔐 Testing admin page access without authentication...");
    const adminPageResponse = await fetch(`${TEST_CONFIG.baseUrl}/admin`);

    if (adminPageResponse.status === 302 || adminPageResponse.redirected) {
      log("✅ Admin page properly redirects unauthenticated users", "green");
    } else {
      log("❌ Admin page should redirect unauthenticated users", "red");
    }

    // Test login page access
    log("📋 Testing login page access...");
    const loginPageResponse = await fetch(`${TEST_CONFIG.baseUrl}/login`);

    if (loginPageResponse.ok) {
      log("✅ Login page accessible", "green");
    } else {
      log("❌ Login page not accessible", "red");
    }

    return true;
  } catch (error) {
    log(`❌ Page access test error: ${error.message}`, "red");
    return false;
  }
}

// Test 4: Check middleware configuration
async function testMiddlewareConfig() {
  log("\n🔍 Test 4: Checking Middleware Configuration", "cyan");
  log("=" .repeat(50), "cyan");

  try {
    const fs = require("fs");
    const path = require("path");

    // Check if middleware file exists
    const middlewarePath = path.join(__dirname, "web-client/src/middleware.ts");

    if (fs.existsSync(middlewarePath)) {
      log("✅ Middleware file exists", "green");

      const middlewareContent = fs.readFileSync(middlewarePath, "utf8");

      // Check for important configurations
      const checks = [
        { pattern: /adminRoutes.*=.*\[.*\/admin/, description: "Admin routes configuration" },
        { pattern: /protectedRoutes.*=.*\[.*\/generate-soal/, description: "Protected routes configuration" },
        { pattern: /decoded\.role.*===.*ADMIN/, description: "Admin role check" },
        { pattern: /NextResponse\.redirect/, description: "Redirect logic" },
      ];

      checks.forEach((check) => {
        if (check.pattern.test(middlewareContent)) {
          log(`✅ ${check.description}`, "green");
        } else {
          log(`❌ Missing: ${check.description}`, "red");
        }
      });
    } else {
      log("❌ Middleware file not found", "red");
    }

    return true;
  } catch (error) {
    log(`❌ Middleware config test error: ${error.message}`, "red");
    return false;
  }
}

// Test 5: Check login page redirect logic
async function testLoginRedirectLogic() {
  log("\n🔍 Test 5: Checking Login Page Redirect Logic", "cyan");
  log("=" .repeat(50), "cyan");

  try {
    const fs = require("fs");
    const path = require("path");

    // Check login page file
    const loginPagePath = path.join(__dirname, "web-client/src/app/login/page.tsx");

    if (fs.existsSync(loginPagePath)) {
      log("✅ Login page file exists", "green");

      const loginContent = fs.readFileSync(loginPagePath, "utf8");

      // Check for redirect logic
      const checks = [
        { pattern: /role.*===.*ADMIN.*\?.*\/admin.*:.*\/generate-soal/, description: "Role-based redirect logic" },
        { pattern: /window\.location\.href.*=.*redirectPath/, description: "Window location redirect" },
        { pattern: /router\.push\(redirectPath\)/, description: "Router push redirect" },
      ];

      checks.forEach((check) => {
        if (check.pattern.test(loginContent)) {
          log(`✅ ${check.description}`, "green");
        } else {
          log(`⚠️ Check: ${check.description}`, "yellow");
        }
      });
    } else {
      log("❌ Login page file not found", "red");
    }

    return true;
  } catch (error) {
    log(`❌ Login redirect logic test error: ${error.message}`, "red");
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log("🚀 Starting Admin Redirect System Tests", "blue");
  log("=" .repeat(60), "blue");

  const testResults = {
    database: false,
    loginApi: false,
    pageAccess: false,
    middleware: false,
    loginLogic: false,
  };

  try {
    testResults.database = await testDatabaseSetup();
    testResults.loginApi = await testLoginAPI();
    testResults.pageAccess = await testPageAccess();
    testResults.middleware = await testMiddlewareConfig();
    testResults.loginLogic = await testLoginRedirectLogic();

    // Summary
    log("\n📊 Test Summary", "blue");
    log("=" .repeat(60), "blue");

    const passed = Object.values(testResults).filter(Boolean).length;
    const total = Object.keys(testResults).length;

    Object.entries(testResults).forEach(([test, result]) => {
      const status = result ? "✅ PASS" : "❌ FAIL";
      const color = result ? "green" : "red";
      log(`${status} ${test.charAt(0).toUpperCase() + test.slice(1)} Test`, color);
    });

    log(`\n🎯 Overall: ${passed}/${total} tests passed`, passed === total ? "green" : "yellow");

    if (passed === total) {
      log("\n🎉 All tests passed! Admin redirect system is ready!", "green");
      log("💡 You can now login as admin and will be redirected to dashboard", "green");
    } else {
      log("\n⚠️ Some tests failed. Please check the issues above.", "yellow");
      log("💡 Run the setup scripts and fix any configuration issues.", "yellow");
    }

  } catch (error) {
    log(`❌ Test runner error: ${error.message}`, "red");
  } finally {
    await prisma.$disconnect();
  }
}

// Instructions
function showInstructions() {
  log("📖 Admin Redirect Test Instructions", "blue");
  log("=" .repeat(60), "blue");
  log("1. Make sure your application is running on localhost:3000");
  log("2. Ensure database is connected and migrations are run");
  log("3. Run setup-admin-user.js first to create admin user");
  log("4. Then run this test script");
  log("");
  log("Commands:");
  log("  node test-admin-redirect.js           # Run all tests");
  log("  node test-admin-redirect.js --help    # Show this help");
  log("");
}

// Command line handling
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  showInstructions();
} else {
  runAllTests();
}
