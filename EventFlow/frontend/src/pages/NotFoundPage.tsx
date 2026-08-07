import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-4 text-slate-600">
        The page you are looking for does not exist. Return to the Events dashboard or sign in.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white" to="/events">
          Events
        </Link>
        <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" to="/login">
          Login
        </Link>
      </div>
    </section>
  )
}
