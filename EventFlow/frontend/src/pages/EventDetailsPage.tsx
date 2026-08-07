import { useParams } from 'react-router-dom'

export default function EventDetailsPage() {
  const { eventId } = useParams()

  return (
    <section>
      <h1 className="text-2xl font-semibold">Event Details</h1>
      <p className="mt-2 text-slate-600">Event ID: {eventId}</p>
    </section>
  )
}
