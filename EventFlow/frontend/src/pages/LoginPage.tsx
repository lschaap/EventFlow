import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { firebaseUser, loading, signInWithGoogle, authError, accessDeniedMessage } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
          <p className="text-lg font-medium">Preparing sign-in…</p>
          <p className="mt-2 text-slate-600">Checking your authentication session.</p>
        </div>
      </div>
    )
  }

  if (firebaseUser && !accessDeniedMessage) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/events'
    return <Navigate to={from} replace />
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="mt-3 text-slate-600">Use your Google account to access EventFlow.</p>

        {authError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {authError}
          </div>
        ) : null}

        {accessDeniedMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {accessDeniedMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={signInWithGoogle}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Sign in with Google
        </button>
      </div>
    </section>
  )
}
