const axios = require('axios');

// Service URLs - sesuaikan dengan konfigurasi docker-compose
const SERVICES = {
  AUTH_SERVICE: 'http://localhost:3001',
  GENERATE_SOAL_SERVICE: 'http://localhost:3002',
  MANAGE_SOAL_SERVICE: 'http://localhost:3003',
  NOTIFICATION_SERVICE: 'http://localhost:3004',
  WEB_CLIENT: 'http://localhost:3000'
};

// Test credentials - pastikan user admin exists
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = null;

// Helper function untuk login dan mendapatkan token
async function loginAdmin() {
  try {
    console.log('🔐 Mencoba login admin...');
    const response = await axios.post(`${SERVICES.AUTH_SERVICE}/auth/login`, ADMIN_CREDENTIALS);

    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login berhasil, token diperoleh');
      return true;
    } else {
      console.log('❌ Login gagal - token tidak ditemukan dalam response');
      return false;
    }
  } catch (error) {
    console.log('❌ Login gagal:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test service health
async function testServiceHealth(serviceName, url) {
  try {
    console.log(`\n🔍 Testing ${serviceName} di ${url}...`);

    // Test basic connectivity
    const response = await axios.get(`${url}/health`, {
      timeout: 5000,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });

    console.log(`✅ ${serviceName} - Health check berhasil:`, response.data);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ ${serviceName} - Service tidak dapat dijangkau (connection refused)`);
    } else if (error.response?.status === 404) {
      console.log(`⚠️ ${serviceName} - Health endpoint tidak tersedia (404)`);
    } else if (error.response?.status === 401) {
      console.log(`⚠️ ${serviceName} - Unauthorized (mungkin perlu token)`);
    } else {
      console.log(`❌ ${serviceName} - Error:`, error.response?.data || error.message);
    }
    return false;
  }
}

// Test analytics endpoints
async function testAnalyticsEndpoints() {
  if (!authToken) {
    console.log('❌ Tidak dapat menguji analytics - token tidak tersedia');
    return;
  }

  const headers = { Authorization: `Bearer ${authToken}` };

  console.log('\n📊 Testing Analytics Endpoints...');

  // Test Auth Service Analytics
  try {
    console.log('\n🔍 Testing Auth Service Analytics...');
    const authAnalytics = await axios.get(
      `${SERVICES.AUTH_SERVICE}/admin/analytics/users?period=30d`,
      { headers, timeout: 10000 }
    );
    console.log('✅ Auth Analytics berhasil');
    console.log('   - Total users:', authAnalytics.data.overview?.total || 'N/A');
    console.log('   - Active users:', authAnalytics.data.overview?.active || 'N/A');
    console.log('   - New users:', authAnalytics.data.overview?.new || 'N/A');
  } catch (error) {
    console.log('❌ Auth Analytics gagal:', error.response?.data?.error || error.message);
  }

  // Test Manage Soal Analytics
  try {
    console.log('\n🔍 Testing Manage Soal Analytics...');
    const questionAnalytics = await axios.get(
      `${SERVICES.MANAGE_SOAL_SERVICE}/admin/analytics/questions?period=30d`,
      { headers, timeout: 10000 }
    );
    console.log('✅ Question Analytics berhasil');
    console.log('   - Total questions:', questionAnalytics.data.overview?.total || 'N/A');
    console.log('   - Questions in period:', questionAnalytics.data.overview?.inPeriod || 'N/A');
  } catch (error) {
    console.log('❌ Question Analytics gagal:', error.response?.data?.error || error.message);
  }

  // Test Generate Soal Analytics
  try {
    console.log('\n🔍 Testing Generate Soal Analytics...');
    const generationAnalytics = await axios.get(
      `${SERVICES.GENERATE_SOAL_SERVICE}/admin/analytics/generations?period=30d`,
      { headers, timeout: 10000 }
    );
    console.log('✅ Generation Analytics berhasil');
    console.log('   - Total generations:', generationAnalytics.data.overview?.total || 'N/A');
    console.log('   - Success rate:', generationAnalytics.data.overview?.successRate || 'N/A');
  } catch (error) {
    console.log('❌ Generation Analytics gagal:', error.response?.data?.error || error.message);
  }

  // Test Web Client Analytics API
  try {
    console.log('\n🔍 Testing Web Client Analytics API...');
    const webAnalytics = await axios.get(
      `${SERVICES.WEB_CLIENT}/api/admin/analytics?period=30d`,
      {
        headers: {
          'Cookie': `authToken=${authToken}`,
          ...headers
        },
        timeout: 15000
      }
    );
    console.log('✅ Web Client Analytics berhasil');
    console.log('   - Overview users:', JSON.stringify(webAnalytics.data.overview?.users || {}));
    console.log('   - Overview questions:', JSON.stringify(webAnalytics.data.overview?.questions || {}));
    console.log('   - Overview generations:', JSON.stringify(webAnalytics.data.overview?.generations || {}));

    if (webAnalytics.data.warnings) {
      console.log('⚠️ Warnings:', webAnalytics.data.warnings);
    }
  } catch (error) {
    console.log('❌ Web Client Analytics gagal:', error.response?.data?.error || error.message);
    if (error.response?.data?.details) {
      console.log('   Details:', error.response.data.details);
    }
  }
}

// Test direct endpoints
async function testDirectEndpoints() {
  if (!authToken) {
    console.log('❌ Tidak dapat menguji direct endpoints - token tidak tersedia');
    return;
  }

  const headers = { Authorization: `Bearer ${authToken}` };

  console.log('\n🔗 Testing Direct Endpoints...');

  // Test users endpoint
  try {
    const users = await axios.get(`${SERVICES.AUTH_SERVICE}/admin/users?limit=5`, { headers });
    console.log('✅ Users endpoint berhasil, total users:', users.data.pagination?.totalUsers || 'N/A');
  } catch (error) {
    console.log('❌ Users endpoint gagal:', error.response?.data?.error || error.message);
  }

  // Test questions endpoint
  try {
    const questions = await axios.get(`${SERVICES.MANAGE_SOAL_SERVICE}/admin/questions?limit=5`, { headers });
    console.log('✅ Questions endpoint berhasil, total questions:', questions.data.pagination?.total || 'N/A');
  } catch (error) {
    console.log('❌ Questions endpoint gagal:', error.response?.data?.error || error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Memulai testing analytics services...\n');

  // Test 1: Login
  const loginSuccess = await loginAdmin();
  if (!loginSuccess) {
    console.log('\n❌ Testing dihentikan karena login gagal');
    console.log('💡 Pastikan:');
    console.log('   - Auth service berjalan di port 3001');
    console.log('   - User admin sudah dibuat dengan credentials yang benar');
    console.log('   - Database auth service sudah ter-setup');
    return;
  }

  // Test 2: Service Health
  console.log('\n🏥 Testing Service Health...');
  const healthResults = {};
  for (const [name, url] of Object.entries(SERVICES)) {
    healthResults[name] = await testServiceHealth(name, url);
  }

  // Test 3: Analytics Endpoints
  await testAnalyticsEndpoints();

  // Test 4: Direct Endpoints
  await testDirectEndpoints();

  // Summary
  console.log('\n📋 SUMMARY HASIL TEST:');
  console.log('='.repeat(50));

  console.log('\n🏥 Service Health:');
  Object.entries(healthResults).forEach(([service, status]) => {
    console.log(`   ${status ? '✅' : '❌'} ${service}`);
  });

  const servicesUp = Object.values(healthResults).filter(Boolean).length;
  const totalServices = Object.keys(healthResults).length;

  console.log(`\n📊 Services Status: ${servicesUp}/${totalServices} berjalan`);

  if (servicesUp < totalServices) {
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Pastikan semua containers Docker berjalan:');
    console.log('   docker-compose ps');
    console.log('\n2. Check logs jika ada service yang down:');
    console.log('   docker-compose logs [service-name]');
    console.log('\n3. Restart services jika diperlukan:');
    console.log('   docker-compose restart [service-name]');
  }

  console.log('\n✨ Testing selesai!');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testServiceHealth, testAnalyticsEndpoints };
