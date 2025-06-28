const fetch = require('node-fetch');

// Konfigurasi
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const ADMIN_SECRET_KEY = process.env.ADMIN_CREATION_KEY || 'rahasia-admin-msta-2024';

// Data admin untuk testing
const adminData = {
  email: 'admin@test.com',
  password: 'admin123456',
  name: 'Admin Test',
  adminSecretKey: ADMIN_SECRET_KEY
};

// Test fungsi untuk membuat admin
async function testCreateAdmin() {
  console.log('🚀 Testing Admin Creation...');
  console.log('URL:', `${AUTH_SERVICE_URL}/api/auth/create-admin`);
  console.log('Data:', { ...adminData, adminSecretKey: '***' });

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/create-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Admin berhasil dibuat!');
      console.log('📋 Detail Admin:');
      console.log(`   ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Name: ${data.user.name}`);
      console.log(`   Role: ${data.user.role}`);
      console.log(`   Created: ${data.user.createdAt}`);
      console.log('🔑 Token tersedia:', !!data.accessToken);

      // Test login admin
      await testAdminLogin(adminData.email, adminData.password);
    } else {
      console.log('❌ Gagal membuat admin:');
      console.log('   Error:', data.error);
      console.log('   Status:', response.status);
    }
  } catch (error) {
    console.log('💥 Error:', error.message);
  }
}

// Test fungsi login admin
async function testAdminLogin(email, password) {
  console.log('\n🔐 Testing Admin Login...');

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Login admin berhasil!');
      console.log('📋 User Info:');
      console.log(`   ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);

      // Verifikasi token
      await testTokenVerification(data.accessToken);
    } else {
      console.log('❌ Login admin gagal:');
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('💥 Login Error:', error.message);
  }
}

// Test verifikasi token
async function testTokenVerification(token) {
  console.log('\n🔍 Testing Token Verification...');

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Token valid!');
      console.log('📋 Verified User:');
      console.log(`   ID: ${data.user.userId}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);
    } else {
      console.log('❌ Token tidak valid:');
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('💥 Token Verification Error:', error.message);
  }
}

// Test registrasi user biasa
async function testRegularUserRegistration() {
  console.log('\n👤 Testing Regular User Registration...');

  const userData = {
    email: 'user@test.com',
    password: 'user123456',
    name: 'User Test'
  };

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ User biasa berhasil dibuat!');
      console.log('📋 Detail User:');
      console.log(`   ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Name: ${data.user.name}`);
      console.log(`   Role: ${data.user.role}`);

      if (data.user.role === 'USER') {
        console.log('✅ Role USER benar!');
      } else {
        console.log('❌ Role salah! Harusnya USER tapi dapat:', data.user.role);
      }
    } else {
      console.log('❌ Gagal membuat user:');
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('💥 Error:', error.message);
  }
}

// Test registrasi admin tanpa secret key
async function testAdminRegistrationWithoutSecret() {
  console.log('\n🔒 Testing Admin Registration Without Secret Key...');

  const adminDataNoSecret = {
    email: 'admin-no-secret@test.com',
    password: 'admin123456',
    name: 'Admin No Secret',
    role: 'ADMIN'
  };

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminDataNoSecret),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('❌ Seharusnya gagal! Admin berhasil dibuat tanpa secret key:');
      console.log(`   Role: ${data.user.role}`);
    } else {
      console.log('✅ Benar! Gagal membuat admin tanpa secret key:');
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('💥 Error:', error.message);
  }
}

// Jalankan semua test
async function runAllTests() {
  console.log('🧪 Starting All Tests...\n');

  // Test 1: Registrasi user biasa
  await testRegularUserRegistration();

  // Test 2: Registrasi admin tanpa secret key
  await testAdminRegistrationWithoutSecret();

  // Test 3: Membuat admin dengan secret key
  await testCreateAdmin();

  console.log('\n🏁 All tests completed!');
}

// Jalankan test
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testCreateAdmin,
  testAdminLogin,
  testTokenVerification,
  testRegularUserRegistration,
  testAdminRegistrationWithoutSecret,
  runAllTests
};
