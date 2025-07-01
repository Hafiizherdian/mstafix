import http from 'k6/http';
import { check, sleep, fail } from 'k6';

// --- Konfigurasi Pengujian Admin ---
export const options = {
  vus: 5, // Lebih sedikit VUs untuk skenario admin
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'], // Mungkin butuh waktu lebih lama
  },
};

// --- Setup: Login sebagai admin ---
export function setup() {
  const loginUrl = 'http://localhost:3000/api/v1/auth/login';
  const loginPayload = JSON.stringify({
    email: 'admin@example.com',
    password: '12345678',
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(loginUrl, loginPayload, params);

  if (res.status !== 200) {
    fail(`Admin login failed with status ${res.status}. Response body: ${res.body}`);
  }

  let jsonBody;
  try {
    jsonBody = res.json();
  } catch (e) {
    fail(`Failed to parse admin login response. Body was: ${res.body}`);
  }

  if (!jsonBody || !jsonBody.accessToken) {
    fail(`Admin login response is missing 'accessToken'. Body was: ${JSON.stringify(jsonBody)}`);
  }
  
  const accessToken = jsonBody.accessToken;
  console.log('Successfully obtained access token for ADMIN scenario.');
  return { accessToken: accessToken };
}

// --- Skenario Admin: Mengambil dan Memperbarui Soal ---
export default function (data) {
  if (!data.accessToken) {
    console.error('Access token not found. Stopping test.');
    return;
  }

  const authParams = {
    headers: {
      'Authorization': `Bearer ${data.accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  // 1. Admin mengambil daftar soal untuk mendapatkan ID
  const getRes = http.get('http://localhost:3000/api/v1/manage-soal/questions', authParams);

  if (!check(getRes, { '[Admin Scenario] Fetched questions': (r) => r.status === 200 })) {
    return; // Hentikan iterasi jika gagal mengambil soal
  }

  let questionId;
  try {
    const questions = getRes.json();
    if (questions && questions.length > 0) {
      questionId = questions[0].id; // Ambil ID soal pertama
    } else {
      console.log('No questions found to update.');
      return;
    }
  } catch (e) {
    fail(`Failed to parse questions response: ${e}. Body: ${getRes.body}`);
    return;
  }

  // 2. Admin memperbarui status soal pertama yang ditemukan
  if (questionId) {
    const statusPayload = JSON.stringify({ status: 'published' });
    const updateRes = http.patch(`http://localhost:3000/api/v1/manage-soal/questions/${questionId}/status`, statusPayload, authParams);

    check(updateRes, {
      '[Admin Scenario] Updated question status': (r) => r.status === 200,
    });
  }

  sleep(1);
}
