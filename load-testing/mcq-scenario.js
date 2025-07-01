import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend } from 'k6/metrics';

// --- Konfigurasi Pengujian: Membuat 10 Soal MCQ ---
export const options = {
  vus: 1,
  iterations: 1, // Hanya menjalankan satu kali untuk pengukuran yang bersih
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<5000'], // Memberi waktu lebih karena membuat 10 soal
  },
};

const createTrend = new Trend('duration_create_mcq_questions');

// --- Setup: Login sebagai pengguna ---
export function setup() {
  const loginUrl = 'http://localhost:3000/api/v1/auth/login';
  const loginPayload = JSON.stringify({
    email: 'user@example.com',
    password: '12345678',
  });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(loginUrl, loginPayload, params);

  if (res.status !== 200) fail(`Login failed: ${res.status} ${res.body}`);
  const token = res.json('accessToken');
  if (!token) fail(`Token not found in login response: ${res.body}`);
  
  console.log('Login successful for MCQ test.');
  return { accessToken: token };
}

// --- Skenario Pengguna: Membuat 10 Soal MCQ ---
export default function (data) {
  if (!data.accessToken) {
    fail('Access token is missing');
    return;
  }

  const createPayload = JSON.stringify({
    questions: Array.from({ length: 10 }, (_, i) => ({
      question: `(MCQ) Soal tes dari k6 nomor ${i + 1}`,
      options: {
        "A": "Pilihan Benar",
        "B": "Pilihan Salah 1",
        "C": "Pilihan Salah 2",
        "D": "Pilihan Salah 3"
      },
      answer: 'A',
      explanation: `Ini adalah penjelasan untuk soal MCQ ${i + 1}.`,
      category: `k6-test-mcq`,
      difficulty: 'mudah',
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
  
  check(createRes, { '[CREATE MCQ] Status is 201': (r) => r.status === 201 });
  
  if (createRes.status !== 201) {
      console.error(`Create MCQ failed: ${createRes.status} ${createRes.body}`);
  }

  console.log(`Membuat 10 soal MCQ membutuhkan: ${createRes.timings.duration} ms`);
}
