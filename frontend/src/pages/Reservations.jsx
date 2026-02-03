import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Calendar, Plus, Edit, Trash2, Car } from 'lucide-react'

export default function Reservations() {
  const { user, isAdmin } = useAuth()
  const [reservations, setReservations] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReservation, setEditingReservation] = useState(null)

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
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
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
                        <Car className="h-6 w-6 text-primary-600" />
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
          userId={user.id}
          onClose={closeModal}
          onSave={() => {
            loadData()
            closeModal()
          }}
        />
      )}
    </div>
  )
}

function ReservationModal({ reservation, vehicles, userId, onClose, onSave }) {
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (reservation) {
        await api.put(`/reservations/${reservation.id}`, formData)
      } else {
        await api.post('/reservations', formData)
      }
      onSave()
    } catch (error) {
      console.error('Error saving reservation:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {reservation ? 'Modifier la réservation' : 'Nouvelle réservation'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Véhicule</label>
            <select
              required
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date de fin</label>
              <input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Motif</label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: Déplacement professionnel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
