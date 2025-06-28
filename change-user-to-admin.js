// Script untuk mengubah role user menjadi ADMIN
// Jalankan dengan: node change-user-to-admin.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Colors untuk output
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

async function changeUserToAdmin() {
  try {
    log("🔍 Mencari user yang akan dijadikan admin...", "cyan");

    // GANTI EMAIL USER YANG INGIN DIJADIKAN ADMIN
    const userEmail = "admin@example.com"; // Ganti dengan email user yang ingin dijadikan admin

    console.log(`📧 Email target: ${userEmail}`);

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      log(`❌ User dengan email ${userEmail} tidak ditemukan!`, "red");
      log("💡 Pastikan email sudah benar atau user sudah terdaftar", "yellow");
      return;
    }

    log("👤 User ditemukan:", "green");
    log(`   Nama: ${user.name}`);
    log(`   Email: ${user.email}`);
    log(`   Role saat ini: ${user.role}`);
    log(`   Terdaftar: ${user.createdAt.toLocaleDateString("id-ID")}`);

    if (user.role === "ADMIN") {
      log("✅ User sudah memiliki role ADMIN!", "green");
      log("💡 Tidak perlu mengubah apa pun", "blue");
      return;
    }

    log("\n🔄 Mengubah role menjadi ADMIN...", "yellow");

    // Update role menjadi ADMIN
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    log("\n🎉 Berhasil mengubah role user!", "green");
    log("=".repeat(40), "green");
    log(`✅ Nama: ${updatedUser.name}`);
    log(`✅ Email: ${updatedUser.email}`);
    log(`✅ Role: ${updatedUser.role}`);
    log(`✅ Diupdate: ${updatedUser.updatedAt.toLocaleString("id-ID")}`);
    log("=".repeat(40), "green");

    log("\n🚀 Sekarang user ini bisa login sebagai admin!", "blue");
    log(
      "💡 Saat login, akan otomatis diarahkan ke dashboard admin (/admin)",
      "blue",
    );
  } catch (error) {
    log(`❌ Error saat mengubah role user: ${error.message}`, "red");

    if (error.code === "P2025") {
      log(
        "💡 User tidak ditemukan. Periksa kembali email yang dimasukkan.",
        "yellow",
      );
    } else if (error.code === "P2002") {
      log(
        "💡 Terjadi konflik data. Coba lagi setelah beberapa saat.",
        "yellow",
      );
    } else {
      log(
        "💡 Periksa koneksi database dan pastikan Prisma sudah dikonfigurasi dengan benar.",
        "yellow",
      );
    }
  } finally {
    await prisma.$disconnect();
    log("\n👋 Koneksi database ditutup.", "cyan");
  }
}

// Fungsi untuk melihat semua user dan role mereka
async function listAllUsers() {
  try {
    log("📋 Daftar semua user:", "cyan");
    log("=".repeat(50), "cyan");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (users.length === 0) {
      log("❌ Tidak ada user yang ditemukan", "red");
      return;
    }

    users.forEach((user, index) => {
      const roleColor = user.role === "ADMIN" ? "green" : "yellow";
      log(`${index + 1}. ${user.name} (${user.email})`);
      log(`   Role: ${user.role}`, roleColor);
      log(`   Terdaftar: ${user.createdAt.toLocaleDateString("id-ID")}`);
      log("-".repeat(30));
    });

    const adminCount = users.filter((user) => user.role === "ADMIN").length;
    const userCount = users.filter((user) => user.role === "USER").length;

    log(`\n📊 Ringkasan:`);
    log(`   👑 Admin: ${adminCount} orang`, "green");
    log(`   👤 User: ${userCount} orang`, "yellow");
    log(`   📝 Total: ${users.length} orang`, "blue");
  } catch (error) {
    log(`❌ Error saat mengambil daftar user: ${error.message}`, "red");
  } finally {
    await prisma.$disconnect();
  }
}

// Fungsi bantuan
function showHelp() {
  log("📖 Cara Penggunaan Script", "blue");
  log("=".repeat(50), "blue");
  log("1. Edit email di dalam script (line 22)");
  log("2. Jalankan script:");
  log("   node change-user-to-admin.js");
  log("");
  log("📋 Perintah Tersedia:");
  log("   node change-user-to-admin.js          # Ubah user jadi admin");
  log("   node change-user-to-admin.js --list   # Lihat semua user");
  log("   node change-user-to-admin.js --help   # Tampilkan bantuan");
  log("");
  log("💡 Tips:");
  log("   • Pastikan user sudah terdaftar sebelum mengubah role");
  log("   • Setelah role diubah, user bisa login dan akan redirect ke /admin");
  log("   • Gunakan --list untuk melihat semua user dan role mereka");
  log("");
}

// Main execution
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  showHelp();
} else if (args.includes("--list") || args.includes("-l")) {
  listAllUsers();
} else {
  // Tampilkan info awal
  log("🚀 Script Ubah User ke Admin", "blue");
  log("=".repeat(30), "blue");
  changeUserToAdmin();
}
