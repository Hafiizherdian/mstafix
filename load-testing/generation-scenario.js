import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend } from 'k6/metrics';

// --- Konfigurasi Pengujian: Generasi Soal via Gemini ---
export const options = {
  vus: 15,
  iterations: 15,
  thresholds: {
    http_req_failed: ['rate<0.02'],
    // Waktu threshold dinaikkan karena melibatkan panggilan eksternal ke AI
    http_req_duration: ['p(95)<20000'], // 20 detik
  },
};

const generationTrend = new Trend('duration_gemini_generation');

// Membaca file dokumen untuk dijadikan bahan soal
// Pastikan file ini ada di direktori yang sama dengan skrip
const doc = open('./dummy-document.txt', 'b');

// --- Setup: Login sebagai pengguna ---
export function setup() {
  const loginUrl = 'http://localhost:3000/api/v1/auth/login';
  const loginPayload = JSON.stringify({ email: 'user@example.com', password: '12345678' });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(loginUrl, loginPayload, params);

  if (res.status !== 200) fail(`Login failed: ${res.status} ${res.body}`);
  const token = res.json('accessToken');
  if (!token) fail(`Token not found in login response: ${res.body}`);
  
  console.log('Login successful for Generation test.');
  return { accessToken: token };
}

// --- Skenario Pengguna: Membuat Soal via Gemini ---
export default function (data) {
  if (!data.accessToken) {
    fail('Access token is missing');
    return;
  }

  const payload = {
    file: http.file(doc, 'dummy-document.txt', 'text/plain'),
    questionType: 'MCQ',
    questionCount: '10', // Meminta 10 soal MCQ
    difficulty: 'mudah'
  };

  const authParams = {
    headers: {
      'Authorization': `Bearer ${data.accessToken}`,
      // Content-Type tidak perlu di-set manual, k6 akan membuatnya menjadi multipart/form-data
    },
  };

  // Endpoint ini adalah API route di Next.js yang memanggil Gemini
  // Endpoint ini adalah API route di Next.js yang diekspos melalui API Gateway
  // Menargetkan web-client langsung di port 80 untuk melewati API Gateway
  const genRes = http.post('http://localhost:80/api/generate-soal', payload, authParams);
  generationTrend.add(genRes.timings.duration);
  
  check(genRes, { '[GENERATE] Status is 200': (r) => r.status === 200 });

  if (genRes.status !== 200) {
      console.error(`Generation failed: ${genRes.status} ${genRes.body}`);
  }

  console.log(`Proses generasi soal via Gemini membutuhkan: ${genRes.timings.duration} ms`);
}
