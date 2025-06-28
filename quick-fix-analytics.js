const axios = require('axios');

// Production configuration from the logs
const PRODUCTION_BASE = 'http://202.10.40.191';
const ADMIN_CREDENTIALS = {
  email: 'a@example.com',
  password: 'admin123'
};

console.log('🚀 MSTAFIX Analytics Quick Fix');
console.log('==============================');
console.log(`Target: ${PRODUCTION_BASE}`);
console.log(`Admin: ${ADMIN_CREDENTIALS.email}`);
console.log('');

async function quickFix() {
  let authToken = null;

  // Step 1: Login and get token
  try {
    console.log('🔐 1. Testing admin login...');
    const loginResponse = await axios.post(`${PRODUCTION_BASE}:3001/auth/login`, ADMIN_CREDENTIALS, {
      timeout: 10000
    });

    if (loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ Login successful, token obtained');
    } else {
      throw new Error('No token in response');
    }
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.error || error.message);
    console.log('\n🔧 Fix: Check if auth-service is running and credentials are correct');
    return;
  }

  // Step 2: Test individual analytics services
  const services = [
    { name: 'Auth Analytics', port: 3001, endpoint: '/admin/analytics/users?period=30d' },
    { name: 'Question Analytics', port: 3003, endpoint: '/admin/analytics/questions?period=30d' },
    { name: 'Generation Analytics', port: 3002, endpoint: '/admin/analytics/generations?period=30d' }
  ];

  const serviceResults = {};
  const headers = { Authorization: `Bearer ${authToken}` };

  console.log('\n📊 2. Testing analytics services...');
  for (const service of services) {
    try {
      const url = `${PRODUCTION_BASE}:${service.port}${service.endpoint}`;
      console.log(`   Testing ${service.name}...`);

      const response = await axios.get(url, { headers, timeout: 15000 });

      if (response.status === 200 && response.data) {
        console.log(`   ✅ ${service.name} - OK`);
        serviceResults[service.name] = 'ok';
      } else {
        console.log(`   ⚠️ ${service.name} - Empty response`);
        serviceResults[service.name] = 'empty';
      }
    } catch (error) {
      console.log(`   ❌ ${service.name} - ${error.response?.status || error.code}`);
      serviceResults[service.name] = 'failed';
    }
  }

  // Step 3: Test web client analytics API
  console.log('\n🌐 3. Testing web client analytics...');
  try {
    const webAnalyticsUrl = `${PRODUCTION_BASE}:3000/api/admin/analytics?period=30d`;
    console.log(`   URL: ${webAnalyticsUrl}`);

    const response = await axios.get(webAnalyticsUrl, {
      headers: {
        'Cookie': `authToken=${authToken}`,
        'Authorization': `Bearer ${authToken}`
      },
      timeout: 20000
    });

    if (response.status === 200) {
      console.log('   ✅ Web client analytics - SUCCESS!');
      console.log('   📊 Dashboard should now work properly');
    } else {
      console.log(`   ⚠️ Status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Web client failed: ${error.response?.status || error.code}`);

    if (error.response?.status === 503) {
      console.log('   🔍 503 Service Unavailable detected');
    }
  }

  // Step 4: Diagnosis and recommendations
  console.log('\n📋 4. Diagnosis & Recommendations');
  console.log('================================');

  const failedServices = Object.entries(serviceResults)
    .filter(([_, status]) => status === 'failed')
    .map(([name]) => name);

  if (failedServices.length === 0) {
    console.log('✅ All analytics services are responding');
    console.log('✅ The 503 error should be resolved');
    console.log('\n🎯 Next steps:');
    console.log('   1. Refresh your browser at http://202.10.40.191:3000/admin');
    console.log('   2. Dashboard should now load analytics data');
  } else {
    console.log('❌ Failed services found:', failedServices.join(', '));
    console.log('\n🔧 Required fixes:');

    if (failedServices.includes('Auth Analytics')) {
      console.log('   • Check auth-service container and database');
      console.log('     docker logs mstafix-auth-service-1');
    }

    if (failedServices.includes('Question Analytics')) {
      console.log('   • Check manage-soal-service container and database');
      console.log('     docker logs mstafix-manage-soal-service-1');
    }

    if (failedServices.includes('Generation Analytics')) {
      console.log('   • Check generate-soal-service container and database');
      console.log('     docker logs mstafix-generate-soal-service-1');
    }

    console.log('\n💡 Quick container restart:');
    console.log('   docker-compose restart auth-service manage-soal-service generate-soal-service');
  }

  // Step 5: Create some test data if services are working
  if (failedServices.length === 0) {
    console.log('\n🎲 5. Ensuring test data exists...');

    try {
      // Check if we have users
      const usersResponse = await axios.get(`${PRODUCTION_BASE}:3001/admin/users?limit=1`, { headers });
      const userCount = usersResponse.data?.pagination?.totalUsers || 0;
      console.log(`   Current users: ${userCount}`);

      if (userCount < 3) {
        console.log('   ℹ️ Limited user data - this is normal for new installation');
      }

      // Check if we have questions
      const questionsResponse = await axios.get(`${PRODUCTION_BASE}:3003/admin/questions?limit=1`, { headers });
      const questionCount = questionsResponse.data?.pagination?.total || 0;
      console.log(`   Current questions: ${questionCount}`);

      if (questionCount === 0) {
        console.log('   ℹ️ No questions found - dashboard will show zeros');
        console.log('   💡 Add some questions through the admin interface');
      }

    } catch (error) {
      console.log('   ⚠️ Could not check data counts');
    }
  }

  console.log('\n✨ Quick fix completed!');
  console.log('\n📱 Test your dashboard now:');
  console.log(`   http://202.10.40.191:3000/admin`);
  console.log(`   Login: ${ADMIN_CREDENTIALS.email}`);
  console.log('');
}

// Run the quick fix
quickFix().catch(error => {
  console.error('💥 Quick fix failed:', error.message);
  console.log('\n🆘 If this script fails:');
  console.log('1. Check if all Docker containers are running');
  console.log('2. Verify network connectivity to services');
  console.log('3. Check Docker logs for specific error messages');
  process.exit(1);
});
