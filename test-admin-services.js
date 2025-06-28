#!/usr/bin/env node

/**
 * Test Admin Services - Script untuk debugging koneksi microservices
 * Digunakan untuk memverifikasi bahwa semua service dapat diakses dengan benar
 */

const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

// Konfigurasi services
const SERVICES = {
  AUTH_SERVICE: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  GENERATE_SOAL_SERVICE: process.env.GENERATE_SOAL_SERVICE_URL || 'http://localhost:3002',
  MANAGE_SOAL_SERVICE: process.env.MANAGE_SOAL_SERVICE_URL || 'http://localhost:3003',
  NOTIFICATION_SERVICE: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
  API_GATEWAY: process.env.API_GATEWAY_URL || 'http://localhost:3000'
};

// JWT Secret untuk testing
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate admin token untuk testing
function generateAdminToken() {
  return jwt.sign(
    {
      id: 'test-admin-id',
      email: 'admin@test.com',
      role: 'ADMIN',
      name: 'Test Admin'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Test individual service health
async function testServiceHealth(serviceName, url) {
  console.log(`\n🔍 Testing ${serviceName}...`);
  console.log(`URL: ${url}`);

  try {
    const startTime = Date.now();
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${serviceName} is UP (${responseTime}ms)`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, data);
      return true;
    } else {
      console.log(`❌ ${serviceName} returned status ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${serviceName} is DOWN`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test admin endpoints
async function testAdminEndpoints() {
  console.log('\n🔐 Testing Admin Endpoints with JWT Token...');

  const token = generateAdminToken();
  console.log(`Generated token: ${token.substring(0, 50)}...`);

  const endpoints = [
    {
      name: 'Auth Service - Users',
      url: `${SERVICES.AUTH_SERVICE}/admin/users?page=1&limit=5`,
      service: 'AUTH_SERVICE'
    },
    {
      name: 'Auth Service - Analytics',
      url: `${SERVICES.AUTH_SERVICE}/admin/analytics/users?period=30d`,
      service: 'AUTH_SERVICE'
    },
    {
      name: 'Manage Soal - Questions',
      url: `${SERVICES.MANAGE_SOAL_SERVICE}/admin/questions?page=1&limit=5`,
      service: 'MANAGE_SOAL_SERVICE'
    },
    {
      name: 'Manage Soal - Analytics',
      url: `${SERVICES.MANAGE_SOAL_SERVICE}/admin/analytics/questions?period=30d`,
      service: 'MANAGE_SOAL_SERVICE'
    },
    {
      name: 'Generate Soal - Analytics',
      url: `${SERVICES.GENERATE_SOAL_SERVICE}/admin/analytics/generations?period=30d`,
      service: 'GENERATE_SOAL_SERVICE'
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🎯 Testing ${endpoint.name}...`);
    console.log(`URL: ${endpoint.url}`);

    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name} - SUCCESS`);
        console.log(`   Status: ${response.status}`);

        // Show sample data structure
        if (data.users) {
          console.log(`   Users found: ${data.users.length}`);
        } else if (data.questions) {
          console.log(`   Questions found: ${data.questions.length}`);
        } else if (data.data) {
          console.log(`   Data records: ${Array.isArray(data.data) ? data.data.length : 'object'}`);
        } else {
          console.log(`   Response keys:`, Object.keys(data));
        }

        if (data.pagination) {
          console.log(`   Pagination: Page ${data.pagination.currentPage}/${data.pagination.totalPages}`);
        }
      } else {
        console.log(`❌ ${endpoint.name} - FAILED`);
        console.log(`   Status: ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} - ERROR`);
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Test database connections through services
async function testDatabaseConnections() {
  console.log('\n💾 Testing Database Connections...');

  const token = generateAdminToken();

  const dbTests = [
    {
      name: 'Auth DB via Users Count',
      url: `${SERVICES.AUTH_SERVICE}/admin/stats/users`,
      service: 'AUTH_SERVICE'
    },
    {
      name: 'Manage Soal DB via Questions Count',
      url: `${SERVICES.MANAGE_SOAL_SERVICE}/admin/stats/questions`,
      service: 'MANAGE_SOAL_SERVICE'
    }
  ];

  for (const test of dbTests) {
    console.log(`\n📊 Testing ${test.name}...`);

    try {
      const response = await fetch(test.url, {
        method: 'GET',
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name} - Database Connected`);
        console.log(`   Data:`, data);
      } else {
        console.log(`❌ ${test.name} - Database Issue`);
        console.log(`   Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Database Error`);
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Test web client API routes
async function testWebClientAPIs() {
  console.log('\n🌐 Testing Web Client API Routes...');

  const WEB_CLIENT_URL = process.env.WEB_CLIENT_URL || 'http://localhost:3005';

  // Create a test JWT cookie
  const token = generateAdminToken();

  const webAPIs = [
    {
      name: 'Analytics API',
      url: `${WEB_CLIENT_URL}/api/admin/analytics?period=30d`
    },
    {
      name: 'Users API',
      url: `${WEB_CLIENT_URL}/api/admin/users?page=1&limit=5`
    },
    {
      name: 'Questions API',
      url: `${WEB_CLIENT_URL}/api/admin/questions?page=1&limit=5`
    },
    {
      name: 'Notifications API',
      url: `${WEB_CLIENT_URL}/api/admin/notifications?page=1&limit=5`
    }
  ];

  for (const api of webAPIs) {
    console.log(`\n🔧 Testing ${api.name}...`);

    try {
      const response = await fetch(api.url, {
        method: 'GET',
        timeout: 15000,
        headers: {
          'Cookie': `authToken=${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${api.name} - SUCCESS`);
        console.log(`   Keys:`, Object.keys(data));
      } else {
        console.log(`❌ ${api.name} - FAILED`);
        console.log(`   Status: ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error:`, errorText.substring(0, 200));
      }
    } catch (error) {
      console.log(`❌ ${api.name} - ERROR`);
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Main test function
async function runTests() {
  console.log('🚀 MSTAFIX Admin Services Test');
  console.log('=====================================');
  console.log('Testing microservices connectivity and admin endpoints');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  console.log('\n📋 Service Configuration:');
  Object.entries(SERVICES).forEach(([key, url]) => {
    console.log(`   ${key}: ${url}`);
  });

  // Test 1: Service Health Checks
  console.log('\n\n1️⃣ HEALTH CHECKS');
  console.log('==================');
  const healthResults = [];
  for (const [serviceName, url] of Object.entries(SERVICES)) {
    const isHealthy = await testServiceHealth(serviceName, url);
    healthResults.push({ service: serviceName, healthy: isHealthy });
  }

  // Test 2: Admin Endpoints
  console.log('\n\n2️⃣ ADMIN ENDPOINTS');
  console.log('===================');
  await testAdminEndpoints();

  // Test 3: Database Connections
  console.log('\n\n3️⃣ DATABASE CONNECTIONS');
  console.log('========================');
  await testDatabaseConnections();

  // Test 4: Web Client APIs
  console.log('\n\n4️⃣ WEB CLIENT APIs');
  console.log('===================');
  await testWebClientAPIs();

  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('================');

  console.log('\nService Health Status:');
  healthResults.forEach(result => {
    const status = result.healthy ? '✅ UP' : '❌ DOWN';
    console.log(`   ${result.service}: ${status}`);
  });

  const healthyServices = healthResults.filter(r => r.healthy).length;
  const totalServices = healthResults.length;

  console.log(`\nOverall Health: ${healthyServices}/${totalServices} services are running`);

  if (healthyServices === totalServices) {
    console.log('🎉 All services are healthy! Dashboard should work properly.');
  } else {
    console.log('⚠️  Some services are down. Check the logs above for details.');
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure all microservices are started');
    console.log('2. Check service URLs in environment variables');
    console.log('3. Verify database connections');
    console.log('4. Check network connectivity between services');
  }

  console.log('\n🔍 For detailed debugging, check individual service logs');
  console.log('📝 Save this output for troubleshooting reference');
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  runTests().then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testServiceHealth,
  testAdminEndpoints,
  generateAdminToken
};
