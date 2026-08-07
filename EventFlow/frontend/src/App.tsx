import { NavLink, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import EventsPage from './pages/EventsPage'
import NewEventPage from './pages/NewEventPage'
import EventDetailsPage from './pages/EventDetailsPage'

const links = [
  { to: '/events', label: 'Events' },
  { to: '/events/new', label: 'New Event' },
]

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <NavLink to="/events" className="text-xl font-semibold">EventFlow</NavLink>
          <nav className="flex gap-4 text-sm">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className="hover:underline">
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Routes>
          <Route path="/" element={<EventsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/new" element={<NewEventPage />} />
          <Route path="/events/:eventId" element={<EventDetailsPage />} />
        </Routes>
      </main>
    </div>
  )
}
