// Script debug untuk masalah autentikasi MSTA
// Jalankan dengan: node debug-auth-issue.js

const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

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

// Konfigurasi
const CONFIG = {
  baseUrl: "http://localhost:3000",
  authServiceUrl: "http://localhost:3001",
  testUsers: [
    { email: "user@example.com", expectedRole: "USER" },
    { email: "herdian@example.com", expectedRole: "USER" }, // atau ADMIN jika sudah diubah
  ],
};

async function debugAuth() {
  log("🔍 MSTA Authentication Debug Tool", "cyan");
  log("=" .repeat(60), "cyan");

  try {
    // 1. Cek Database Connection
    log("\n1. Testing Database Connection...", "blue");
    await testDatabaseConnection();

    // 2. Cek Users di Database
    log("\n2. Checking Users in Database...", "blue");
    await checkUsersInDatabase();

    // 3. Test Login API
    log("\n3. Testing Login API...", "blue");
    await testLoginAPI();

    // 4. Test Token Validation
    log("\n4. Testing Token Validation...", "blue");
    await testTokenValidation();

    // 5. Test Cookie Setting
    log("\n5. Testing Cookie Settings...", "blue");
    await testCookieSettings();

    // 6. Test Middleware Logic
    log("\n6. Testing Middleware Logic...", "blue");
    await testMiddlewareLogic();

    // 7. Summary dan Rekomendasi
    log("\n7. Summary & Recommendations", "blue");
    await provideSummary();

  } catch (error) {
    log(`❌ Fatal error during debug: ${error.message}`, "red");
  } finally {
    await prisma.$disconnect();
    log("\n👋 Debug session completed", "cyan");
  }
}

async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    log("✅ Database connection successful", "green");

    const userCount = await prisma.user.count();
    log(`📊 Total users in database: ${userCount}`, "blue");
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, "red");
    throw error;
  }
}

async function checkUsersInDatabase() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (users.length === 0) {
      log("❌ No users found in database", "red");
      return;
    }

    log(`📋 Found ${users.length} users:`, "green");
    users.forEach((user, index) => {
      const roleColor = user.role === "ADMIN" ? "green" : "yellow";
      log(`  ${index + 1}. ${user.email}`);
      log(`     Name: ${user.name}`);
      log(`     Role: ${user.role}`, roleColor);
      log(`     ID: ${user.id}`);
      log(`     Created: ${user.createdAt.toLocaleDateString("id-ID")}`);
      log("     " + "-".repeat(40));
    });

    // Cek apakah ada admin
    const adminCount = users.filter((u) => u.role === "ADMIN").length;
    if (adminCount === 0) {
      log("⚠️ No admin users found!", "yellow");
      log("💡 Run: node change-user-to-admin.js", "yellow");
    } else {
      log(`✅ Found ${adminCount} admin user(s)`, "green");
    }
  } catch (error) {
    log(`❌ Error checking users: ${error.message}`, "red");
  }
}

async function testLoginAPI() {
  for (const testUser of CONFIG.testUsers) {
    try {
      log(`\n🔐 Testing login for: ${testUser.email}`, "cyan");

      // Cek apakah user ada di database
      const userInDb = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      if (!userInDb) {
        log(`❌ User ${testUser.email} not found in database`, "red");
        continue;
      }

      log(`✅ User found in database with role: ${userInDb.role}`);

      // Test login API (kita tidak bisa test tanpa password, jadi skip actual login)
      log(`ℹ️ User exists and ready for login test`, "blue");
      log(`   Expected role: ${testUser.expectedRole}`);
      log(`   Actual role: ${userInDb.role}`);

      if (userInDb.role !== testUser.expectedRole) {
        log(`⚠️ Role mismatch detected!`, "yellow");
        log(`💡 To fix: node change-user-to-admin.js`, "yellow");
      }
    } catch (error) {
      log(`❌ Error testing login for ${testUser.email}: ${error.message}`, "red");
    }
  }
}

async function testTokenValidation() {
  try {
    log("🔑 Testing JWT token creation and validation...");

    // Test JWT secrets
    const secrets = [
      process.env.JWT_SECRET,
      "your-secret-key", // fallback dari auth service
      "fallback-secret", // fallback dari web client
    ];

    log("🔍 Checking JWT secrets:");
    secrets.forEach((secret, index) => {
      if (secret) {
        log(`  ${index + 1}. Secret ${index + 1}: ${secret.substring(0, 10)}...`, "green");
      } else {
        log(`  ${index + 1}. Secret ${index + 1}: undefined`, "red");
      }
    });

    // Test token creation and validation
    const testPayload = {
      userId: "test-id",
      email: "test@example.com",
      role: "USER",
    };

    for (let i = 0; i < secrets.length; i++) {
      if (!secrets[i]) continue;

      try {
        const token = jwt.sign(testPayload, secrets[i], { expiresIn: "1h" });
        const decoded = jwt.verify(token, secrets[i]);
        log(`✅ Secret ${i + 1} works for token creation/validation`, "green");
      } catch (error) {
        log(`❌ Secret ${i + 1} failed: ${error.message}`, "red");
      }
    }
  } catch (error) {
    log(`❌ Token validation test failed: ${error.message}`, "red");
  }
}

async function testCookieSettings() {
  try {
    log("🍪 Testing cookie configuration...");

    // Test cookie API endpoint
    try {
      const response = await fetch(`${CONFIG.baseUrl}/api/auth/set-cookie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "test-token" }),
      });

      if (response.ok) {
        log("✅ Cookie setting API is accessible", "green");
      } else {
        log(`❌ Cookie API returned status: ${response.status}`, "red");
      }
    } catch (error) {
      log(`❌ Cookie API test failed: ${error.message}`, "red");
      log("💡 Make sure the web application is running on localhost:3000", "yellow");
    }

    // Analyze cookie settings
    log("\n🔍 Cookie configuration analysis:");
    log("  Production mode: " + (process.env.NODE_ENV === "production" ? "Yes" : "No"));
    log("  Expected settings for development:");
    log("    - httpOnly: false (for client access)");
    log("    - secure: false (for HTTP)");
    log("    - sameSite: 'lax' (less strict)");
  } catch (error) {
    log(`❌ Cookie settings test failed: ${error.message}`, "red");
  }
}

async function testMiddlewareLogic() {
  try {
    log("🛡️ Testing middleware logic...");

    // Test public routes
    const publicRoutes = ["/", "/login", "/register"];
    for (const route of publicRoutes) {
      try {
        const response = await fetch(`${CONFIG.baseUrl}${route}`);
        log(`✅ Public route ${route}: ${response.status}`, "green");
      } catch (error) {
        log(`❌ Public route ${route} failed: ${error.message}`, "red");
      }
    }

    // Test protected routes (should redirect to login)
    const protectedRoutes = ["/generate-soal", "/admin"];
    for (const route of protectedRoutes) {
      try {
        const response = await fetch(`${CONFIG.baseUrl}${route}`, {
          redirect: "manual",
        });
        if (response.status === 302 || response.status === 301) {
          log(`✅ Protected route ${route}: Correctly redirects (${response.status})`, "green");
        } else {
          log(`⚠️ Protected route ${route}: Status ${response.status}`, "yellow");
        }
      } catch (error) {
        log(`❌ Protected route ${route} failed: ${error.message}`, "red");
      }
    }
  } catch (error) {
    log(`❌ Middleware logic test failed: ${error.message}`, "red");
  }
}

async function provideSummary() {
  log("\n📊 DIAGNOSIS & RECOMMENDATIONS", "magenta");
  log("=" .repeat(60), "magenta");

  // Common issues and solutions
  const commonIssues = [
    {
      issue: "User redirect loop setelah login",
      causes: [
        "Cookie setting gagal (secure flag untuk HTTP)",
        "JWT secret tidak match antara auth-service dan web-client",
        "Token validation gagal di middleware",
        "localStorage/cookie tidak sinkron",
      ],
      solutions: [
        "Set cookie httpOnly: false, secure: false untuk development",
        "Pastikan JWT_SECRET sama di semua service",
        "Cek console browser untuk error JavaScript",
        "Clear browser cache dan cookies",
      ],
    },
    {
      issue: "Role USER tidak redirect ke /admin",
      causes: [
        "User role masih 'USER' bukan 'ADMIN'",
        "Login logic cek role tidak benar",
      ],
      solutions: [
        "Jalankan: node change-user-to-admin.js",
        "Cek database: SELECT * FROM User WHERE email = 'your-email'",
      ],
    },
  ];

  commonIssues.forEach((item, index) => {
    log(`\n${index + 1}. 🚨 ${item.issue}`, "red");
    log("   Possible causes:", "yellow");
    item.causes.forEach((cause) => log(`     • ${cause}`));
    log("   Solutions:", "green");
    item.solutions.forEach((solution) => log(`     ✓ ${solution}`));
  });

  log("\n🔧 QUICK FIXES", "cyan");
  log("=" .repeat(30), "cyan");
  log("1. Fix user role:");
  log("   node change-user-to-admin.js");
  log("");
  log("2. Clear browser data:");
  log("   - Clear localStorage");
  log("   - Clear cookies");
  log("   - Hard refresh (Ctrl+Shift+R)");
  log("");
  log("3. Check application status:");
  log("   - Web client: http://localhost:3000");
  log("   - Auth service: http://localhost:3001");
  log("");
  log("4. Debug steps:");
  log("   - Check browser console for errors");
  log("   - Check server logs");
  log("   - Test with different browser/incognito");

  log("\n🎯 NEXT STEPS", "blue");
  log("=" .repeat(20), "blue");
  log("1. Identify the exact error from logs above");
  log("2. Apply the corresponding quick fix");
  log("3. Test login again");
  log("4. If still failing, check browser console for detailed errors");
}

// Command line handling
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  log("📖 MSTA Auth Debug Tool", "blue");
  log("=" .repeat(30), "blue");
  log("Usage: node debug-auth-issue.js");
  log("");
  log("This tool will:");
  log("• Test database connection");
  log("• Check user roles in database");
  log("• Test login API endpoints");
  log("• Validate JWT token configuration");
  log("• Test cookie settings");
  log("• Analyze middleware logic");
  log("• Provide recommendations");
  log("");
  log("Make sure your application is running before using this tool.");
} else {
  debugAuth();
}
