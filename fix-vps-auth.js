// Script khusus untuk fix masalah autentikasi di VPS
// Jalankan dengan: node fix-vps-auth.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

// Colors untuk output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = "reset") {
  console.log(colors[color] + message + colors.reset);
}

// Konfigurasi untuk VPS
const VPS_CONFIG = {
  // Email users yang akan dijadikan admin
  adminEmails: ["admin@example.com", "herdian@example.com"],

  // JWT secrets yang akan dicoba
  jwtSecrets: [
    "your-secret-key",
    "fallback-secret",
    "msta-secret-key",
    process.env.JWT_SECRET
  ].filter(Boolean),

  // Test tokens
  testTokenPayload: {
    userId: "test-user-id",
    email: "test@example.com",
    role: "USER"
  }
};

async function fixVPSAuth() {
  log("🚀 VPS Authentication Fix Tool", "cyan");
  log("=" .repeat(50), "cyan");

  try {
    // 1. Fix database users
    log("\n1. Fixing Database Users...", "blue");
    await fixDatabaseUsers();

    // 2. Test JWT configuration
    log("\n2. Testing JWT Configuration...", "blue");
    await testJWTConfig();

    // 3. Create test admin user
    log("\n3. Creating Test Admin User...", "blue");
    await createTestAdmin();

    // 4. Verify admin users
    log("\n4. Verifying Admin Users...", "blue");
    await verifyAdminUsers();

    // 5. Generate test tokens
    log("\n5. Generating Test Tokens...", "blue");
    await generateTestTokens();

    log("\n🎉 VPS Auth Fix Completed!", "green");
    log("=" .repeat(50), "green");

    await provideFinalInstructions();

  } catch (error) {
    log(`❌ Error during VPS auth fix: ${error.message}`, "red");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixDatabaseUsers() {
  try {
    // Get all users first
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    log(`📋 Found ${allUsers.length} users in database:`, "blue");
    allUsers.forEach((user, index) => {
      const roleColor = user.role === "ADMIN" ? "green" : "yellow";
      log(`  ${index + 1}. ${user.email} - ${user.role}`, roleColor);
    });

    // Fix admin users
    let fixedCount = 0;
    for (const adminEmail of VPS_CONFIG.adminEmails) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: adminEmail }
        });

        if (!user) {
          log(`⚠️ User ${adminEmail} not found, skipping...`, "yellow");
          continue;
        }

        if (user.role === "ADMIN") {
          log(`✅ ${adminEmail} already has ADMIN role`, "green");
          continue;
        }

        // Update to ADMIN
        await prisma.user.update({
          where: { email: adminEmail },
          data: { role: "ADMIN" }
        });

        log(`✅ Updated ${adminEmail} to ADMIN role`, "green");
        fixedCount++;

      } catch (error) {
        log(`❌ Error updating ${adminEmail}: ${error.message}`, "red");
      }
    }

    log(`📊 Fixed ${fixedCount} user(s) to ADMIN role`, "blue");

  } catch (error) {
    log(`❌ Error fixing database users: ${error.message}`, "red");
    throw error;
  }
}

async function testJWTConfig() {
  try {
    log("🔑 Testing JWT secrets...", "cyan");

    const workingSecrets = [];

    for (let i = 0; i < VPS_CONFIG.jwtSecrets.length; i++) {
      const secret = VPS_CONFIG.jwtSecrets[i];
      if (!secret) continue;

      try {
        // Test token creation and verification
        const token = jwt.sign(VPS_CONFIG.testTokenPayload, secret, { expiresIn: "1h" });
        const decoded = jwt.verify(token, secret);

        log(`✅ Secret ${i + 1} (${secret.substring(0, 10)}...) works`, "green");
        workingSecrets.push(secret);

      } catch (error) {
        log(`❌ Secret ${i + 1} failed: ${error.message}`, "red");
      }
    }

    if (workingSecrets.length === 0) {
      log("⚠️ No working JWT secrets found!", "yellow");
      log("💡 This might cause authentication issues", "yellow");
    } else {
      log(`✅ Found ${workingSecrets.length} working JWT secret(s)`, "green");
    }

    return workingSecrets;

  } catch (error) {
    log(`❌ Error testing JWT config: ${error.message}`, "red");
    throw error;
  }
}

async function createTestAdmin() {
  try {
    const testAdminEmail = "test-admin@msta.local";
    const testAdminPassword = "admin123456";

    // Check if test admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: testAdminEmail }
    });

    if (existingAdmin) {
      log(`✅ Test admin ${testAdminEmail} already exists`, "green");

      // Make sure it has ADMIN role
      if (existingAdmin.role !== "ADMIN") {
        await prisma.user.update({
          where: { email: testAdminEmail },
          data: { role: "ADMIN" }
        });
        log(`✅ Updated test admin role to ADMIN`, "green");
      }

      return;
    }

    // Create new test admin
    const hashedPassword = await bcrypt.hash(testAdminPassword, 10);

    const newAdmin = await prisma.user.create({
      data: {
        email: testAdminEmail,
        password: hashedPassword,
        name: "Test Admin",
        role: "ADMIN"
      }
    });

    log(`✅ Created test admin: ${testAdminEmail}`, "green");
    log(`📝 Password: ${testAdminPassword}`, "blue");
    log(`🆔 ID: ${newAdmin.id}`, "blue");

  } catch (error) {
    log(`❌ Error creating test admin: ${error.message}`, "red");
  }
}

async function verifyAdminUsers() {
  try {
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (adminUsers.length === 0) {
      log("❌ No admin users found!", "red");
      return;
    }

    log(`👑 Found ${adminUsers.length} admin user(s):`, "green");
    log("=" .repeat(60), "green");

    adminUsers.forEach((admin, index) => {
      log(`${index + 1}. ${admin.name} (${admin.email})`);
      log(`   ID: ${admin.id}`);
      log(`   Role: ${admin.role}`);
      log(`   Created: ${admin.createdAt.toLocaleDateString("id-ID")}`);
      log("-" .repeat(50));
    });

    // Test login credentials for each admin
    log("\n🔐 Admin Login Information:", "cyan");
    adminUsers.forEach((admin, index) => {
      log(`${index + 1}. Email: ${admin.email}`);
      if (admin.email === "test-admin@msta.local") {
        log(`   Password: admin123456`, "blue");
      } else {
        log(`   Password: [Use your registered password]`, "yellow");
      }
    });

  } catch (error) {
    log(`❌ Error verifying admin users: ${error.message}`, "red");
  }
}

async function generateTestTokens() {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });

    if (!adminUser) {
      log("❌ No admin user found for token generation", "red");
      return;
    }

    log(`🎫 Generating test tokens for: ${adminUser.email}`, "cyan");

    for (let i = 0; i < VPS_CONFIG.jwtSecrets.length; i++) {
      const secret = VPS_CONFIG.jwtSecrets[i];
      if (!secret) continue;

      try {
        const payload = {
          userId: adminUser.id,
          email: adminUser.email,
          role: adminUser.role
        };

        const token = jwt.sign(payload, secret, { expiresIn: "24h" });

        log(`✅ Token ${i + 1} generated successfully`, "green");
        log(`   Secret: ${secret.substring(0, 10)}...`);
        log(`   Token: ${token.substring(0, 20)}...`);

        // Verify the token works
        const decoded = jwt.verify(token, secret);
        log(`   ✓ Token verification successful`, "green");

      } catch (error) {
        log(`❌ Token ${i + 1} generation failed: ${error.message}`, "red");
      }
    }

  } catch (error) {
    log(`❌ Error generating test tokens: ${error.message}`, "red");
  }
}

async function provideFinalInstructions() {
  log("\n📋 VPS DEPLOYMENT INSTRUCTIONS", "magenta");
  log("=" .repeat(60), "magenta");

  log("\n1. 🔧 Environment Variables:", "blue");
  log("   Set these in your VPS environment:");
  log(`   JWT_SECRET=${VPS_CONFIG.jwtSecrets[0]}`);
  log("   NODE_ENV=production");
  log("   IS_VPS=true");

  log("\n2. 🐳 Docker Restart:", "blue");
  log("   After setting environment variables:");
  log("   docker-compose down");
  log("   docker-compose up -d");

  log("\n3. 🧹 Clear Browser Data:", "blue");
  log("   Before testing, clear:");
  log("   • All cookies for your domain");
  log("   • localStorage data");
  log("   • Or use incognito mode");

  log("\n4. 🔐 Test Login Accounts:", "blue");
  const adminUsers = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true }
  });

  if (adminUsers.length > 0) {
    log("   Admin accounts to test:");
    adminUsers.forEach((admin, index) => {
      log(`   ${index + 1}. ${admin.email}`);
      if (admin.email === "test-admin@msta.local") {
        log("      Password: admin123456");
      }
    });
  }

  log("\n5. 🚨 If Still Having Issues:", "yellow");
  log("   • Check server logs: docker-compose logs web-client");
  log("   • Check auth service logs: docker-compose logs auth-service");
  log("   • Check browser console for errors");
  log("   • Try different browser/incognito mode");
  log("   • Restart all services: docker-compose restart");

  log("\n6. 🎯 Expected Behavior:", "green");
  log("   ✅ Admin login → Redirect to /admin");
  log("   ✅ User login → Redirect to /generate-soal");
  log("   ✅ No session expiry during normal usage");
  log("   ✅ Proper role-based access control");

  log("\n🎉 Fix process completed!", "green");
  log("💡 Run this script again if you encounter issues", "blue");
}

// Command line handling
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  log("📖 VPS Authentication Fix Tool", "blue");
  log("=" .repeat(40), "blue");
  log("This tool will:");
  log("• Fix user roles in database");
  log("• Test JWT configuration");
  log("• Create test admin user");
  log("• Verify admin access");
  log("• Generate test tokens");
  log("• Provide deployment instructions");
  log("");
  log("Usage: node fix-vps-auth.js");
  log("");
  log("Make sure to:");
  log("1. Run this on your VPS");
  log("2. Have database access");
  log("3. Set proper environment variables after");
  log("4. Restart services after running");
} else {
  fixVPSAuth();
}
