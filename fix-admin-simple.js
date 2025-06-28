// Script sederhana untuk fix admin role
// Jalankan dengan: node fix-admin-simple.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixAdmin() {
  try {
    console.log("🔧 Fixing admin role...");

    // Update admin@example.com to ADMIN role
    const adminUser = await prisma.user.update({
      where: { email: "admin@example.com" },
      data: { role: "ADMIN" }
    });

    console.log("✅ Admin fixed:", adminUser.email, "->", adminUser.role);

    // List all users to verify
    const users = await prisma.user.findMany({
      select: { email: true, role: true }
    });

    console.log("\n📋 All users:");
    users.forEach(user => {
      console.log(`   ${user.email} -> ${user.role}`);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();
