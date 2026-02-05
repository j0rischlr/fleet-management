import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Calendar, Plus, Edit, Trash2, Car, X, CheckCircle } from 'lucide-react'
import ReservationCalendar from '../components/ReservationCalendar'

export default function Reservations() {
  const { user, isAdmin } = useAuth()
  const [reservations, setReservations] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReservation, setEditingReservation] = useState(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returningReservation, setReturningReservation] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [reservationsData, vehiclesData] = await Promise.all([
        isAdmin() ? api.get('/reservations') : api.get(`/reservations/user/${user.id}`),
        api.get('/vehicles'),
      ])
      setReservations(reservationsData)
      setVehicles(vehiclesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return

    try {
      await api.delete(`/reservations/${id}`)
      loadData()
    } catch (error) {
      console.error('Error deleting reservation:', error)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/reservations/${id}`, { status: newStatus })
      loadData()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const openModal = (reservation = null) => {
    setEditingReservation(reservation)
    setShowModal(true)
  }

  const closeModal = () => {
    setEditingReservation(null)
    setShowModal(false)
  }

  const openReturnModal = (reservation) => {
    setReturningReservation(reservation)
    setShowReturnModal(true)
  }

  const closeReturnModal = () => {
    setReturningReservation(null)
    setShowReturnModal(false)
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const statusLabels = {
    pending: 'En attente',
    approved: 'Approuvée',
    active: 'Active',
    completed: 'Terminée',
    cancelled: 'Annulée',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Réservations</h1>
          <p className="mt-2 text-gray-600">
            {isAdmin() ? 'Gérez toutes les réservations' : 'Gérez vos réservations'}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle réservation
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {reservations.map((reservation) => {
            const vehicle = reservation.vehicles
            return (
              <li key={reservation.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {vehicle?.brand} {vehicle?.model}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[reservation.status]}`}>
                          {statusLabels[reservation.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Plaque: {vehicle?.license_plate}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>
                          Du {new Date(reservation.start_date).toLocaleDateString('fr-FR')} au{' '}
                          {new Date(reservation.end_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {reservation.purpose && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Motif:</span> {reservation.purpose}
                        </p>
                      )}
                      {isAdmin() && reservation.profiles && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Utilisateur:</span> {reservation.profiles.full_name || reservation.profiles.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {reservation.user_id === user.id && (reservation.status === 'active' || reservation.status === 'approved') && (
                      (() => {
                        const endDate = new Date(reservation.end_date)
                        const now = new Date()
                        const canReturn = now >= endDate
                        
                        return (
                          <button
                            onClick={() => canReturn && openReturnModal(reservation)}
                            disabled={!canReturn}
                            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                              canReturn
                                ? 'text-white bg-primary hover:bg-primary-600 cursor-pointer'
                                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                            }`}
                            title={!canReturn ? `Disponible après le ${endDate.toLocaleString('fr-FR')}` : ''}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Rendre le véhicule
                          </button>
                        )
                      })()
                    )}
                    {isAdmin() && reservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(reservation.id, 'approved')}
                          className="px-3 py-1 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                          className="px-3 py-1 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                    {(isAdmin() || reservation.user_id === user.id) && reservation.status !== 'completed' && (
                      <>
                        <button
                          onClick={() => openModal(reservation)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(reservation.id)}
                          className="p-2 text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {reservations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune réservation</h3>
          <p className="mt-1 text-sm text-gray-500">Commencez par créer une nouvelle réservation.</p>
        </div>
      )}

      {showModal && (
        <ReservationModal
          reservation={editingReservation}
          vehicles={vehicles.filter((v) => v.status === 'available')}
          allVehicles={vehicles}
          reservations={reservations}
          userId={user.id}
          onClose={closeModal}
          onSave={() => {
            loadData()
            closeModal()
          }}
        />
      )}

      {showReturnModal && (
        <VehicleReturnModal
          reservation={returningReservation}
          onClose={closeReturnModal}
          onSave={() => {
            loadData()
            closeReturnModal()
          }}
        />
      )}
    </div>
  )
}

function ReservationModal({ reservation, vehicles, allVehicles, reservations, userId, onClose, onSave }) {
  const [showCalendar, setShowCalendar] = useState(!reservation)
  const [formData, setFormData] = useState(
    reservation || {
      vehicle_id: '',
      user_id: userId,
      start_date: '',
      end_date: '',
      purpose: '',
      notes: '',
      status: 'pending',
    }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCalendarSelect = (slotInfo) => {
    const startDate = new Date(slotInfo.start)
    const endDate = new Date(slotInfo.end)
    
    const formatDateTime = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    setFormData({
      ...formData,
      start_date: formatDateTime(startDate),
      end_date: formatDateTime(endDate),
    })
    setShowCalendar(false)
  }

  const handleEventClick = (event) => {
    const res = event.resource
    alert(`Réservation: ${res.vehicle?.brand} ${res.vehicle?.model}\nStatut: ${res.status}\nDu: ${new Date(res.start_date).toLocaleString('fr-FR')}\nAu: ${new Date(res.end_date).toLocaleString('fr-FR')}`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (reservation) {
        await api.put(`/reservations/${reservation.id}`, formData)
      } else {
        await api.post('/reservations', formData)
      }
      onSave()
    } catch (err) {
      console.error('Error saving reservation:', err)
      if (err.response?.status === 409) {
        setError(err.response.data.error)
      } else {
        setError('Erreur lors de la sauvegarde de la réservation')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className={`relative top-10 mx-auto p-5 border shadow-lg rounded-md bg-white ${
        showCalendar ? 'w-full max-w-6xl' : 'w-full max-w-lg'
      }`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {reservation ? 'Modifier la réservation' : 'Nouvelle réservation'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {showCalendar && !reservation ? (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Sélectionnez une plage horaire dans le calendrier pour voir les créneaux disponibles.
                Les réservations existantes sont affichées en couleur.
              </p>
            </div>
            <ReservationCalendar
              reservations={reservations}
              vehicles={allVehicles}
              onSelectSlot={handleCalendarSelect}
              onSelectEvent={handleEventClick}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCalendar(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Saisir manuellement
              </button>
            </div>
          </div>
        ) : (
          <div>
            {!reservation && (
              <button
                type="button"
                onClick={() => setShowCalendar(true)}
                className="mb-4 inline-flex items-center px-3 py-2 text-sm font-medium text-primary hover:text-primary-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Voir le calendrier
              </button>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Véhicule</label>
            <select
              required
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicles.map((vehicle) => (
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
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date de fin</label>
              <input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Motif</label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Ex: Déplacement professionnel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
          </div>
        )}
      </div>
    </div>
  )
}

function VehicleReturnModal({ reservation, onClose, onSave }) {
  const vehicle = reservation.vehicles
  const [formData, setFormData] = useState({
    current_mileage: vehicle?.mileage || 0,
    fuel_level: '',
    battery_level: '',
    has_issues: false,
    issues_description: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post(`/reservations/${reservation.id}/return`, formData)
      onSave()
    } catch (error) {
      console.error('Error returning vehicle:', error)
      alert('Erreur lors du retour du véhicule')
    } finally {
      setLoading(false)
    }
  }

  const isFuelVehicle = vehicle?.fuel_type === 'gasoline' || vehicle?.fuel_type === 'diesel' || vehicle?.fuel_type === 'hybrid'
  const isElectricVehicle = vehicle?.fuel_type === 'electric' || vehicle?.fuel_type === 'hybrid'

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Retour du véhicule
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">
            {vehicle?.brand} {vehicle?.model}
          </p>
          <p className="text-sm text-gray-500">
            Plaque: {vehicle?.license_plate}
          </p>
          <p className="text-sm text-gray-500">
            Kilométrage actuel: {vehicle?.mileage?.toLocaleString()} km
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kilométrage affiché <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={vehicle?.mileage || 0}
              value={formData.current_mileage}
              onChange={(e) => setFormData({ ...formData, current_mileage: parseInt(e.target.value) })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Kilométrage actuel du véhicule"
            />
            <p className="mt-1 text-xs text-gray-500">
              Le kilométrage doit être supérieur ou égal à {vehicle?.mileage?.toLocaleString()} km
            </p>
          </div>

          {isFuelVehicle && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Plein d'essence effectué ?
              </label>
              <select
                value={formData.fuel_level}
                onChange={(e) => setFormData({ ...formData, fuel_level: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="">Sélectionner</option>
                <option value="full">Plein effectué</option>
                <option value="3/4">3/4 plein</option>
                <option value="1/2">1/2 plein</option>
                <option value="1/4">1/4 plein</option>
                <option value="empty">Réservoir vide</option>
              </select>
            </div>
          )}

          {isElectricVehicle && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Niveau de batterie (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.battery_level}
                onChange={(e) => setFormData({ ...formData, battery_level: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="0-100"
              />
            </div>
          )}

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.has_issues}
                onChange={(e) => setFormData({ ...formData, has_issues: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Problèmes physiques constatés
              </span>
            </label>
          </div>

          {formData.has_issues && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description des problèmes <span className="text-red-500">*</span>
              </label>
              <textarea
                required={formData.has_issues}
                value={formData.issues_description}
                onChange={(e) => setFormData({ ...formData, issues_description: e.target.value })}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Décrivez les problèmes constatés (rayures, chocs, pannes, etc.)"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Traitement...' : 'Confirmer le retour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
