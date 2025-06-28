# Cara Membuat Admin di Sistem MSTA

## Ringkasan Perbaikan

Masalah yang telah diperbaiki:
- ✅ Registrasi biasa sekarang hanya membuat user dengan role `USER`
- ✅ Registrasi admin memerlukan secret key khusus
- ✅ Endpoint khusus untuk membuat admin dengan validasi keamanan
- ✅ Type safety dengan Prisma Role enum

## Metode 1: Melalui Web Interface (Direkomendasikan)

### Langkah-langkah:

1. **Akses halaman setup admin**
   ```
   http://localhost:3000/setup-admin
   ```

2. **Isi form dengan informasi berikut:**
   - **Nama**: Nama lengkap admin
   - **Email**: Email admin yang valid
   - **Password**: Password minimal 8 karakter
   - **Kunci Rahasia**: `rahasia-admin-msta-2024` (default)

3. **Klik "Buat Akun Admin"**

4. **Sistem akan:**
   - Memvalidasi kunci rahasia
   - Membuat user dengan role ADMIN
   - Set authentication cookies
   - Redirect ke dashboard admin

## Metode 2: Melalui API Direct

### Endpoint: `POST /api/auth/create-admin`

```bash
curl -X POST http://localhost:3001/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123456",
    "name": "Admin Name",
    "adminSecretKey": "rahasia-admin-msta-2024"
  }'
```

### Response Success:
```json
{
  "message": "Admin berhasil dibuat",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin Name",
    "role": "ADMIN",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

## Metode 3: Update Role User Existing

Jika sudah ada user yang ingin dijadikan admin:

### Endpoint: `POST /api/admin/update-role`

```bash
curl -X POST http://localhost:3001/api/admin/update-role \
  -H "Content-Type: application/json" \
  -H "Admin-Secret-Key: rahasia-admin-msta-2024" \
  -d '{
    "userId": "user-uuid",
    "role": "ADMIN"
  }'
```

## Konfigurasi Secret Key

### Environment Variables:

```bash
# Di file .env atau environment
ADMIN_CREATION_KEY=your-secret-key-here
```

### Default Secret Key:
```
rahasia-admin-msta-2024
```

**⚠️ PENTING:** Ganti secret key default di production!

## Testing

### Jalankan Test Script:

```bash
# Di root folder mstafix
node test-admin-creation.js
```

Test script akan melakukan:
- ✅ Test registrasi user biasa (role USER)
- ✅ Test registrasi admin tanpa secret key (should fail)
- ✅ Test registrasi admin dengan secret key (should succeed)
- ✅ Test login admin
- ✅ Test verifikasi token admin

### Expected Output:
```
🧪 Starting All Tests...

👤 Testing Regular User Registration...
✅ User biasa berhasil dibuat!
✅ Role USER benar!

🔒 Testing Admin Registration Without Secret Key...
✅ Benar! Gagal membuat admin tanpa secret key

🚀 Testing Admin Creation...
✅ Admin berhasil dibuat!
📋 Detail Admin:
   Role: ADMIN

🔐 Testing Admin Login...
✅ Login admin berhasil!

🔍 Testing Token Verification...
✅ Token valid!
   Role: ADMIN

🏁 All tests completed!
```

## Verifikasi Admin

### 1. Login ke Admin Dashboard:
```
http://localhost:3000/admin
```

### 2. Cek melalui Database:
```sql
SELECT id, email, name, role, created_at 
FROM "User" 
WHERE role = 'ADMIN';
```

### 3. Cek melalui API:
```bash
# Login dulu untuk dapat token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123456"
  }'

# Verify token
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### Error: "Kunci rahasia admin tidak valid"
- Pastikan menggunakan secret key yang benar
- Cek environment variable `ADMIN_CREATION_KEY`

### Error: "Email sudah terdaftar"
- Email sudah digunakan oleh user lain
- Gunakan email yang berbeda atau update role user existing

### Error: "Failed to create user"
- Cek koneksi database
- Pastikan auth-service berjalan
- Cek logs service untuk detail error

### Error: Token tidak valid di admin dashboard
- Pastikan cookies tereset dengan benar
- Clear browser cookies/localStorage
- Login ulang

## Keamanan

### Best Practices:
1. **Ganti Secret Key Default**
   ```bash
   ADMIN_CREATION_KEY=super-secure-random-key-123
   ```

2. **Restrict Access**
   - Hanya admin yang bisa membuat admin baru
   - Endpoint `/setup-admin` hanya untuk setup initial

3. **Monitor Admin Creation**
   - Log semua pembuatan admin
   - Audit trail untuk security

4. **Use Strong Passwords**
   - Minimal 12 karakter
   - Kombinasi huruf, angka, symbol

## FAQ

### Q: Apakah bisa membuat multiple admin?
A: Ya, setiap admin bisa membuat admin baru melalui dashboard admin.

### Q: Bagaimana menghapus admin?
A: Melalui admin dashboard atau API `DELETE /api/admin/users/{userId}`.

### Q: Apakah registrasi biasa masih membuat admin?
A: Tidak! Setelah perbaikan, registrasi biasa hanya membuat role USER.

### Q: Bagaimana reset password admin?
A: Melalui admin dashboard atau direct database update.

## Kontak

Jika ada masalah dengan admin creation, periksa:
1. Logs auth-service
2. Database connection
3. Environment variables
4. API response details

---

**Catatan:** Dokumentasi ini dibuat setelah perbaikan bug registrasi admin. Semua endpoint telah ditest dan berfungsi dengan baik.