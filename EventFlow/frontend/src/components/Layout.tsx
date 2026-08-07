import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/events', label: 'Events' },
  { to: '/events/new', label: 'New Event' },
]

export default function Layout() {
  const { currentUser, signOutUser } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <NavLink to="/events" className="text-xl font-semibold text-slate-900">
            EventFlow
          </NavLink>

          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 transition ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {currentUser ? (
              <button
                type="button"
                onClick={signOutUser}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-100"
              >
                Sign out
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
