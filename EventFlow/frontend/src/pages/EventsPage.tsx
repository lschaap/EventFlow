export default function EventsPage() {
  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="mt-2 text-slate-600">Upcoming, current, and past events will appear here.</p>
        </div>
        <a href="/events/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          New Event
        </a>
      </div>
    </section>
  )
}
