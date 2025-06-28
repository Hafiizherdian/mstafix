const axios = require('axios');

// Configuration for production environment
const PRODUCTION_CONFIG = {
  BASE_URL: 'http://202.10.40.191', // From the logs
  PORTS: {
    WEB_CLIENT: '3000',
    AUTH_SERVICE: '3001',
    GENERATE_SOAL: '3002',
    MANAGE_SOAL: '3003',
    NOTIFICATION: '3004',
    API_GATEWAY: '4000'
  }
};

// Test credentials from logs
const ADMIN_CREDENTIALS = {
  email: 'a@example.com',
  password: 'admin123' // You may need to confirm this
};

let authToken = null;

console.log('🔍 MSTAFIX Production Analytics Debug Tool');
console.log('=========================================');

// Helper function untuk membuat URL service
function getServiceUrl(port) {
  return `${PRODUCTION_CONFIG.BASE_URL}:${port}`;
}

// Login dan dapatkan token
async function loginAdmin() {
  try {
    console.log('\n🔐 Step 1: Login Admin User');
    console.log('----------------------------');

    const authUrl = getServiceUrl(PRODUCTION_CONFIG.PORTS.AUTH_SERVICE);
    console.log(`Auth Service URL: ${authUrl}`);

    const response = await axios.post(`${authUrl}/auth/login`, ADMIN_CREDENTIALS, {
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Resolve only if status < 500
      }
    });

    console.log(`Login Response Status: ${response.status}`);
    console.log(`Login Response:`, response.data);

    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login berhasil, token diperoleh');
      console.log(`Token preview: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Login gagal - tidak ada token dalam response');
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data || error.message);
    console.log(`   Error code: ${error.code}`);
    console.log(`   Error status: ${error.response?.status}`);
    return false;
  }
}

// Test individual service health
async function testServiceHealth() {
  console.log('\n🏥 Step 2: Test Individual Services Health');
  console.log('------------------------------------------');

  const services = [
    { name: 'Auth Service', port: PRODUCTION_CONFIG.PORTS.AUTH_SERVICE },
    { name: 'Generate Soal', port: PRODUCTION_CONFIG.PORTS.GENERATE_SOAL },
    { name: 'Manage Soal', port: PRODUCTION_CONFIG.PORTS.MANAGE_SOAL },
    { name: 'Notification', port: PRODUCTION_CONFIG.PORTS.NOTIFICATION },
    { name: 'API Gateway', port: PRODUCTION_CONFIG.PORTS.API_GATEWAY }
  ];

  const results = {};

  for (const service of services) {
    try {
      const url = getServiceUrl(service.port);
      console.log(`\nTesting ${service.name} at ${url}`);

      // Try health endpoint first
      try {
        const healthResponse = await axios.get(`${url}/health`, {
          timeout: 5000,
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        });
        console.log(`✅ ${service.name} - Health OK (${healthResponse.status})`);
        results[service.name] = 'healthy';
      } catch (healthError) {
        // Try root endpoint if health fails
        try {
          const rootResponse = await axios.get(url, {
            timeout: 5000,
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
          });
          console.log(`⚠️ ${service.name} - Service running but no health endpoint (${rootResponse.status})`);
          results[service.name] = 'partial';
        } catch (rootError) {
          console.log(`❌ ${service.name} - Service unreachable`);
          console.log(`   Error: ${rootError.code || rootError.message}`);
          results[service.name] = 'down';
        }
      }
    } catch (error) {
      console.log(`❌ ${service.name} - Connection failed`);
      console.log(`   Error: ${error.code || error.message}`);
      results[service.name] = 'down';
    }
  }

  return results;
}

// Test analytics endpoints specifically
async function testAnalyticsEndpoints() {
  if (!authToken) {
    console.log('❌ Cannot test analytics - no auth token');
    return;
  }

  console.log('\n📊 Step 3: Test Analytics Endpoints');
  console.log('-----------------------------------');

  const headers = {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // Test individual service analytics
  const analyticsTests = [
    {
      name: 'Auth Analytics',
      url: `${getServiceUrl(PRODUCTION_CONFIG.PORTS.AUTH_SERVICE)}/admin/analytics/users?period=30d`
    },
    {
      name: 'Question Analytics',
      url: `${getServiceUrl(PRODUCTION_CONFIG.PORTS.MANAGE_SOAL)}/admin/analytics/questions?period=30d`
    },
    {
      name: 'Generation Analytics',
      url: `${getServiceUrl(PRODUCTION_CONFIG.PORTS.GENERATE_SOAL)}/admin/analytics/generations?period=30d`
    }
  ];

  const analyticsResults = {};

  for (const test of analyticsTests) {
    try {
      console.log(`\nTesting ${test.name}...`);
      console.log(`URL: ${test.url}`);

      const response = await axios.get(test.url, {
        headers,
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      console.log(`Status: ${response.status}`);

      if (response.status === 200) {
        const data = response.data;
        console.log('✅ Success');
        console.log(`   Data keys: ${Object.keys(data).join(', ')}`);

        if (data.overview) {
          console.log(`   Overview: ${JSON.stringify(data.overview)}`);
        }

        analyticsResults[test.name] = 'success';
      } else {
        console.log(`⚠️ Non-200 status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data)}`);
        analyticsResults[test.name] = 'partial';
      }
    } catch (error) {
      console.log(`❌ ${test.name} failed`);
      console.log(`   Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      analyticsResults[test.name] = 'failed';
    }
  }

  return analyticsResults;
}

// Test the main web client analytics API
async function testWebClientAnalytics() {
  if (!authToken) {
    console.log('❌ Cannot test web client analytics - no auth token');
    return;
  }

  console.log('\n🌐 Step 4: Test Web Client Analytics API');
  console.log('----------------------------------------');

  try {
    const webClientUrl = getServiceUrl(PRODUCTION_CONFIG.PORTS.WEB_CLIENT);
    const analyticsUrl = `${webClientUrl}/api/admin/analytics?period=30d`;

    console.log(`Testing: ${analyticsUrl}`);

    // Try with different auth methods
    const authMethods = [
      {
        name: 'Cookie Auth',
        headers: {
          'Cookie': `authToken=${authToken}`,
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Bearer Token',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Both Auth Methods',
        headers: {
          'Cookie': `authToken=${authToken}`,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    ];

    for (const method of authMethods) {
      try {
        console.log(`\nTrying ${method.name}...`);

        const response = await axios.get(analyticsUrl, {
          headers: method.headers,
          timeout: 20000,
          validateStatus: function (status) {
            return status < 600;
          }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.status === 200) {
          console.log('✅ Web Client Analytics SUCCESS!');
          const data = response.data;

          console.log('\n📊 Analytics Data Summary:');
          console.log('-------------------------');

          if (data.overview) {
            console.log(`Users: ${JSON.stringify(data.overview.users)}`);
            console.log(`Questions: ${JSON.stringify(data.overview.questions)}`);
            console.log(`Generations: ${JSON.stringify(data.overview.generations)}`);
          }

          if (data.warnings) {
            console.log(`⚠️ Warnings: ${data.warnings.join(', ')}`);
          }

          if (data.errors) {
            console.log(`❌ Errors: ${data.errors.join(', ')}`);
          }

          return 'success';
        } else if (response.status === 503) {
          console.log('⚠️ Service Unavailable (503)');
          console.log(`   Response: ${JSON.stringify(response.data)}`);
        } else {
          console.log(`⚠️ Status ${response.status}`);
          console.log(`   Response: ${JSON.stringify(response.data)}`);
        }

      } catch (error) {
        console.log(`❌ ${method.name} failed: ${error.response?.status || error.code} - ${error.message}`);
      }
    }

  } catch (error) {
    console.log('❌ Web client analytics test failed:', error.message);
  }

  return 'failed';
}

// Check database connections
async function checkDatabaseConnections() {
  console.log('\n🗄️ Step 5: Check Database Status (Indirect)');
  console.log('---------------------------------------------');

  if (!authToken) {
    console.log('❌ Cannot check databases - no auth token');
    return;
  }

  const headers = { Authorization: `Bearer ${authToken}` };

  // Test simple endpoints that require database
  const dbTests = [
    {
      name: 'Users Count',
      url: `${getServiceUrl(PRODUCTION_CONFIG.PORTS.AUTH_SERVICE)}/admin/users?limit=1`
    },
    {
      name: 'Questions Count',
      url: `${getServiceUrl(PRODUCTION_CONFIG.PORTS.MANAGE_SOAL)}/admin/questions?limit=1`
    }
  ];

  for (const test of dbTests) {
    try {
      console.log(`\nTesting ${test.name}...`);
      const response = await axios.get(test.url, {
        headers,
        timeout: 10000,
        validateStatus: status => status < 500
      });

      if (response.status === 200) {
        console.log(`✅ ${test.name} - Database OK`);
        if (response.data.pagination) {
          console.log(`   Total records: ${response.data.pagination.totalUsers || response.data.pagination.total || 'unknown'}`);
        }
      } else {
        console.log(`⚠️ ${test.name} - Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Database connection issue`);
      console.log(`   Error: ${error.response?.status || error.code}`);
    }
  }
}

// Main debugging function
async function runProductionDebug() {
  console.log(`\n🚀 Starting Production Debug for ${PRODUCTION_CONFIG.BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('=' .repeat(60));

  // Step 1: Login
  const loginSuccess = await loginAdmin();
  if (!loginSuccess) {
    console.log('\n💥 CRITICAL: Cannot proceed without authentication');
    console.log('\n🔧 Possible fixes:');
    console.log('1. Check if auth-service is running on port 3001');
    console.log('2. Verify admin credentials are correct');
    console.log('3. Check database connection for auth-service');
    return;
  }

  // Step 2: Service Health
  const serviceHealth = await testServiceHealth();

  // Step 3: Analytics Endpoints
  const analyticsResults = await testAnalyticsEndpoints();

  // Step 4: Web Client Analytics
  const webClientResult = await testWebClientAnalytics();

  // Step 5: Database Check
  await checkDatabaseConnections();

  // Summary Report
  console.log('\n📋 PRODUCTION DEBUG SUMMARY');
  console.log('============================');

  console.log('\n🏥 Service Health:');
  Object.entries(serviceHealth).forEach(([service, status]) => {
    const icon = status === 'healthy' ? '✅' : status === 'partial' ? '⚠️' : '❌';
    console.log(`   ${icon} ${service}: ${status}`);
  });

  console.log('\n📊 Analytics Services:');
  Object.entries(analyticsResults).forEach(([service, status]) => {
    const icon = status === 'success' ? '✅' : status === 'partial' ? '⚠️' : '❌';
    console.log(`   ${icon} ${service}: ${status}`);
  });

  console.log(`\n🌐 Web Client Analytics: ${webClientResult === 'success' ? '✅' : '❌'} ${webClientResult}`);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('-------------------');

  const downServices = Object.entries(serviceHealth).filter(([_, status]) => status === 'down');
  const failedAnalytics = Object.entries(analyticsResults).filter(([_, status]) => status === 'failed');

  if (downServices.length > 0) {
    console.log('🔧 Services that need attention:');
    downServices.forEach(([service]) => {
      console.log(`   - Restart ${service} container`);
    });
  }

  if (failedAnalytics.length > 0) {
    console.log('🔧 Analytics endpoints that need fixing:');
    failedAnalytics.forEach(([service]) => {
      console.log(`   - Check ${service} database connection`);
    });
  }

  if (webClientResult !== 'success') {
    console.log('🔧 Web Client Issues:');
    console.log('   - Check if all microservices are responding');
    console.log('   - Verify service URL configuration');
    console.log('   - Check Next.js server logs');
  }

  console.log('\n✨ Production debug completed!');
  console.log('\nNext steps:');
  console.log('1. Fix any failed services shown above');
  console.log('2. Test dashboard again at http://202.10.40.191:3000/admin');
  console.log('3. Check browser console for any remaining errors');
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.log('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  runProductionDebug().catch(error => {
    console.error('💥 Debug script error:', error.message);
    process.exit(1);
  });
}

module.exports = { runProductionDebug };
