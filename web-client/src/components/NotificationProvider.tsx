'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

const WS_URL = typeof window !== 'undefined' && window.ENV?.WS_URL
  ? window.ENV.WS_URL
  : 'ws://localhost:3004';


const NotificationContext = createContext<any>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null)

  useEffect(() => {
    // Pastikan kode ini hanya dijalankan di browser
    if (typeof window !== 'undefined') {
      let ws: WebSocket | null = null
      
      function connect() {
        try {
          ws = new WebSocket(WS_URL)

          ws.onopen = () => {
            console.log('Connected to notification service')
            setSocket(ws)
          }

          ws.onmessage = (event) => {
            try {
              const notification = JSON.parse(event.data)
              handleNotification(notification)
            } catch (error) {
              console.error('Error parsing notification:', error)
            }
          }

          ws.onerror = (error) => {
            console.error('WebSocket error:', error)
          }

          ws.onclose = () => {
            console.log('Disconnected from notification service')
            setSocket(null)
            // Attempt to reconnect after 5 seconds
            setTimeout(connect, 5000)
          }
        } catch (error) {
          console.error('WebSocket connection error:', error)
          setTimeout(connect, 5000)
        }
      }

      connect()

      // Cleanup function
      return () => {
        if (ws) {
          ws.close()
        }
      }
    }
  }, []) // Empty dependency array

  const handleNotification = (notification: any) => {
    try {
      switch (notification.type) {
        case 'SOAL_GENERATED':
          toast.success('Soal baru telah dibuat')
          break
        case 'SOAL_UPDATED':
          toast.success('Soal telah diperbarui')
          break
        case 'STATUS_CHANGED':
          toast.success(`Status soal diubah menjadi ${notification.data.newStatus}`)
          break
        default:
          console.log('Unknown notification type:', notification.type)
      }
    } catch (error) {
      console.error('Error handling notification:', error)
    }
  }

  return (
    <NotificationContext.Provider value={socket}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
} 