import { useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { X, Car, Wrench, Clock, MapPin, User, CalendarDays, FileText } from 'lucide-react'
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
  const [selectedEvent, setSelectedEvent] = useState(null)

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
    setSelectedEvent(event.resource)
  }

  const statusLabels = {
    pending: 'En attente',
    approved: 'Approuvée',
    active: 'Active',
    completed: 'Terminée',
    cancelled: 'Annulée',
    scheduled: 'Planifiée',
    in_progress: 'En cours',
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    scheduled: 'bg-red-100 text-red-800',
    in_progress: 'bg-orange-100 text-orange-800',
  }

  const maintenanceTypeLabels = {
    routine: 'Routine',
    repair: 'Réparation',
    inspection: 'Inspection',
    other: 'Autre',
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

      {selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={`px-6 py-4 ${selectedEvent.type === 'maintenance' ? 'bg-gradient-to-r from-orange-500 to-red-500' : selectedEvent.status === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : selectedEvent.status === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    {selectedEvent.type === 'maintenance' ? (
                      <Wrench className="h-5 w-5 text-white" />
                    ) : (
                      <Car className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {selectedEvent.type === 'maintenance' ? 'Maintenance' : 'Réservation'}
                    </h3>
                    <p className="text-sm text-white text-opacity-80">
                      {selectedEvent.vehicle?.brand} {selectedEvent.vehicle?.model}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Status badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Statut</span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[selectedEvent.data?.status] || 'bg-gray-100 text-gray-800'}`}>
                  {statusLabels[selectedEvent.data?.status] || selectedEvent.data?.status}
                </span>
              </div>

              {/* Vehicle info */}
              {selectedEvent.vehicle?.license_plate && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Car className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedEvent.vehicle.brand} {selectedEvent.vehicle.model}</p>
                    <p className="text-xs text-gray-500">{selectedEvent.vehicle.license_plate}</p>
                  </div>
                </div>
              )}

              {/* Dates */}
              {selectedEvent.type === 'reservation' && (
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div>
                      <span className="text-xs text-gray-500">Du </span>
                      <span className="text-sm font-medium text-gray-900">{new Date(selectedEvent.data.start_date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Au </span>
                      <span className="text-sm font-medium text-gray-900">{new Date(selectedEvent.data.end_date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedEvent.type === 'maintenance' && (
                <>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500">Date prévue</span>
                      <p className="text-sm font-medium text-gray-900">{new Date(selectedEvent.data.scheduled_date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Type</span>
                    <span className="text-sm font-medium text-gray-900">{maintenanceTypeLabels[selectedEvent.data.type] || selectedEvent.data.type}</span>
                  </div>
                </>
              )}

              {/* User (reservation) */}
              {selectedEvent.type === 'reservation' && selectedEvent.data?.profiles && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedEvent.data.profiles.full_name || 'Utilisateur'}</p>
                    <p className="text-xs text-gray-500">{selectedEvent.data.profiles.email}</p>
                  </div>
                </div>
              )}

              {/* Purpose / Description */}
              {selectedEvent.type === 'reservation' && selectedEvent.data?.purpose && (
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-gray-500">Motif</span>
                    <p className="text-sm text-gray-900">{selectedEvent.data.purpose}</p>
                  </div>
                </div>
              )}

              {selectedEvent.type === 'maintenance' && selectedEvent.data?.description && (
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-gray-500">Description</span>
                    <p className="text-sm text-gray-900">{selectedEvent.data.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
