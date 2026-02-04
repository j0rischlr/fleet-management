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

export default function DashboardCalendar({ reservations, maintenance, vehicles }) {
  const reservationEvents = reservations
    .filter(r => r.status === 'approved' || r.status === 'pending' || r.status === 'active')
    .map(reservation => {
      const vehicle = vehicles.find(v => v.id === reservation.vehicle_id) || reservation.vehicles
      const userName = reservation.profiles?.full_name || reservation.profiles?.email || 'Utilisateur'
      return {
        id: `res-${reservation.id}`,
        title: `🚗 ${vehicle?.brand || ''} ${vehicle?.model || ''} - ${userName}`,
        start: new Date(reservation.start_date),
        end: new Date(reservation.end_date),
        resource: {
          type: 'reservation',
          status: reservation.status,
          data: reservation,
          vehicle,
        },
      }
    })

  const maintenanceEvents = maintenance
    .filter(m => m.status === 'scheduled' || m.status === 'in_progress')
    .map(maint => {
      const vehicle = vehicles.find(v => v.id === maint.vehicle_id) || maint.vehicles
      return {
        id: `maint-${maint.id}`,
        title: `🔧 ${vehicle?.brand || ''} ${vehicle?.model || ''} - ${maint.type}`,
        start: new Date(maint.scheduled_date),
        end: new Date(new Date(maint.scheduled_date).getTime() + 2 * 60 * 60 * 1000),
        resource: {
          type: 'maintenance',
          status: maint.status,
          data: maint,
          vehicle,
        },
      }
    })

  const events = [...reservationEvents, ...maintenanceEvents]

  const eventStyleGetter = (event) => {
    const { type, status } = event.resource
    let backgroundColor = '#3b82f6'
    
    if (type === 'maintenance') {
      backgroundColor = status === 'in_progress' ? '#f97316' : '#ef4444'
    } else if (type === 'reservation') {
      if (status === 'pending') {
        backgroundColor = '#f59e0b'
      } else if (status === 'approved') {
        backgroundColor = '#3b82f6'
      } else if (status === 'active') {
        backgroundColor = '#10b981'
      }
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.75rem',
        padding: '2px 4px',
      },
    }
  }

  const handleSelectEvent = (event) => {
    const { type, data, vehicle } = event.resource
    
    if (type === 'reservation') {
      alert(`Réservation\n\nVéhicule: ${vehicle?.brand} ${vehicle?.model}\nStatut: ${data.status}\nDu: ${new Date(data.start_date).toLocaleString('fr-FR')}\nAu: ${new Date(data.end_date).toLocaleString('fr-FR')}\nMotif: ${data.purpose || 'Non spécifié'}`)
    } else if (type === 'maintenance') {
      alert(`Maintenance\n\nVéhicule: ${vehicle?.brand} ${vehicle?.model}\nType: ${data.type}\nStatut: ${data.status}\nDate: ${new Date(data.scheduled_date).toLocaleString('fr-FR')}\nDescription: ${data.description}`)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Calendrier de la semaine</h2>
      
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span className="text-gray-700">Réservation en attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-gray-700">Réservation approuvée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-gray-700">Réservation active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-gray-700">Maintenance prévue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span className="text-gray-700">Maintenance en cours</span>
        </div>
      </div>

      <div className="h-[700px]">
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
            noEventsInRange: 'Aucun événement dans cette période',
            showMore: (total) => `+ ${total} de plus`,
          }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          views={['week', 'day', 'agenda']}
          defaultView="week"
          toolbar={true}
        />
      </div>
    </div>
  )
}
