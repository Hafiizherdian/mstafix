# Perbaikan Dashboard Analytics - Panduan Deployment

## Masalah yang Ditemukan

Dashboard admin menampilkan data mock karena ada ketidakcocokan endpoint dan masalah dalam penggabungan data dari microservices.

### Analisis Console Log
- **Data Mock**: `recentActivity: (5) [...]` - menampilkan 5 aktivitas terbaru
- **Data Asli**: `recentActivity: []` - array kosong karena service tidak mengembalikan data yang benar

## Root Cause

1. **Ketidakcocokan Endpoint**:
   - Frontend memanggil: `/admin/analytics/questions`
   - Manage-soal-service route lama: `/admin/analytics`
   - Seharusnya: `/admin/analytics/questions`

2. **Masalah Penggabungan Data**:
   - Data dari 3 service (auth, manage-soal, generate-soal) tidak tergabung dengan benar
   - `recentActivity` dari masing-masing service tidak dikombinasikan dengan proper

## Perubahan yang Dilakukan

### 1. Perbaikan Route di Manage-Soal-Service
**File**: `mstafix/manage-soal-service/src/routes/admin.routes.ts`

```typescript
// SEBELUM
router.get("/analytics", getQuestionAnalytics);

// SESUDAH  
router.get("/analytics/questions", getQuestionAnalytics);
```

### 2. Perbaikan Frontend Service Client
**File**: `mstafix/web-client/src/lib/services.ts`

- Menambah logging detail untuk debugging
- Memperbaiki handling response dari service
- Memastikan `recentActivity` dari semua service tergabung dengan benar

### 3. Peningkatan Error Handling
- Better handling untuk response structure
- Filtering untuk memastikan data valid
- Fallback mechanism yang lebih robust

## Langkah Deployment ke VPS

### Opsi 1: Deploy Semua Perubahan (Recommended)

1. **Build dan Deploy Manage-Soal-Service**:
```bash
# Di VPS, masuk ke direktori manage-soal-service
cd /path/to/mstafix/manage-soal-service

# Pull perubahan terbaru
git pull origin main

# Restart service
docker-compose restart manage-soal-service
# atau jika menggunakan docker service
docker service update mstafix_manage-soal-service
```

2. **Build dan Deploy Web-Client**:
```bash
# Di VPS, masuk ke direktori web-client  
cd /path/to/mstafix/web-client

# Pull perubahan terbaru
git pull origin main

# Build aplikasi
npm run build

# Restart service
docker-compose restart web-client
# atau jika menggunakan docker service
docker service update mstafix_web-client
```

### Opsi 2: Hotfix Sementara (Jika tidak bisa restart service)

Jika tidak bisa restart service manage-soal, ubah endpoint di frontend saja:

**File**: `web-client/src/lib/services.ts` line ~273
```typescript
// Ubah dari:
`/admin/analytics/questions?period=${period}`

// Menjadi:
`/admin/analytics?period=${period}`
```

Kemudian build dan restart web-client saja.

## Validasi Setelah Deployment

### 1. Cek Console Browser
Setelah deployment, buka dashboard admin dan lihat console:

**Yang Diharapkan**:
```javascript
=== FETCHING ANALYTICS DATA ===
Period: 30d
Token available: true

=== RAW SERVICE RESPONSES ===
Raw user analytics: { "success": true, "data": {...} }
Raw question analytics: { "success": true, "data": {...} }  
Raw generation analytics: { "success": true, "data": {...} }

Recent activity count: [angka > 0]
Recent activity items: [array dengan data]
```

### 2. Cek Endpoint Manual
Test endpoint secara manual:

```bash
# Test auth service analytics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-vps.com/api/auth/admin/analytics/users?period=30d"

# Test manage-soal service analytics  
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-vps.com/api/manage-soal/admin/analytics/questions?period=30d"

# Test generate-soal service analytics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-vps.com/api/generate-soal/admin/analytics/generations?period=30d"
```

### 3. Cek Dashboard
- Dashboard menampilkan data asli (bukan mock)
- Recent Activity menampilkan aktivitas nyata dari database
- Chart dan statistik menunjukkan data sebenarnya

## Troubleshooting

### Jika Dashboard Masih Menampilkan Mock Data

1. **Cek Service Status**:
```bash
docker-compose ps
# atau
docker service ls
```

2. **Cek Logs Service**:
```bash
# Auth service
docker-compose logs auth-service

# Manage-soal service  
docker-compose logs manage-soal-service

# Generate-soal service
docker-compose logs generate-soal-service

# Web client
docker-compose logs web-client
```

3. **Cek Database**:
```bash
# Pastikan ada data di database
docker-compose exec postgres psql -U postgres -d mstafix

# Cek jumlah user
SELECT COUNT(*) FROM "User";

# Cek jumlah question
SELECT COUNT(*) FROM "Question";
```

### Error yang Mungkin Muncul

1. **"Service unavailable"** - Service backend tidak running
2. **"Invalid token"** - Token auth bermasalah
3. **"Empty recentActivity"** - Database tidak memiliki data terbaru

## Monitoring

Setelah deployment berhasil, pantau:

1. **Performance**: Dashboard load time
2. **Data Accuracy**: Bandingkan dengan data database langsung
3. **Error Rate**: Monitor console errors
4. **Service Health**: Endpoint `/health` di masing-masing service

## Rollback Plan

Jika ada masalah setelah deployment:

1. **Rollback Web-Client**:
```bash
cd web-client
git checkout HEAD~1
npm run build
docker-compose restart web-client
```

2. **Rollback Manage-Soal-Service**:
```bash
cd manage-soal-service  
git checkout HEAD~1
docker-compose restart manage-soal-service
```

## Contact & Support

Jika masih ada masalah setelah mengikuti panduan ini:
1. Cek logs service untuk error message detail
2. Pastikan semua service running dengan `docker-compose ps`
3. Test endpoint manual dengan curl untuk isolasi masalah

---

**Catatan**: Panduan ini dibuat berdasarkan analisis kode pada 2024-12-24. Pastikan untuk backup database sebelum deployment.