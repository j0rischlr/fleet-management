import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../styles/calendar.css'

const locales = {
  'fr': fr,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function ReservationCalendar({ reservations, vehicles, onSelectSlot, onSelectEvent }) {
  const events = reservations
    .filter(r => r.status === 'approved' || r.status === 'pending' || r.status === 'active')
    .map(reservation => {
      const vehicle = vehicles.find(v => v.id === reservation.vehicle_id) || reservation.vehicles
      const userName = reservation.profiles?.full_name || reservation.profiles?.email || 'Utilisateur'
      return {
        id: reservation.id,
        title: `${vehicle?.brand || ''} ${vehicle?.model || ''} - ${userName}`,
        start: new Date(reservation.start_date),
        end: new Date(reservation.end_date),
        resource: {
          ...reservation,
          vehicle,
        },
      }
    })

  const eventStyleGetter = (event) => {
    const status = event.resource.status
    let backgroundColor = '#3b82f6'
    
    if (status === 'pending') {
      backgroundColor = '#f59e0b'
    } else if (status === 'approved') {
      backgroundColor = '#3b82f6'
    } else if (status === 'active') {
      backgroundColor = '#10b981'
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.875rem',
        padding: '2px 6px',
      },
    }
  }

  return (
    <div className="h-[600px] bg-white rounded-lg p-4">
      <div className="mb-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500"></div>
          <span className="text-gray-700">En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span className="text-gray-700">Approuvée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-gray-700">Active</span>
        </div>
      </div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        culture="fr"
        messages={{
          next: 'Suivant',
          previous: 'Précédent',
          today: "Aujourd'hui",
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour',
          agenda: 'Agenda',
          date: 'Date',
          time: 'Heure',
          event: 'Événement',
          noEventsInRange: 'Aucune réservation dans cette période',
          showMore: (total) => `+ ${total} de plus`,
        }}
        eventPropGetter={eventStyleGetter}
        selectable
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        views={['month', 'week', 'day', 'agenda']}
        defaultView="month"
      />
    </div>
  )
}
