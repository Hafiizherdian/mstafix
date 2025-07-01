import http from 'k6/http';
import { check, sleep, fail } from 'k6';

// --- Konfigurasi Pengujian ---
export const options = {
  vus: 10, // 10 pengguna virtual
  duration: '20s', // durasi pengujian 30 detik
  // Tambahkan threshold untuk menganggap tes berhasil atau gagal
  thresholds: {
    http_req_failed: ['rate<0.01'], // tingkat kegagalan http harus kurang dari 1%
    http_req_duration: ['p(95)<500'], // 95% permintaan harus selesai di bawah 500ms
  },
};

// --- Setup: Berjalan sekali sebelum tes dimulai ---
export function setup() {
  // URL untuk login
  const loginUrl = 'http://localhost:3000/api/v1/auth/login';

  // Kredensial untuk login (diambil dari Postman collection)
  const loginPayload = JSON.stringify({
    email: 'admin@example.com',
    password: '12345678',
  });

  // Header untuk permintaan login
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Kirim permintaan POST untuk login
  const res = http.post(loginUrl, loginPayload, params);

  // 1. Periksa status respons terlebih dahulu
  if (res.status !== 200) {
    // Hentikan tes jika login tidak berhasil
    fail(`Login request failed with status ${res.status}. Response body: ${res.body}`);
  }

  // 2. Coba parse body JSON
  let jsonBody;
  try {
    jsonBody = res.json();
  } catch (e) {
    fail(`Failed to parse login response as JSON. Body was: ${res.body}`);
  }

  // 3. Periksa struktur JSON yang sudah di-parse
  if (!jsonBody || !jsonBody.accessToken) {
    fail(`Login response JSON is missing 'accessToken'. Body was: ${JSON.stringify(jsonBody)}`);
  }
  
  const accessToken = jsonBody.accessToken;
  
  console.log('Successfully obtained access token.');

  // Kembalikan token agar bisa digunakan di skenario utama
  return { accessToken: accessToken };
}

// --- Skenario Pengujian Utama ---
// 'data' adalah hasil dari function setup()
export default function (data) {
  // Pastikan kita punya access token
  if (!data.accessToken) {
    console.error('Access token not found. Stopping test.');
    return;
  }

  // Siapkan header otentikasi
  const params = {
    headers: {
      'Authorization': `Bearer ${data.accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  // Kirim permintaan GET ke API Gateway untuk mengambil soal
  const res = http.get('http://localhost:3000/api/v1/manage-soal/questions', params);

  // Cek apakah respons memiliki status 200 (OK)
  check(res, {
    'status was 200': (r) => r.status == 200,
  });

  // Beri jeda 1 detik antar permintaan
  sleep(1);
}
