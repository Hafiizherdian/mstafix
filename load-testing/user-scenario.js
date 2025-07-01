import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend } from 'k6/metrics';

// --- Konfigurasi Pengujian Pengguna (CRUD Soal) ---
export const options = {
  vus: 5, // Mengurangi VUs karena skenario lebih kompleks
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.02'], // Sedikit lebih longgar karena ada banyak step
    http_req_duration: ['p(95)<1500'],
  },
};

// Custom trends untuk mengukur performa tiap langkah
const createTrend = new Trend('duration_create_question');
const viewTrend = new Trend('duration_view_question');
const updateTrend = new Trend('duration_update_question');
const deleteTrend = new Trend('duration_delete_question');

// --- Setup: Login sebagai pengguna ---
export function setup() {
  const loginUrl = 'http://localhost:3000/api/v1/auth/login';
  const loginPayload = JSON.stringify({
    email: 'user@example.com', // Pastikan user ini ada
    password: '12345678',
  });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(loginUrl, loginPayload, params);

  if (res.status !== 200) fail(`Login failed: ${res.status} ${res.body}`);
  const token = res.json('accessToken');
  if (!token) fail(`Token not found in login response: ${res.body}`);
  
  console.log('Login successful for CRUD scenario.');

  return { accessToken: token };
}

// --- Skenario Pengguna: Siklus Hidup Soal (CRUD) ---
export default function (data) {
  if (!data.accessToken) {
    fail('Access token is missing');
    return;
  }

  // Buat payload yang benar sesuai dengan ekspektasi service
  const createPayload = JSON.stringify({
    questions: Array.from({ length: 2 }, (_, i) => ({
      question: `Soal tes dari k6 VU ${__VU} nomor ${i + 1}`,
      options: {
        "A": "Jawaban Benar",
        "B": "Jawaban Salah 1",
        "C": "Jawaban Salah 2",
        "D": "Jawaban Salah 3"
      },
      answer: 'A',
      explanation: `Ini adalah penjelasan untuk soal ${i + 1}. Jawaban yang benar adalah A.`,
      category: `k6-test-vu-${__VU}`,
      difficulty: 'mudah',
      type: 'multiple_choice',
      status: 'DRAFT' // Field status yang wajib ada
    }))
  });

  const authParams = {
    headers: {
      'Authorization': `Bearer ${data.accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  // --- 1. CREATE: Membuat 10 soal (Simulasi beban backend dari fitur "Generate Soal") ---
    const createRes = http.post('http://localhost:3000/api/v1/manage-soal/questions', createPayload, authParams);
  createTrend.add(createRes.timings.duration);
  if (!check(createRes, { '[CREATE] Status is 201': (r) => r.status === 201 })) {
    console.error(`Create failed: ${createRes.status} ${createRes.body}`);
    return; // Hentikan iterasi jika gagal
  }
  
  const createdQuestions = createRes.json('questions');
  if (!createdQuestions || createdQuestions.length === 0) {
    fail(`No questions returned after creation: ${createRes.body}`);
    return;
  }
  const questionId = createdQuestions[0].id; // Ambil ID soal pertama untuk langkah selanjutnya
  sleep(1);

  // --- 2. READ: Melihat soal yang baru dibuat ---
  const viewRes = http.get(`http://localhost:3000/api/v1/manage-soal/questions/${questionId}`, authParams);
  viewTrend.add(viewRes.timings.duration);
  check(viewRes, { '[READ] Status is 200': (r) => r.status === 200 });
  sleep(1);

  // --- 3. UPDATE: Mengedit soal tersebut ---
  const updatePayload = JSON.stringify({
    question: `(EDITED) Soal tes yang diperbarui oleh k6`,
    status: 'draft',
  });
  const updateRes = http.put(`http://localhost:3000/api/v1/manage-soal/questions/${questionId}`, updatePayload, authParams);
  updateTrend.add(updateRes.timings.duration);
  check(updateRes, { '[UPDATE] Status is 200': (r) => r.status === 200 });
  sleep(1);

  // --- 4. DELETE: Menghapus soal tersebut ---
  const deleteRes = http.del(`http://localhost:3000/api/v1/manage-soal/questions/${questionId}`, null, authParams);
  deleteTrend.add(deleteRes.timings.duration);
  check(deleteRes, { '[DELETE] Status is 200': (r) => r.status === 200 });
  sleep(1);
}
