import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Car, Wrench, CheckCircle, AlertTriangle, Clock, X } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../styles/calendar.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const locales = { fr }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function GarageBooking() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    loadBookingData()
  }, [token])

  const loadBookingData = async () => {
    try {
      const response = await fetch(`${API_URL}/garage-booking/${token}`)
      if (response.status === 404) {
        setError('Ce lien est invalide ou a expiré.')
        return
      }
      if (response.status === 410) {
        setError('Ce lien a expiré.')
        return
      }
      if (!response.ok) throw new Error('Erreur serveur')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError('Impossible de charger les données. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleSelectSlot = (slotInfo) => {
    setSelectedSlot({
      start: new Date(slotInfo.start),
      end: new Date(slotInfo.end),
      dateValue: formatDateTime(new Date(slotInfo.start)),
    })
    setSubmitError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSlot) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch(`${API_URL}/garage-booking/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_date: selectedSlot.dateValue,
          description: description || undefined,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Erreur lors de la soumission')
      }

      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Build calendar events
  const events = data ? [
    ...(data.reservations || []).map(r => ({
      id: `res-${r.id}`,
      title: `Réservation`,
      start: new Date(r.start_date),
      end: new Date(r.end_date),
      resource: { type: 'reservation', status: r.status },
    })),
    ...(data.maintenance || []).map(m => ({
      id: `maint-${m.id}`,
      title: `Maintenance - ${m.type || ''}`,
      start: new Date(m.scheduled_date),
      end: new Date(new Date(m.scheduled_date).getTime() + 2 * 60 * 60 * 1000),
      resource: { type: 'maintenance', status: m.status },
    })),
  ] : []

  const eventStyleGetter = (event) => {
    const { type, status } = event.resource
    let backgroundColor = '#3b82f6'
    if (type === 'maintenance') {
      backgroundColor = status === 'in_progress' ? '#f97316' : '#ef4444'
    } else if (type === 'reservation') {
      if (status === 'pending') backgroundColor = '#f59e0b'
      else if (status === 'active') backgroundColor = '#10b981'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Lien non valide</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Rendez-vous enregistré</h1>
          <p className="text-gray-600">
            Votre rendez-vous pour le véhicule <strong>{data.vehicle.brand} {data.vehicle.model}</strong> a été enregistré avec succès.
          </p>
          <p className="text-sm text-gray-500 mt-4">Vous pouvez fermer cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Planifier un rendez-vous</h1>
              <p className="text-sm text-gray-500">
                {data.alert_rule_name} — {data.vehicle.brand} {data.vehicle.model} ({data.vehicle.license_plate})
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Vehicle info card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{data.vehicle.brand} {data.vehicle.model}</p>
              <p className="text-xs text-gray-500">Immatriculation : {data.vehicle.license_plate}</p>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <Wrench className="h-3 w-3 mr-1" />
                {data.alert_rule_name}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Instructions :</strong> Cliquez sur un créneau libre dans le calendrier ci-dessous pour proposer une date de rendez-vous.
            Les créneaux occupés (réservations et maintenances) sont affichés en couleur.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs mb-4">
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

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="h-[600px]">
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
              selectable
              onSelectSlot={handleSelectSlot}
              views={['month', 'week', 'day']}
              defaultView="week"
            />
          </div>
        </div>

        {/* Booking form */}
        {selectedSlot && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              Confirmer le rendez-vous
            </h2>

            {submitError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-red-800">{submitError}</p>
                  <button onClick={() => setSubmitError(null)} className="text-red-400 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure sélectionnées</label>
                <input
                  type="datetime-local"
                  required
                  value={selectedSlot.dateValue}
                  onChange={(e) => setSelectedSlot({ ...selectedSlot, dateValue: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes (optionnel)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Remplacement des 4 pneumatiques, durée estimée 2h..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement...' : 'Confirmer le rendez-vous'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
