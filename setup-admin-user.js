// Script untuk setup user admin pertama kali
// Jalankan dengan: node setup-admin-user.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log("🚀 Memulai setup admin...");

    // GANTI EMAIL DAN PASSWORD ADMIN DI SINI
    const adminData = {
      email: "herdian@example.com", // Ganti dengan email admin yang diinginkan
      password: "admin123", // Ganti dengan password yang kuat
      name: "Herdian Admin", // Ganti dengan nama admin
    };

    console.log(`📧 Mencari user dengan email: ${adminData.email}`);

    // Cek apakah user dengan email tersebut sudah ada
    let user = await prisma.user.findUnique({
      where: { email: adminData.email },
    });

    if (user) {
      console.log("👤 User sudah ada, mengupdate role menjadi ADMIN...");

      // Update user yang sudah ada menjadi admin
      user = await prisma.user.update({
        where: { email: adminData.email },
        data: {
          role: "ADMIN",
          name: adminData.name,
        },
      });

      console.log("✅ User berhasil diupdate menjadi admin!");
    } else {
      console.log("👤 User belum ada, membuat user admin baru...");

      // Hash password
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      // Buat user admin baru
      user = await prisma.user.create({
        data: {
          email: adminData.email,
          password: hashedPassword,
          name: adminData.name,
          role: "ADMIN",
        },
      });

      console.log("✅ User admin baru berhasil dibuat!");
    }

    console.log("\n📋 Detail Admin:");
    console.log("===================");
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Nama: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log("===================");

    console.log("\n🎉 Setup admin selesai!");
    console.log("💡 Sekarang Anda bisa login dengan kredensial admin di atas");
    console.log(
      "🔐 Setelah login, admin akan otomatis diarahkan ke dashboard admin (/admin)",
    );
  } catch (error) {
    console.error("❌ Error saat setup admin:", error);

    if (error.code === "P2002") {
      console.log(
        "💡 Email sudah terdaftar. Gunakan email lain atau update user yang sudah ada.",
      );
    }
  } finally {
    await prisma.$disconnect();
    console.log("\n👋 Koneksi database ditutup.");
  }
}

// Fungsi untuk menampilkan daftar admin yang ada
async function listAdmins() {
  try {
    console.log("📋 Mencari semua admin...");

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (admins.length === 0) {
      console.log("❌ Tidak ada admin yang ditemukan.");
      return;
    }

    console.log("\n👥 Daftar Admin:");
    console.log("===================");
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Dibuat: ${admin.createdAt.toLocaleDateString("id-ID")}`);
      console.log("-------------------");
    });
  } catch (error) {
    console.error("❌ Error saat mencari admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Cek argumen command line
const args = process.argv.slice(2);

if (args.includes("--list") || args.includes("-l")) {
  listAdmins();
} else if (args.includes("--help") || args.includes("-h")) {
  console.log("📖 Cara penggunaan:");
  console.log("==================");
  console.log("node setup-admin-user.js        # Setup admin baru");
  console.log("node setup-admin-user.js --list # Lihat daftar admin");
  console.log("node setup-admin-user.js --help # Tampilkan bantuan");
  console.log("");
  console.log("💡 Tips:");
  console.log("- Edit email, password, dan nama admin di dalam file ini");
  console.log(
    "- Script ini akan membuat admin baru atau mengupdate user yang sudah ada",
  );
  console.log(
    "- Setelah setup, admin bisa login dan akan otomatis ke dashboard admin",
  );
} else {
  setupAdmin();
}
