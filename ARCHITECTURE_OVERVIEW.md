<!--
  Dokumentasi ini mengikuti standar Fizh Coding Standards.
  Semua komentar dan penjelasan menggunakan bahasa Indonesia.
  Jangan terlalu fokus pada detail implementasi, karena proyek masih dalam tahap pengembangan.
-->

# Ringkasan Arsitektur Proyek MSTA

## 1. Stack Teknologi
- **Backend Service**: Node.js (Express), Prisma ORM, PostgreSQL, RabbitMQ, Docker Compose
- **Frontend**: Next.js (React), TypeScript, TailwindCSS, React Hot Toast, dsb
- **DevOps/Deployment**: Docker Compose, environment variables, healthcheck

## 2. Service Utama & Fungsinya
| Service                | Port   | Fungsi Utama                                      |
|------------------------|--------|---------------------------------------------------|
| api-gateway            | 3000   | Routing API ke service lain                       |
| auth-service           | 3001   | Otentikasi user/admin, JWT, role, dsb             |
| generate-soal-service  | 3002   | Generate soal otomatis (AI/algoritma)             |
| manage-soal-service    | 3003   | CRUD soal, analitik, manajemen soal               |
| notification-service   | 3004   | Notifikasi, konsumsi message queue (RabbitMQ)     |
| web-client             | 3000   | Frontend (Next.js, admin dashboard, dsb)          |
| rabbitmq (container)   | 5672   | Message broker                                    |
| postgres (container)   | 5432+  | Database utama (auth, generate_soal, manage_soal) |

## 3. Diagram Arsitektur (Teks)

```
[web-client]
     |
     v
[api-gateway] <--------------------------
  |      |        |         |            |
  v      v        v         v            |
[auth][generate][manage][notification]   |
  |      |        |         |            |
  |      |        |         |            |
 [postgresql]   [rabbitmq]<--------------

Keterangan:
- web-client: Frontend Next.js, mengonsumsi API dari api-gateway
- api-gateway: Pintu masuk API, melakukan routing ke service lain
- auth-service: Otentikasi user/admin, menggunakan JWT
- generate-soal-service: Menghasilkan soal secara otomatis menggunakan AI/algoritma
- manage-soal-service: CRUD & analitik soal
- notification-service: Mengirim notifikasi (melalui RabbitMQ)
- postgresql: Database untuk masing-masing service
- rabbitmq: Message broker untuk notifikasi
```

## 4. Pola Arsitektur
- Microservices sederhana
- API Gateway
- Message Queue (RabbitMQ)
- Database terpisah per service (PostgreSQL)
- Frontend-backend terpisah
- Semua service jalan di container Docker

## 5. Catatan Tambahan
- Semua konfigurasi environment (URL, secret, dsb) diatur via env & docker-compose
- Monitoring service tersedia di dashboard admin
- Semua stack dan arsitektur sudah cukup untuk tugas akhir, mudah dipahami dan dikembangkan

---

*File ini dihasilkan secara otomatis untuk membantu pemahaman arsitektur proyek. Jika membutuhkan diagram visual (gambar), dapat dibuat menggunakan tools seperti draw.io atau mermaid.*
