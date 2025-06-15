'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (token: string, userData: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (token: string, userData: User) => {
    try {
      // Store token using API route
      await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      console.error('Error setting auth token:', error)
    }
  }

  const logout = async () => {
    try {
      console.log('Logging out user...');
      
      // Clear token in cookie using API route
      await fetch('/api/auth/clear-cookie', {
        method: 'POST',
      });
      
      // Clear localStorage data
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      
      // Clear user data in state
      setUser(null);
      
      console.log('User logged out, redirecting to login page');
      
      // Add a small delay before redirect to ensure state is cleared
      setTimeout(() => {
        // Redirect to login
        router.push('/login');
        
        // Fallback to direct location change if router doesn't work
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            console.log('Router redirect failed, using direct location change');
            window.location.href = '/login';
          }
        }, 500);
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Even if error occurs, still try to clear local data and redirect
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      setUser(null);
      
      // Force redirect to login page
      window.location.href = '/login';
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}