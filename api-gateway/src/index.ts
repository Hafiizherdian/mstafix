import app from './app'

// Ubah default ke 3000 agar sesuai Dockerfile dan docker-compose
const PORT = parseInt(process.env.PORT || '3000', 10)
app.listen(PORT, () => {
  console.log(`🚀 API-Gateway berjalan di http://0.0.0.0:${PORT}`)
}) 