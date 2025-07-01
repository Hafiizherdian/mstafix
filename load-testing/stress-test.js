import http from 'k6/http';
import { check, fail } from 'k6';
import { Trend } from 'k6/metrics';

// --- Konfigurasi Stress Test ---
export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Naikkan beban ke 50 pengguna selama 30 detik
    { duration: '1m', target: 50 },  // Tahan beban di 50 pengguna selama 1 menit
    { duration: '10s', target: 0 },  // Turunkan beban kembali ke 0
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // Toleransi kegagalan sedikit lebih tinggi (5%)
    http_req_duration: ['p(95)<2000'], // Waktu respons di bawah 2 detik untuk 95% permintaan
  },
};

const createTrend = new Trend('duration_stress_create_mcq');

// --- Setup: Login sekali saja ---
export function setup() {
  const loginUrl = 'http://localhost:3000/api/v1/auth/login';
  const loginPayload = JSON.stringify({ email: 'user@example.com', password: '12345678' });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(loginUrl, loginPayload, params);

  if (res.status !== 200) fail(`Login failed: ${res.status} ${res.body}`);
  const token = res.json('accessToken');
  if (!token) fail(`Token not found in login response: ${res.body}`);
  
  console.log('Login successful for Stress Test.');
  return { accessToken: token };
}

// --- Skenario Stress Test: Membuat Soal MCQ secara terus-menerus ---
export default function (data) {
  if (!data.accessToken) {
    fail('Access token is missing');
    return;
  }

  const createPayload = JSON.stringify({
    questions: Array.from({ length: 10 }, (_, i) => ({
      question: `(Stress Test) Soal dari VU ${__VU} iterasi ${__ITER}`,
      options: { "A": "A", "B": "B", "C": "C", "D": "D" },
      answer: 'A',
      explanation: 'Penjelasan stress test',
      category: `k6-stress-test`,
      difficulty: 'sulit',
      type: 'multiple_choice',
      status: 'DRAFT'
    }))
  });

  const authParams = {
    headers: {
      'Authorization': `Bearer ${data.accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  const createRes = http.post('http://localhost:3000/api/v1/manage-soal/questions', createPayload, authParams);
  createTrend.add(createRes.timings.duration);
  
  check(createRes, { '[STRESS TEST] Status is 201': (r) => r.status === 201 });
}
