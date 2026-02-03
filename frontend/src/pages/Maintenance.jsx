import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Wrench, Plus, Edit, Car } from 'lucide-react'

export default function Maintenance() {
  const [maintenanceRecords, setMaintenanceRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [maintenanceData, vehiclesData] = await Promise.all([
        api.get('/maintenance'),
        api.get('/vehicles'),
      ])
      setMaintenanceRecords(maintenanceData)
      setVehicles(vehiclesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updateData = { status: newStatus }
      if (newStatus === 'completed') {
        updateData.completed_date = new Date().toISOString()
      }
      await api.put(`/maintenance/${id}`, updateData)
      loadData()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const openModal = (maintenance = null) => {
    setEditingMaintenance(maintenance)
    setShowModal(true)
  }

  const closeModal = () => {
    setEditingMaintenance(null)
    setShowModal(false)
  }

  const statusColors = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const statusLabels = {
    scheduled: 'Planifiée',
    in_progress: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
  }

  const typeLabels = {
    routine: 'Entretien',
    repair: 'Réparation',
    inspection: 'Inspection',
    other: 'Autre',
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
          <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
          <p className="mt-2 text-gray-600">Gérez la maintenance des véhicules</p>
        </div>
        <button
          onClick={() => openModal()}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Planifier une maintenance
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {maintenanceRecords.map((record) => {
            const vehicle = record.vehicles
            return (
              <li key={record.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Wrench className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {typeLabels[record.type]} - {vehicle?.brand} {vehicle?.model}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[record.status]}`}>
                          {statusLabels[record.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        <Car className="inline h-4 w-4 mr-1" />
                        {vehicle?.license_plate}
                      </p>
                      <p className="mt-2 text-sm text-gray-700">{record.description}</p>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Date prévue:</span>{' '}
                          {new Date(record.scheduled_date).toLocaleDateString('fr-FR')}
                        </div>
                        {record.completed_date && (
                          <div>
                            <span className="font-medium">Date de fin:</span>{' '}
                            {new Date(record.completed_date).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                        {record.cost && (
                          <div>
                            <span className="font-medium">Coût:</span> {record.cost}€
                          </div>
                        )}
                        {record.provider && (
                          <div>
                            <span className="font-medium">Prestataire:</span> {record.provider}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {record.status === 'scheduled' && (
                      <button
                        onClick={() => handleStatusChange(record.id, 'in_progress')}
                        className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100"
                      >
                        Démarrer
                      </button>
                    )}
                    {record.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusChange(record.id, 'completed')}
                        className="px-3 py-1 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100"
                      >
                        Terminer
                      </button>
                    )}
                    {record.status !== 'completed' && (
                      <button
                        onClick={() => openModal(record)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {maintenanceRecords.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Wrench className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune maintenance</h3>
          <p className="mt-1 text-sm text-gray-500">Planifiez la première maintenance.</p>
        </div>
      )}

      {showModal && (
        <MaintenanceModal
          maintenance={editingMaintenance}
          vehicles={vehicles}
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

function MaintenanceModal({ maintenance, vehicles, onClose, onSave }) {
  const [formData, setFormData] = useState(
    maintenance || {
      vehicle_id: '',
      type: 'routine',
      description: '',
      scheduled_date: '',
      status: 'scheduled',
      cost: '',
      provider: '',
      notes: '',
    }
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSend = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : null,
      }

      if (maintenance) {
        await api.put(`/maintenance/${maintenance.id}`, dataToSend)
      } else {
        await api.post('/maintenance', dataToSend)
      }
      onSave()
    } catch (error) {
      console.error('Error saving maintenance:', error)
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
            {maintenance ? 'Modifier la maintenance' : 'Planifier une maintenance'}
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

          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="routine">Entretien</option>
              <option value="repair">Réparation</option>
              <option value="inspection">Inspection</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: Vidange et changement des filtres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date prévue</label>
            <input
              type="datetime-local"
              required
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Coût (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Prestataire</label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
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
