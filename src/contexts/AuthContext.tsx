import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useKV } from '@github/spark/hooks'

export interface User {
  id: string
  email: string
  name: string
  tier: 'free' | 'advanced' | 'expert'
  verified: boolean
  joinDate: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  updateTier: (tier: 'free' | 'advanced' | 'expert') => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useKV<User | null>('current-user', null)
  const [users, setUsers] = useKV<User[]>('users', [])
  const [isLoading, setIsLoading] = useState(false)

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true)
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      setIsLoading(false)
      return false
    }

    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      tier: 'free',
      verified: true, // Simulated email verification
      joinDate: new Date().toISOString()
    }

    setUsers(currentUsers => [...currentUsers, newUser])
    setUser(newUser)
    setIsLoading(false)
    return true
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    const foundUser = users.find(u => u.email === email)
    if (foundUser) {
      setUser(foundUser)
      setIsLoading(false)
      return true
    }
    
    setIsLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
  }

  const updateTier = (tier: 'free' | 'advanced' | 'expert') => {
    if (user) {
      const updatedUser = { ...user, tier }
      setUser(updatedUser)
      setUsers(currentUsers => 
        currentUsers.map(u => u.id === user.id ? updatedUser : u)
      )
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isLoading,
      updateTier
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}