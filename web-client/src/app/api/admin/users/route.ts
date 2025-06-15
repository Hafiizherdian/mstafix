import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// URL API
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'

export async function GET(request: NextRequest) {
  // Ambil token dari cookie
  const token = cookies().get('authToken')?.value

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthenticated' },
      { status: 401 }
    )
  }

  try {
    // Verifikasi token dan dapatkan data user
    const verifyResponse = await fetch(`${AUTH_SERVICE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!verifyResponse.ok) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { user } = await verifyResponse.json()

    // Cek jika user bukan admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized, admin access required' },
        { status: 403 }
      )
    }

    let users = []
    
    try {
      // Ambil data semua pengguna dari service
      const usersResponse = await fetch(`${AUTH_SERVICE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
  
      if (usersResponse.ok) {
        users = await usersResponse.json()
      } else {
        console.error('Failed to fetch users data, using dummy data')
      }
    } catch (error) {
      console.error('Error fetching users data:', error)
    }

    // Jika data kosong, buat data dummy untuk pengembangan
    if (!users || users.length === 0) {
      const currentUser = {
        id: user.userId || '1', 
        name: user.name || 'Admin User',
        email: user.email || 'admin@example.com',
        role: 'ADMIN',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      const mockUsers = [
        currentUser,
        { 
          id: '2', 
          name: 'Regular User 1', 
          email: 'user1@example.com', 
          role: 'USER',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: '3', 
          name: 'Regular User 2', 
          email: 'user2@example.com', 
          role: 'USER',
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: '4', 
          name: 'Regular User 3', 
          email: 'user3@example.com', 
          role: 'USER',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: '5', 
          name: 'Regular User 4', 
          email: 'user4@example.com', 
          role: 'USER',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() 
        }
      ]
      
      return NextResponse.json(mockUsers)
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    
    // Data fallback jika terjadi error
    const mockUsers = [
      { 
        id: '1', 
        name: 'Admin User', 
        email: 'admin@example.com', 
        role: 'ADMIN',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() 
      },
      { 
        id: '2', 
        name: 'Regular User 1', 
        email: 'user1@example.com', 
        role: 'USER',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() 
      },
      { 
        id: '3', 
        name: 'Regular User 2', 
        email: 'user2@example.com', 
        role: 'USER',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() 
      },
      { 
        id: '4', 
        name: 'Regular User 3', 
        email: 'user3@example.com', 
        role: 'USER',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() 
      },
      { 
        id: '5', 
        name: 'Regular User 4', 
        email: 'user4@example.com', 
        role: 'USER',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() 
      }
    ]
    
    return NextResponse.json(mockUsers)
  }
} 