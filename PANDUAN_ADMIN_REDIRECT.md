# Panduan Admin Redirect - MSTA Platform

## 📋 Overview

Sistem login MSTA telah dikonfigurasi untuk otomatis mengarahkan pengguna ke halaman yang sesuai berdasarkan role mereka:

- **Admin (ADMIN)**: Diarahkan ke `/admin` (Dashboard Admin)
- **User biasa (USER)**: Diarahkan ke `/generate-soal` (Halaman Generate Soal)

## 🚀 Cara Setup Admin

### 1. Setup Admin Menggunakan Script Otomatis

```bash
# Jalankan script setup admin
node setup-admin-user.js

# Atau lihat daftar admin yang ada
node setup-admin-user.js --list

# Untuk bantuan
node setup-admin-user.js --help
```

**Langkah-langkah:**
1. Edit file `setup-admin-user.js`
2. Ubah data admin di bagian `adminData`:
   ```javascript
   const adminData = {
     email: 'admin@msta.com',        // Ganti dengan email admin
     password: 'admin123',           // Ganti dengan password kuat
     name: 'Administrator MSTA'      // Ganti dengan nama admin
   };
   ```
3. Jalankan script: `node setup-admin-user.js`

### 2. Setup Admin Manual via Database

```bash
# Gunakan script manual yang sudah ada
node update-admin-role.js
```

**Langkah-langkah:**
1. Edit file `update-admin-role.js`
2. Ubah email di variable `userEmail`
3. Pastikan user dengan email tersebut sudah terdaftar
4. Jalankan script

### 3. Setup Admin via Web Interface

1. Akses `/setup-admin` di browser
2. Isi form setup admin
3. Submit form
4. Login dengan kredensial admin yang baru dibuat

## 🔐 Cara Login Sebagai Admin

1. **Akses halaman login**: Buka `/login` di browser
2. **Masukkan kredensial admin**:
   - Email: email admin yang sudah di-setup
   - Password: password admin yang sudah di-setup
3. **Klik tombol Login**
4. **Sistem akan otomatis redirect** ke dashboard admin (`/admin`)

## 🎯 Fitur Redirect Admin

### Logika Redirect di Login

```javascript
// Setelah login berhasil, sistem cek role user
const redirectPath = data.user.role === 'ADMIN' ? '/admin' : '/generate-soal';

// Admin diarahkan ke dashboard admin
// User biasa diarahkan ke halaman generate soal
```

### Proteksi Middleware

- **Halaman admin** (`/admin/*`) hanya bisa diakses oleh user dengan role `ADMIN`
- **User non-admin** yang coba akses halaman admin akan di-redirect ke `/generate-soal`
- **User belum login** yang coba akses halaman admin akan di-redirect ke `/login`

### Auto-redirect untuk User yang Sudah Login

- **Admin** yang mengakses `/login` atau `/register` akan otomatis di-redirect ke `/admin`
- **User biasa** yang mengakses `/login` atau `/register` akan otomatis di-redirect ke `/generate-soal`

## 🛡️ Keamanan

### Proteksi Role-Based

```typescript
// Proteksi di dashboard admin
if (user?.role !== 'ADMIN') {
  router.push('/generate-soal');
  return;
}
```

### Proteksi Middleware

```typescript
// Middleware mengecek role untuk akses admin
if (isAdminPath && decoded.role !== 'ADMIN') {
  return NextResponse.redirect(new URL('/generate-soal', request.url));
}
```

## 📊 Dashboard Admin

Setelah login sebagai admin, Anda akan melihat:

- **Overview Dashboard**: Statistik platform
- **User Management**: Kelola pengguna
- **Question Analytics**: Analisis soal yang dibuat
- **Generation Reports**: Laporan pembangkitan soal
- **System Settings**: Pengaturan sistem

## 🔧 Troubleshooting

### Admin Tidak Ter-redirect ke Dashboard

1. **Cek role di database**:
   ```bash
   node setup-admin-user.js --list
   ```

2. **Pastikan user memiliki role 'ADMIN'** (bukan 'admin' dengan huruf kecil)

3. **Clear browser cache dan cookies**

4. **Cek console browser** untuk error JavaScript

### Login Gagal

1. **Pastikan kredensial benar**
2. **Cek koneksi ke auth service**
3. **Periksa log server** untuk error detail

### Redirect Loop

1. **Clear cookies**: Hapus semua cookies dari domain
2. **Restart browser**
3. **Cek middleware configuration**

## 📝 Testing

### Test Login Admin

1. Buat user admin menggunakan script
2. Login dengan kredensial admin
3. Pastikan ter-redirect ke `/admin`
4. Cek akses ke sub-halaman admin (`/admin/users`, `/admin/analytics`, dll)

### Test Login User Biasa

1. Registrasi user baru (role otomatis `USER`)
2. Login dengan kredensial user
3. Pastikan ter-redirect ke `/generate-soal`
4. Coba akses `/admin` (harus di-redirect ke `/generate-soal`)

## 🚦 Status Sistem

### Fitur yang Sudah Berfungsi ✅

- ✅ Auto-redirect berdasarkan role setelah login
- ✅ Proteksi halaman admin dengan middleware
- ✅ Auto-redirect user yang sudah login dari halaman auth
- ✅ Dashboard admin dengan analytics
- ✅ Script setup admin otomatis

### Yang Perlu Diperhatikan ⚠️

- ⚠️ Pastikan role di database adalah 'ADMIN' (case-sensitive)
- ⚠️ Clear cache browser jika ada masalah redirect
- ⚠️ Pastikan auth service berjalan untuk login

## 📞 Support

Jika mengalami masalah:

1. **Cek log console browser**
2. **Cek log server aplikasi**
3. **Jalankan script debugging**: `node setup-admin-user.js --list`
4. **Pastikan environment variables sudah benar**

---

**Dibuat oleh**: Tim Developer MSTA  
**Terakhir diupdate**: Desember 2024  
**Versi**: 1.0