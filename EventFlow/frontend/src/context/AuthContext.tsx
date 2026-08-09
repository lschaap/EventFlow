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
import { getAppUser } from '../services/users'
import type { AppUser } from '../types/models'

type AuthContextType = {
  firebaseUser: User | null
  appUser: AppUser | null
  role: 'admin' | 'staff' | null
  isAdmin: boolean
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
  authError: string | null
  accessDeniedMessage: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) {
      setAuthError('Firebase is not configured. Check your environment variables.')
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAccessDeniedMessage(null)
      setAuthError(null)
      setFirebaseUser(user)

      if (!user) {
        setAppUser(null)
        setLoading(false)
        return
      }

      try {
        const appUserRecord = await getAppUser(user.uid)

        if (!appUserRecord) {
          setAppUser(null)
          setAccessDeniedMessage('Your account is not authorized to use EventFlow.')
          setLoading(false)
          return
        }

        if (!appUserRecord.active) {
          setAppUser(null)
          setAccessDeniedMessage('Your EventFlow account is inactive. Contact an administrator.')
          setLoading(false)
          return
        }

        setAppUser(appUserRecord)
      } catch (error) {
        setAppUser(null)
        setAuthError(error instanceof Error ? error.message : 'Failed to load user authorization.')
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    if (!auth) {
      setAuthError('Firebase is not configured. Check your environment variables.')
      return
    }

    setAuthError(null)
    setAccessDeniedMessage(null)

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
      setAppUser(null)
      setAccessDeniedMessage(null)
    } catch {
      setAuthError('Sign-out failed. Please try again.')
    }
  }

  const role = appUser?.role ?? null
  const isAdmin = role === 'admin'

  const value = useMemo(
    () => ({
      firebaseUser,
      appUser,
      role,
      isAdmin,
      loading,
      signInWithGoogle,
      signOutUser,
      authError,
      accessDeniedMessage,
    }),
    [firebaseUser, appUser, role, isAdmin, loading, authError, accessDeniedMessage],
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
