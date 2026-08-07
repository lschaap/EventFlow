import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

type AuthContextType = {
  currentUser: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
  authError: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) {
      setAuthError('Firebase is not configured. Check your environment variables.')
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    if (!auth) {
      setAuthError('Firebase is not configured. Check your environment variables.')
      return
    }

    setAuthError(null)

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      if (error instanceof Error) {
        setAuthError(error.message)
      } else {
        setAuthError('Google sign-in failed.')
      }
    }
  }

  const signOutUser = async () => {
    if (!auth) {
      return
    }

    try {
      await signOut(auth)
    } catch {
      setAuthError('Sign-out failed. Please try again.')
    }
  }

  const value = useMemo(
    () => ({ currentUser, loading, signInWithGoogle, signOutUser, authError }),
    [currentUser, loading, authError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
