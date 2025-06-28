<!--
  Dokumentasi ini mengikuti standar Fizh Coding Standards.
  Semua komentar dan penjelasan menggunakan bahasa Indonesia.
  Jangan terlalu fokus pada detail implementasi, karena proyek masih dalam tahap pengembangan.
-->

# Dashboard Admin Baru - MSTA Platform

## Overview

Dashboard Admin MSTA telah dibuat ulang dari awal dengan desain yang konsisten dengan landing page dan struktur data yang sesuai dengan microservices yang ada. Dashboard ini menggunakan skema warna dark theme dengan aksen cyan untuk memberikan pengalaman yang modern dan professional.

## Skema Warna

Dashboard mengadopsi skema warna dari landing page MSTA:

### Warna Utama
- **Background**: `bg-black` dengan pattern grid subtil
- **Primary**: `cyan-400`, `cyan-500`, `cyan-600` 
- **Surface**: `zinc-900/50`, `zinc-800`, `zinc-900/95`
- **Text**: `white`, `zinc-300`, `zinc-400`
- **Borders**: `zinc-800`, `cyan-800/50`
- **Accent**: Gradient cyan dengan glow effects

### Visual Effects
- **Backdrop Blur**: `backdrop-blur-sm` untuk navigasi
- **Glow Effects**: `shadow-[0_0_10px_rgba(0,206,209,0.3)]`
- **Gradient**: `bg-gradient-to-r from-cyan-500 to-cyan-400`
- **Pattern Background**: Grid dengan radial gradient overlay

## Struktur Dashboard

### 1. Layout dan Navigasi

#### Sidebar Navigation
- **Logo**: MSTA Admin dengan ikon sparkles
- **Menu Items**:
  - Dashboard (Home)
  - Users (Manajemen pengguna)
  - Bank Soal (Collection icon)
  - Generasi Soal (Lightning bolt icon)
  - Monitoring (Eye icon)
  - Notifications (Bell icon dengan badge)
  - Settings (Gear icon)

#### Top Bar
- **Breadcrumb**: Menampilkan halaman aktif
- **Controls**: Period selector, refresh button, export button
- **User Menu**: Avatar dengan gradient, nama, dan email

### 2. Status Sistem

Dashboard menampilkan health check dari semua microservices:

```typescript
systemHealth: {
  authService: "online" | "offline" | "degraded",
  manageSoalService: "online" | "offline" | "degraded", 
  generateSoalService: "online" | "offline" | "degraded"
}
```

**Visual Indicators**:
- 🟢 **Online**: `text-cyan-400`, `bg-cyan-900/20`
- 🟡 **Degraded**: `text-yellow-400`, `bg-yellow-900/20`
- 🔴 **Offline**: `text-red-400`, `bg-red-900/20`

### 3. Key Metrics Cards

#### Total Users
- **Value**: Jumlah total pengguna
- **Icon**: Users icon dengan warna cyan
- **Growth**: Persentase pertumbuhan pengguna baru
- **Subtitle**: Jumlah pengguna baru

#### Bank Soal
- **Value**: Total soal di database
- **Icon**: Collection icon
- **Subtitle**: Published vs Draft count

#### Total Generasi
- **Value**: Total soal yang di-generate
- **Icon**: Lightning bolt icon
- **Subtitle**: Generasi hari ini

#### Success Rate
- **Value**: Persentase keberhasilan generasi
- **Icon**: Chart bar icon
- **Trend**: Up/Down/Neutral indicator
- **Subtitle**: Jumlah generasi berhasil

### 4. Charts dan Visualisasi

#### Question Categories Chart (Bar Chart)
```typescript
data: Array<{
  name: string;
  value: number;
}>
```
- Horizontal bar chart dengan gradient cyan
- Progress bar dengan animasi

#### Question Types Chart (Doughnut Style)
- Grid layout 2 kolom
- Background `bg-zinc-800/50`
- Nilai ditampilkan dengan highlight cyan

### 5. Recent Activities

Menampilkan aktivitas terbaru dari semua services:

```typescript
activities: Array<{
  id: string;
  type: "user" | "question" | "generation";
  action: string;
  user: string;
  timestamp: string;
  status: "success" | "failed" | "pending";
  details: string;
}>
```

**Visual Elements**:
- **User Activity**: Blue icon dengan border
- **Question Activity**: Green icon dengan border  
- **Generation Activity**: Cyan icon dengan border
- **Status Badges**: Color-coded berdasarkan status

### 6. Performance Summary

Menampilkan 3 metrik utama:

1. **Tingkat Keberhasilan Generasi**: Persentase success rate
2. **Rata-rata Soal per User**: Total soal dibagi total user
3. **Tingkat Engagement User**: Active users dibagi total users

## Data Structure

### Input dari Microservices

#### Auth Service (`/admin/analytics/users`)
```json
{
  "overview": {
    "total": number,
    "active": number, 
    "new": number
  },
  "trends": {
    "registrations": [{"date": string, "count": number}]
  }
}
```

#### Manage Soal Service (`/admin/analytics`)
```json
{
  "overview": {
    "total": number,
    "inPeriod": number,
    "today": number
  },
  "categoryDistribution": [{"category": string, "count": number}],
  "typeDistribution": [{"type": string, "count": number}]
}
```

#### Generate Soal Service (`/admin/analytics/generations`)
```json
{
  "overview": {
    "total": number,
    "successful": number,
    "failed": number,
    "successRate": number
  },
  "trends": {
    "generations": [{"date": string, "count": number}]
  }
}
```

### Output Dashboard Structure

```typescript
interface DashboardMetrics {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  questions: {
    total: number;
    published: number;
    draft: number;
    categories: Array<{name: string, count: number, percentage: number}>;
    types: Array<{name: string, count: number, percentage: number}>;
    difficulty: Array<{name: string, count: number, percentage: number}>;
  };
  generations: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    todayCount: number;
    trends: Array<{date: string, count: number, successful: number, failed: number}>;
  };
  activities: Array<{
    id: string;
    type: "user" | "question" | "generation";
    action: string;
    user: string;
    timestamp: string;
    status: "success" | "failed" | "pending"; 
    details: string;
  }>;
  systemHealth: {
    authService: "online" | "offline" | "degraded";
    manageSoalService: "online" | "offline" | "degraded";
    generateSoalService: "online" | "offline" | "degraded";
  };
}
```

## Error Handling

### Graceful Degradation
1. **All Services Online**: Tampilkan data lengkap
2. **Partial Service Failure**: Tampilkan warning + data parsial
3. **All Services Offline**: Tampilkan fallback data dengan pesan error

### Fallback Data
```typescript
const fallbackData = {
  users: { total: 0, active: 0, new: 0, growth: 0 },
  questions: { total: 0, published: 0, draft: 0, categories: [], types: [], difficulty: [] },
  generations: { total: 0, successful: 0, failed: 0, successRate: 0, todayCount: 0, trends: [] },
  activities: [],
  systemHealth: { authService: "offline", manageSoalService: "offline", generateSoalService: "offline" }
}
```

### Visual Error States
- **Empty Charts**: Icon + message informatif
- **No Activities**: Clock icon dengan pesan
- **Service Offline**: Red status badge dengan error message

## Responsive Design

### Desktop (lg+)
- Sidebar fixed dengan width 64 (16rem)
- Charts dalam grid 2 kolom
- Full metrics cards dalam 4 kolom

### Tablet (md)
- Collapsible sidebar
- Charts stack vertikal
- Metrics cards dalam 2 kolom

### Mobile (sm)
- Hidden sidebar dengan overlay
- Single column layout
- Compact metrics cards

## Performance Optimizations

### Loading States
- Skeleton loading untuk dashboard
- Shimmer effects untuk charts
- Progressive data loading

### Data Fetching
- Parallel API calls ke semua services
- Timeout handling (15 seconds)
- Automatic retry dengan exponential backoff

### Caching
- Browser cache untuk static assets
- API response caching (5 minutes)
- LocalStorage untuk user preferences

## Security Features

### Authentication
- JWT token verification
- Admin role requirement
- Session timeout handling

### Authorization
- Route-level protection
- API endpoint protection
- Role-based access control

## Future Enhancements

### Real-time Updates
- WebSocket connection untuk live data
- Push notifications untuk critical alerts
- Auto-refresh setiap 30 detik

### Advanced Analytics
- Time-series charts untuk trends
- Predictive analytics
- Export ke PDF/Excel

### Monitoring & Alerts
- System health monitoring
- Performance metrics
- Alert configuration

## Deployment Notes

### Environment Variables
```bash
AUTH_SERVICE_URL=http://localhost:3001
MANAGE_SOAL_SERVICE_URL=http://localhost:3003  
GENERATE_SOAL_SERVICE_URL=http://localhost:3002
JWT_SECRET=your-jwt-secret
```

### Production Considerations
- CDN untuk static assets
- Load balancing untuk API calls
- Database connection pooling
- Error logging dan monitoring

## Conclusion

Dashboard Admin MSTA yang baru memberikan:
- ✅ **Visual Consistency**: Skema warna konsisten dengan landing page
- ✅ **Data Accuracy**: Agregasi data real dari semua microservices
- ✅ **Error Resilience**: Graceful handling untuk service failures
- ✅ **Modern UX**: Dark theme dengan glow effects dan smooth animations
- ✅ **Responsive Design**: Optimal di semua device sizes
- ✅ **Performance**: Fast loading dengan efficient data fetching

Dashboard ini siap untuk production dan dapat di-extend dengan fitur tambahan sesuai kebutuhan.