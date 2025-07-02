# Proyek Mstafix - Platform Manajemen Soal

## Deskripsi

Mstafix adalah sebuah platform berbasis arsitektur microservices yang dirancang untuk manajemen soal. Aplikasi ini memisahkan setiap fungsi utama ke dalam layanan-layanan independen yang berkomunikasi secara sinkron (HTTP) dan asinkron (RabbitMQ), sehingga lebih mudah untuk dikembangkan, di-deploy, dan di-scale.

## Detail Teknologi

| Layanan                   | Teknologi Utama                               |
| ------------------------- | --------------------------------------------- |
| `web-client`              | Next.js, React, TypeScript, Tailwind CSS      |
| `api-gateway`             | Node.js, Express, `http-proxy-middleware`     |
| `auth-service`            | Node.js, Express, TypeScript, PostgreSQL, JWT |
| `manage-soal-service`     | Node.js, Express, TypeScript, PostgreSQL      |
| `generate-soal-service`   | Node.js, Express, TypeScript, Google AI API   |
| `notification-service`    | Node.js, Express, TypeScript, RabbitMQ        |
| **Database**              | PostgreSQL                                    |
| **Message Broker**        | RabbitMQ                                      |
| **Containerization**      | Docker, Docker Compose                        |

## Struktur Folder

Berikut adalah struktur direktori utama dari proyek Mstafix:

```
/
├── api-gateway/              # Layanan API Gateway (Express)
├── auth-service/             # Layanan Otentikasi & Otorisasi
├── generate-soal-service/    # Layanan untuk membuat soal dengan AI
├── load-testing/             # Skrip untuk pengujian beban (k6)
├── manage-soal-service/      # Layanan untuk manajemen data soal
├── notification-service/     # Layanan untuk notifikasi (RabbitMQ)
├── web-client/               # Aplikasi Frontend (Next.js)
├── .env                      # File konfigurasi environment
├── docker-compose.yml        # Konfigurasi Docker Compose
└── mstafix.postman_collection.json # Koleksi Postman untuk pengujian API
```

## Konfigurasi Environment (`.env`)

File `.env` digunakan untuk mengkonfigurasi semua layanan. Berikut adalah beberapa variabel kunci:

- `NEXT_PUBLIC_API_URL`: URL dasar yang digunakan oleh klien Next.js untuk berkomunikasi dengan API Gateway.
- `*_SERVICE_URL`: URL internal untuk komunikasi antar layanan.
- `API_GATEWAY_URL`: URL publik dari API Gateway.
- `NEXT_PUBLIC_ADMIN_SECRET_KEY`: Kunci rahasia untuk operasi khusus admin dari sisi klien.
- `GOOGLE_API_KEY`: Kunci API untuk layanan Google AI yang digunakan oleh `generate-soal-service`.
- `JWT_SECRET`: Kunci rahasia untuk menandatangani dan memverifikasi JSON Web Tokens (JWT).

## Alur Kerja Utama

### 1. Registrasi & Login Pengguna

1.  Pengguna mendaftar atau login melalui `web-client`.
2.  Permintaan dikirim ke `api-gateway`.
3.  `api-gateway` meneruskan permintaan ke `auth-service`.
4.  `auth-service` memvalidasi kredensial, membuat JWT, dan menyimpannya di database.
5.  JWT dikembalikan ke klien untuk digunakan pada permintaan selanjutnya.

### 2. Pembuatan Soal (Generate)

1.  Pengguna yang terotentikasi meminta pembuatan soal dari `web-client`.
2.  Permintaan (dengan JWT) dikirim ke `api-gateway`, lalu ke `generate-soal-service`.
3.  `generate-soal-service` menggunakan `GOOGLE_API_KEY` untuk berinteraksi dengan Google AI dan membuat soal.
4.  Setelah soal dibuat, `generate-soal-service` mengirim pesan ke `manage-soal-service` melalui RabbitMQ untuk menyimpan soal tersebut.
5.  Secara bersamaan, pesan notifikasi dapat dikirim ke `notification-service` untuk memberi tahu pengguna.

## Prasyarat

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Cara Menjalankan Proyek

1.  **Clone Repository**

    ```bash
    git clone https://github.com/fizh/mstafix.git
    cd mstafix
    ```

2.  **Konfigurasi Environment**

    Buat file `.env` di root direktori dan isi dengan konfigurasi yang sesuai (lihat bagian Konfigurasi Environment di atas).

3.  **Jalankan dengan Docker Compose**

    -   **Mode Development**: `docker-compose up -d --build`

4.  **Akses Aplikasi**

    -   **Web Client**: `http://localhost:3000`
    -   **API Gateway**: `http://localhost:4000`

## Pengujian

-   **API Testing**: Impor `mstafix.postman_collection.json` ke Postman.
-   **Load Testing**: Gunakan skrip di direktori `load-testing/` untuk menguji performa dengan skenario pengguna dan admin.
