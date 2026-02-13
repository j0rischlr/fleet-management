import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Car, Calendar, Wrench, TrendingUp, X, MapPin } from 'lucide-react'
import DashboardCalendar from '../components/DashboardCalendar'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    activeReservations: 0,
    pendingMaintenance: 0,
  })
  const [vehicles, setVehicles] = useState([])
  const [reservations, setReservations] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [reservationForm, setReservationForm] = useState({
    vehicle_id: '',
    start_date: '',
    end_date: '',
    purpose: '',
    departure_location: '',
    arrival_location: '',
    notes: '',
    status: 'pending',
  })
  const [reservationLoading, setReservationLoading] = useState(false)
  const [reservationError, setReservationError] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const formatDateTime = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleCalendarSlotSelect = (slotInfo) => {
    setReservationForm({
      vehicle_id: '',
      user_id: user?.id,
      start_date: formatDateTime(new Date(slotInfo.start)),
      end_date: formatDateTime(new Date(slotInfo.end)),
      purpose: '',
      departure_location: '',
      arrival_location: '',
      notes: '',
      status: 'pending',
    })
    setReservationError(null)
    setShowReservationModal(true)
  }

  const closeReservationModal = () => {
    setShowReservationModal(false)
    setReservationError(null)
  }

  const handleReservationSubmit = async (e) => {
    e.preventDefault()
    setReservationLoading(true)
    setReservationError(null)
    try {
      await api.post('/reservations', { ...reservationForm, user_id: user?.id })
      closeReservationModal()
      loadStats()
    } catch (err) {
      console.error('Error creating reservation:', err)
      if (err.response?.status === 409) {
        setReservationError(err.response.data.error)
      } else {
        setReservationError('Erreur lors de la création de la réservation')
      }
    } finally {
      setReservationLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const [vehiclesData, reservationsData, maintenanceData] = await Promise.all([
        api.get('/vehicles'),
        api.get('/reservations'),
        api.get('/maintenance'),
      ])

      setVehicles(vehiclesData)
      setReservations(reservationsData)
      setMaintenance(maintenanceData)

      setStats({
        totalVehicles: vehiclesData.length,
        availableVehicles: vehiclesData.filter((v) => v.status === 'available').length,
        activeReservations: reservationsData.filter((r) => r.status === 'active' || r.status === 'approved').length,
        pendingMaintenance: maintenanceData.filter((m) => m.status === 'scheduled').length,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Véhicules totaux',
      value: stats.totalVehicles,
      icon: Car,
      color: 'bg-blue-500',
    },
    {
      name: 'Véhicules disponibles',
      value: stats.availableVehicles,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      name: 'Réservations actives',
      value: stats.activeReservations,
      icon: Calendar,
      color: 'bg-yellow-500',
    },
    {
      name: 'Maintenance en attente',
      value: stats.pendingMaintenance,
      icon: Wrench,
      color: 'bg-red-500',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-2 text-gray-600">
          Bienvenue, {profile?.full_name || 'Utilisateur'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="text-3xl font-semibold text-gray-900">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        <DashboardCalendar
          reservations={reservations}
          maintenance={maintenance}
          vehicles={vehicles}
          onSelectSlot={handleCalendarSlotSelect}
        />
      </div>

      {showReservationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border shadow-lg rounded-md bg-white w-full max-w-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Nouvelle réservation</h3>
              <button onClick={closeReservationModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            {reservationError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{reservationError}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button onClick={() => setReservationError(null)} className="inline-flex text-red-400 hover:text-red-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleReservationSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Véhicule</label>
                <select
                  required
                  value={reservationForm.vehicle_id}
                  onChange={(e) => setReservationForm({ ...reservationForm, vehicle_id: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.filter(v => v.status === 'available' && !v.assigned_user_id).map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.license_plate}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de début</label>
                  <input
                    type="datetime-local"
                    required
                    value={reservationForm.start_date}
                    onChange={(e) => setReservationForm({ ...reservationForm, start_date: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                  <input
                    type="datetime-local"
                    required
                    value={reservationForm.end_date}
                    onChange={(e) => setReservationForm({ ...reservationForm, end_date: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Motif</label>
                <input
                  type="text"
                  value={reservationForm.purpose}
                  onChange={(e) => setReservationForm({ ...reservationForm, purpose: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Ex: Déplacement professionnel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lieu de départ</label>
                  <input
                    type="text"
                    value={reservationForm.departure_location}
                    onChange={(e) => setReservationForm({ ...reservationForm, departure_location: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Ex: Paris"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lieu d'arrivée</label>
                  <input
                    type="text"
                    value={reservationForm.arrival_location}
                    onChange={(e) => setReservationForm({ ...reservationForm, arrival_location: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Ex: Lyon"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={reservationForm.notes}
                  onChange={(e) => setReservationForm({ ...reservationForm, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeReservationModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={reservationLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 disabled:opacity-50"
                >
                  {reservationLoading ? 'Enregistrement...' : 'Réserver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Aperçu rapide</h2>
        <div className="space-y-4">
          {(() => {
            const now = new Date()
            const usedVehicleIds = new Set(
              reservations
                .filter(r => {
                  if (r.status !== 'active' && r.status !== 'approved') return false
                  return new Date(r.start_date) <= now && new Date(r.end_date) >= now
                })
                .map(r => r.vehicle_id)
            )
            const usedCount = usedVehicleIds.size
            const usagePercent = stats.totalVehicles > 0
              ? Math.round((usedCount / stats.totalVehicles) * 100)
              : 0
            return (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">Taux d'utilisation</p>
                  <span className="text-sm font-semibold text-primary">{usagePercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${usagePercent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {usedCount} / {stats.totalVehicles} véhicule(s) actuellement en location
                </p>
              </div>
            )
          })()}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">État de la flotte</p>
              <p className="text-sm text-gray-500">
                {stats.pendingMaintenance > 0
                  ? `${stats.pendingMaintenance} véhicule(s) nécessite(nt) une maintenance`
                  : 'Tous les véhicules sont en bon état'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
