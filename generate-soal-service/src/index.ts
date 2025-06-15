import app from './app'
import { PrismaClient } from '@prisma/client'
import { messageQueue } from './services/messageQueue'
import http from 'http'

const prisma = new PrismaClient()
const PORT = parseInt(process.env.PORT || '3002', 10)

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('Database connected successfully')

    // Initialize message queue
    await messageQueue.connect()
    console.log('Message queue connected successfully')

    // Buat HTTP server dan terapkan konfigurasi timeout
    const server = http.createServer(app)
    
    // Set timeout values (dalam milidetik) - 5 menit
    server.timeout = parseInt(process.env.REQUEST_TIMEOUT || '300000', 10)
    server.headersTimeout = parseInt(process.env.HEADERS_TIMEOUT || '300000', 10)
    server.keepAliveTimeout = 65000

    server.listen(PORT, () => {
      console.log(`🚀 generate-soal-service listening on port ${PORT}`)
      console.log(`Server timeout: ${server.timeout}ms, Headers timeout: ${server.headersTimeout}ms`)
    })

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      await messageQueue.disconnect()
      await prisma.$disconnect()
      process.exit(0)
    })

  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()