const axios = require('axios');
const bcrypt = require('bcryptjs');

// Service URLs
const SERVICES = {
  AUTH_SERVICE: 'http://localhost:3001',
  GENERATE_SOAL_SERVICE: 'http://localhost:3002',
  MANAGE_SOAL_SERVICE: 'http://localhost:3003',
  WEB_CLIENT: 'http://localhost:3000'
};

// Admin credentials
const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'admin123',
  name: 'System Administrator'
};

// Sample test data
const SAMPLE_USERS = [
  { email: 'john@example.com', password: 'password123', name: 'John Doe' },
  { email: 'jane@example.com', password: 'password123', name: 'Jane Smith' },
  { email: 'ahmad@example.com', password: 'password123', name: 'Ahmad Santoso' },
  { email: 'siti@example.com', password: 'password123', name: 'Siti Nurhaliza' },
  { email: 'budi@example.com', password: 'password123', name: 'Budi Pratama' }
];

const SAMPLE_QUESTIONS = [
  {
    question: 'Berapa hasil dari 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    explanation: 'Penjumlahan sederhana: 2 + 2 = 4',
    category: 'Matematika',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE'
  },
  {
    question: 'Siapa penemu lampu pijar?',
    options: ['Thomas Edison', 'Nikola Tesla', 'Alexander Bell', 'Albert Einstein'],
    correctAnswer: 'Thomas Edison',
    explanation: 'Thomas Edison dikenal sebagai penemu lampu pijar pada tahun 1879',
    category: 'Sejarah',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE'
  },
  {
    question: 'Apa rumus kimia air?',
    options: ['H2O', 'CO2', 'NaCl', 'O2'],
    correctAnswer: 'H2O',
    explanation: 'Air memiliki rumus kimia H2O (2 atom hidrogen + 1 atom oksigen)',
    category: 'IPA',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE'
  },
  {
    question: 'Jelaskan proses fotosintesis pada tumbuhan!',
    correctAnswer: 'Fotosintesis adalah proses pembuatan makanan pada tumbuhan dengan bantuan sinar matahari',
    explanation: 'Proses ini melibatkan klorofil, CO2, air dan sinar matahari untuk menghasilkan glukosa dan oksigen',
    category: 'IPA',
    difficulty: 'MEDIUM',
    type: 'ESSAY'
  },
  {
    question: 'Berapa hasil dari 15 x 8?',
    options: ['120', '125', '130', '135'],
    correctAnswer: '120',
    explanation: 'Perkalian: 15 x 8 = 120',
    category: 'Matematika',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE'
  }
];

let authToken = null;

// Helper function untuk delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function untuk membuat admin user
async function createAdminUser() {
  try {
    console.log('👤 Membuat admin user...');

    // Coba login dulu untuk check apakah admin sudah ada
    try {
      const loginResponse = await axios.post(`${SERVICES.AUTH_SERVICE}/auth/login`, {
        email: ADMIN_USER.email,
        password: ADMIN_USER.password
      });

      if (loginResponse.data.token) {
        console.log('✅ Admin user sudah ada dan dapat login');
        authToken = loginResponse.data.token;
        return true;
      }
    } catch (error) {
      console.log('ℹ️ Admin user belum ada, akan dibuat...');
    }

    // Coba register admin
    try {
      const registerResponse = await axios.post(`${SERVICES.AUTH_SERVICE}/auth/register`, {
        ...ADMIN_USER,
        role: 'ADMIN'
      });

      console.log('✅ Admin user berhasil didaftarkan');

      // Login untuk mendapatkan token
      const loginResponse = await axios.post(`${SERVICES.AUTH_SERVICE}/auth/login`, {
        email: ADMIN_USER.email,
        password: ADMIN_USER.password
      });

      authToken = loginResponse.data.token;
      console.log('✅ Admin login berhasil');
      return true;
    } catch (error) {
      console.log('❌ Gagal membuat admin user:', error.response?.data?.error || error.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error saat setup admin:', error.message);
    return false;
  }
}

// Function untuk membuat sample users
async function createSampleUsers() {
  if (!authToken) {
    console.log('❌ Token tidak tersedia untuk membuat users');
    return;
  }

  console.log('\n👥 Membuat sample users...');
  const headers = { Authorization: `Bearer ${authToken}` };

  for (const user of SAMPLE_USERS) {
    try {
      await axios.post(`${SERVICES.AUTH_SERVICE}/admin/users`, user, { headers });
      console.log(`✅ User ${user.name} berhasil dibuat`);
      await delay(500); // Delay untuk menghindari rate limiting
    } catch (error) {
      if (error.response?.status === 409 || error.response?.data?.error?.includes('already')) {
        console.log(`ℹ️ User ${user.name} sudah ada`);
      } else {
        console.log(`❌ Gagal membuat user ${user.name}:`, error.response?.data?.error || error.message);
      }
    }
  }
}

// Function untuk membuat sample questions
async function createSampleQuestions() {
  if (!authToken) {
    console.log('❌ Token tidak tersedia untuk membuat questions');
    return;
  }

  console.log('\n📝 Membuat sample questions...');
  const headers = { Authorization: `Bearer ${authToken}` };

  for (const question of SAMPLE_QUESTIONS) {
    try {
      const response = await axios.post(`${SERVICES.MANAGE_SOAL_SERVICE}/questions`, {
        ...question,
        status: 'PUBLISHED'
      }, { headers });

      console.log(`✅ Question "${question.question.substring(0, 30)}..." berhasil dibuat`);
      await delay(500);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️ Question "${question.question.substring(0, 30)}..." sudah ada`);
      } else {
        console.log(`❌ Gagal membuat question:`, error.response?.data?.error || error.message);
      }
    }
  }
}

// Function untuk simulasi generation activity
async function createGenerationActivity() {
  if (!authToken) {
    console.log('❌ Token tidak tersedia untuk membuat generation activity');
    return;
  }

  console.log('\n🔄 Membuat simulasi generation activity...');
  const headers = { Authorization: `Bearer ${authToken}` };

  // Generate beberapa questions melalui AI untuk simulasi
  const generationPrompts = [
    'Buatkan soal matematika tentang aljabar tingkat SMP',
    'Buatkan soal IPA tentang sistem pencernaan',
    'Buatkan soal Bahasa Indonesia tentang teks narasi',
    'Buatkan soal sejarah tentang kemerdekaan Indonesia',
    'Buatkan soal geografi tentang iklim tropis'
  ];

  for (const prompt of generationPrompts) {
    try {
      const response = await axios.post(`${SERVICES.GENERATE_SOAL_SERVICE}/generate`, {
        prompt,
        category: 'Umum',
        difficulty: 'MEDIUM',
        type: 'MULTIPLE_CHOICE'
      }, {
        headers,
        timeout: 30000 // 30 detik timeout untuk AI generation
      });

      console.log(`✅ Generation berhasil untuk prompt: "${prompt.substring(0, 40)}..."`);
      await delay(2000); // Delay lebih lama untuk AI processing
    } catch (error) {
      console.log(`⚠️ Generation gagal untuk prompt: "${prompt.substring(0, 40)}..."`);
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }
  }
}

// Function untuk verify analytics data
async function verifyAnalyticsData() {
  if (!authToken) {
    console.log('❌ Token tidak tersedia untuk verify analytics');
    return;
  }

  console.log('\n📊 Memverifikasi analytics data...');
  const headers = { Authorization: `Bearer ${authToken}` };

  try {
    // Test Web Client Analytics
    const analytics = await axios.get(`${SERVICES.WEB_CLIENT}/api/admin/analytics?period=30d`, {
      headers: {
        'Cookie': `authToken=${authToken}`,
        ...headers
      },
      timeout: 15000
    });

    console.log('✅ Analytics berhasil diambil');
    console.log('📈 Data Overview:');
    console.log(`   - Total Users: ${analytics.data.overview?.users?.total || 0}`);
    console.log(`   - Active Users: ${analytics.data.overview?.users?.active || 0}`);
    console.log(`   - New Users: ${analytics.data.overview?.users?.new || 0}`);
    console.log(`   - Total Questions: ${analytics.data.overview?.questions?.total || 0}`);
    console.log(`   - Questions Today: ${analytics.data.overview?.questions?.today || 0}`);
    console.log(`   - Total Generations: ${analytics.data.overview?.generations?.total || 0}`);
    console.log(`   - Success Rate: ${analytics.data.overview?.generations?.successRate || 0}%`);

    if (analytics.data.warnings) {
      console.log('⚠️ Warnings:', analytics.data.warnings);
    }

    // Test individual service analytics
    console.log('\n🔍 Testing Individual Services:');

    try {
      const authAnalytics = await axios.get(`${SERVICES.AUTH_SERVICE}/admin/analytics/users?period=30d`, { headers });
      console.log('✅ Auth Service Analytics: OK');
    } catch (error) {
      console.log('❌ Auth Service Analytics: Failed');
    }

    try {
      const questionAnalytics = await axios.get(`${SERVICES.MANAGE_SOAL_SERVICE}/admin/analytics/questions?period=30d`, { headers });
      console.log('✅ Question Service Analytics: OK');
    } catch (error) {
      console.log('❌ Question Service Analytics: Failed');
    }

    try {
      const generationAnalytics = await axios.get(`${SERVICES.GENERATE_SOAL_SERVICE}/admin/analytics/generations?period=30d`, { headers });
      console.log('✅ Generation Service Analytics: OK');
    } catch (error) {
      console.log('❌ Generation Service Analytics: Failed');
    }

  } catch (error) {
    console.log('❌ Analytics verification gagal:', error.response?.data?.error || error.message);
  }
}

// Main setup function
async function setupAnalyticsData() {
  console.log('🚀 Memulai setup analytics data...\n');

  // Step 1: Create admin user
  const adminSuccess = await createAdminUser();
  if (!adminSuccess) {
    console.log('\n❌ Setup dihentikan karena gagal membuat admin user');
    return;
  }

  await delay(1000);

  // Step 2: Create sample users
  await createSampleUsers();
  await delay(2000);

  // Step 3: Create sample questions
  await createSampleQuestions();
  await delay(2000);

  // Step 4: Create generation activity (optional, bisa gagal jika AI service belum ready)
  console.log('\n🤖 Mencoba membuat generation activity (opsional)...');
  await createGenerationActivity();
  await delay(2000);

  // Step 5: Verify analytics
  await verifyAnalyticsData();

  console.log('\n✨ Setup analytics data selesai!');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Buka http://localhost:3000/admin untuk akses dashboard');
  console.log('2. Login dengan credentials:');
  console.log(`   Email: ${ADMIN_USER.email}`);
  console.log(`   Password: ${ADMIN_USER.password}`);
  console.log('3. Check analytics data di dashboard');
  console.log('\n💡 Jika ada masalah, jalankan: npm run test:analytics');
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled Rejection:', reason);
});

// Run setup if called directly
if (require.main === module) {
  setupAnalyticsData().catch(error => {
    console.error('💥 Setup error:', error);
    process.exit(1);
  });
}

module.exports = { setupAnalyticsData };
