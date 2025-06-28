<!--
  Dokumentasi ini mengikuti standar Fizh Coding Standards.
  Semua komentar dan penjelasan menggunakan bahasa Indonesia.
  Jangan terlalu fokus pada detail implementasi, karena proyek masih dalam tahap pengembangan.
-->

# 🚨 PERBAIKAN ANALYTICS DASHBOARD - QUICK FIX

## Status Masalah
Berdasarkan log yang ditemukan, dashboard admin mengalami **HTTP 503 Service Unavailable** saat mengakses analytics data.

### Gejala:
- ✅ Admin user dapat login (`a@example.com`)
- ✅ Dashboard utama terbuka
- ✅ Menu users berfungsi normal
- ❌ Analytics mengembalikan 503 Service Unavailable
- ❌ Charts dan statistics tidak muncul

## 🔧 SOLUSI CEPAT

### Langkah 1: Install Dependencies
```bash
cd mstafix
npm install
```

### Langkah 2: Jalankan Quick Fix
```bash
npm run quick:fix
```

Script ini akan:
- ✅ Test koneksi ke semua analytics services
- ✅ Identifikasi service yang down
- ✅ Memberikan instruksi perbaikan spesifik

### Langkah 3: Restart Services (Jika Diperlukan)
Jika ada service yang down:
```bash
docker-compose restart auth-service manage-soal-service generate-soal-service
```

### Langkah 4: Verifikasi
Buka dashboard dan refresh:
```
http://202.10.40.191:3000/admin
```

## 🛠️ TROUBLESHOOTING LANJUTAN

### Jika Masih 503 Error:

#### Option A: Debug Production Environment
```bash
npm run debug:production
```

#### Option B: Check Container Status
```bash
docker-compose ps
docker-compose logs auth-service
docker-compose logs manage-soal-service
docker-compose logs generate-soal-service
```

#### Option C: Manual Service Test
```bash
# Test auth service
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://202.10.40.191:3001/admin/analytics/users?period=30d

# Test question service  
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://202.10.40.191:3003/admin/analytics/questions?period=30d

# Test generation service
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://202.10.40.191:3002/admin/analytics/generations?period=30d
```

## 📊 EXPECTED RESULTS

Setelah perbaikan berhasil, dashboard akan menampilkan:

- **Users Stats**: Total users, active users, new registrations
- **Questions Stats**: Total questions, categories, types
- **Generation Stats**: Success rate, daily trends
- **Charts**: User growth, generation trends
- **Recent Activity**: Timeline aktivitas terbaru

## 🚨 EMERGENCY FIXES

### Fix 1: Service URLs Production
Jika semua service down, kemungkinan masalah URL configuration:
```bash
# Edit docker-compose.yml dan pastikan ports exposed:
# - "3001:3001"  # auth-service
# - "3002:3002"  # generate-soal-service  
# - "3003:3003"  # manage-soal-service
```

### Fix 2: Database Connection
```bash
# Check database containers
docker-compose ps | grep db
docker-compose logs auth-db
docker-compose logs manage-soal-db
docker-compose logs generate-soal-db
```

### Fix 3: JWT Token Issues
```bash
# Check JWT_SECRET consistency across services
grep JWT_SECRET docker-compose.yml
```

## 📞 SUPPORT COMMANDS

### Get Auth Token (untuk manual testing):
```bash
curl -X POST http://202.10.40.191:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@example.com","password":"admin123"}'
```

### Check Service Health:
```bash
curl http://202.10.40.191:3001/health  # auth
curl http://202.10.40.191:3002/health  # generate-soal
curl http://202.10.40.191:3003/health  # manage-soal
```

### Restart Specific Services:
```bash
docker-compose restart auth-service
docker-compose restart manage-soal-service  
docker-compose restart generate-soal-service
docker-compose restart web-client
```

## ✅ SUCCESS CHECKLIST

Setelah fix berhasil, pastikan:
- [ ] `npm run quick:fix` shows all services OK
- [ ] Dashboard loads without 503 errors
- [ ] Stats cards show numbers > 0
- [ ] Charts display data (not empty)
- [ ] No console errors in browser
- [ ] Recent activity shows entries

## 🎯 PREVENTION

Untuk mencegah masalah serupa:
1. **Monitor containers**: `docker-compose ps` secara berkala
2. **Check logs**: Review error logs setiap deployment
3. **Health checks**: Implement automated health monitoring
4. **Backup database**: Regular database backups
5. **Test after changes**: Always test analytics after updates

---

## 📋 QUICK REFERENCE

### Ports yang Digunakan:
- `3000` - Web Client (Next.js)
- `3001` - Auth Service  
- `3002` - Generate Soal Service
- `3003` - Manage Soal Service
- `3004` - Notification Service
- `4000` - API Gateway

### Admin Credentials:
- **Email**: `a@example.com`
- **Password**: `admin123` (verify this)

### Key URLs:
- **Dashboard**: `http://202.10.40.191:3000/admin`
- **Analytics API**: `http://202.10.40.191:3000/api/admin/analytics`
- **Auth Service**: `http://202.10.40.191:3001`

---

*Dibuat untuk mengatasi masalah 503 Service Unavailable pada analytics dashboard MSTAFIX.*