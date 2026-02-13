import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { Wrench, Plus, Edit, Car, ChevronLeft, ChevronRight, X, Filter } from 'lucide-react'

export default function Maintenance() {
  const location = useLocation()
  const [maintenanceRecords, setMaintenanceRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState(null)
  const [prefillData, setPrefillData] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completingRecord, setCompletingRecord] = useState(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const itemsPerPage = 10

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (location.state?.vehicle_id && location.state?.alerts) {
      setPrefillData({
        vehicle_id: location.state.vehicle_id,
        alerts: location.state.alerts
      })
      setShowModal(true)
      // Clear navigation state to avoid re-opening on refresh
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const loadData = async () => {
    try {
      const [maintenanceData, vehiclesData] = await Promise.all([
        api.get('/maintenance'),
        api.get('/vehicles'),
      ])
      const sorted = maintenanceData.sort((a, b) => {
        const dateA = new Date(a.completed_date || a.scheduled_date)
        const dateB = new Date(b.completed_date || b.scheduled_date)
        return dateB - dateA
      })
      setMaintenanceRecords(sorted)
      setVehicles(vehiclesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'completed') {
      const record = maintenanceRecords.find(m => m.id === id)
      const vehicle = vehicles.find(v => v.id === record?.vehicle_id)
      setCompletingRecord({ record, vehicle })
      setShowCompletionModal(true)
      return
    }
    try {
      await api.put(`/maintenance/${id}`, { status: newStatus })
      loadData()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleCompleteMaintenance = async (completionData) => {
    try {
      await api.put(`/maintenance/${completingRecord.record.id}`, completionData)
      setShowCompletionModal(false)
      setCompletingRecord(null)
      loadData()
    } catch (error) {
      console.error('Error completing maintenance:', error)
    }
  }

  const openModal = (maintenance = null) => {
    setEditingMaintenance(maintenance)
    setShowModal(true)
  }

  const closeModal = () => {
    setEditingMaintenance(null)
    setPrefillData(null)
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
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedVehicleId}
              onChange={(e) => { setSelectedVehicleId(e.target.value); setCurrentPage(1) }}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} — {v.license_plate}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Planifier une maintenance
          </button>
        </div>
      </div>

      {!selectedVehicleId ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <Wrench className="mx-auto h-14 w-14 text-gray-300" />
          <h2 className="mt-4 text-lg font-semibold text-gray-700">Page de maintenance</h2>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Sélectionnez un véhicule dans le filtre ci-dessus pour consulter et gérer son historique de maintenance.
          </p>
        </div>
      ) : (
      <>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {maintenanceRecords.filter(r => r.vehicle_id === selectedVehicleId).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((record) => {
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
                    {(record.status === 'scheduled' || record.status === 'in_progress') && (
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

      {maintenanceRecords.filter(r => r.vehicle_id === selectedVehicleId).length > itemsPerPage && (
        <div className="flex items-center justify-between mt-4 bg-white px-4 py-3 rounded-lg shadow sm:px-6">
          <div className="text-sm text-gray-700">
            Affichage de <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à{' '}
            <span className="font-medium">{Math.min(currentPage * itemsPerPage, maintenanceRecords.filter(r => r.vehicle_id === selectedVehicleId).length)}</span> sur{' '}
            <span className="font-medium">{maintenanceRecords.filter(r => r.vehicle_id === selectedVehicleId).length}</span> maintenances
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} / {Math.ceil(maintenanceRecords.filter(r => r.vehicle_id === selectedVehicleId).length / itemsPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(maintenanceRecords.filter(r => r.vehicle_id === selectedVehicleId).length / itemsPerPage), p + 1))}
              disabled={currentPage >= Math.ceil(maintenanceRecords.filter(r => r.vehicle_id === selectedVehicleId).length / itemsPerPage)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {maintenanceRecords.filter(r => r.vehicle_id === selectedVehicleId).length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Wrench className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune maintenance</h3>
          <p className="mt-1 text-sm text-gray-500">Aucune maintenance enregistrée pour ce véhicule.</p>
        </div>
      )}
      </>
      )}


      {showModal && (
        <MaintenanceModal
          maintenance={editingMaintenance}
          vehicles={vehicles}
          prefillData={prefillData}
          onClose={closeModal}
          onSave={() => {
            loadData()
            closeModal()
          }}
        />
      )}

      {showCompletionModal && completingRecord && (
        <CompletionModal
          record={completingRecord.record}
          vehicle={completingRecord.vehicle}
          onClose={() => { setShowCompletionModal(false); setCompletingRecord(null) }}
          onSave={handleCompleteMaintenance}
        />
      )}
    </div>
  )
}

function MaintenanceModal({ maintenance, vehicles, prefillData, onClose, onSave }) {
  const getInitialFormData = () => {
    if (maintenance) return maintenance
    if (prefillData) {
      return {
        vehicle_id: prefillData.vehicle_id,
        type: 'routine',
        description: prefillData.alerts[0]?.rule_name || '',
        scheduled_date: '',
        status: 'scheduled',
        provider: '',
        notes: '',
      }
    }
    return {
      vehicle_id: '',
      type: 'routine',
      description: '',
      scheduled_date: '',
      status: 'scheduled',
      provider: '',
      notes: '',
    }
  }

  const [formData, setFormData] = useState(getInitialFormData())
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

          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="routine">Entretien</option>
              <option value="repair">Réparation</option>
              <option value="inspection">Inspection</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            {prefillData && prefillData.alerts.length > 0 ? (
              <select
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                {prefillData.alerts.map((alert, idx) => (
                  <option key={idx} value={alert.rule_name}>
                    {alert.rule_name}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Ex: Vidange et changement des filtres"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date prévue</label>
            <input
              type="datetime-local"
              required
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div className={maintenance ? 'grid grid-cols-2 gap-4' : ''}>
            {maintenance && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Coût (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost || ''}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Prestataire</label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
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
    </div>
  )
}

function CompletionModal({ record, vehicle, onClose, onSave }) {
  const [formData, setFormData] = useState({
    mileage_at_service: vehicle?.mileage || 0,
    cost: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        status: 'completed',
        completed_date: new Date().toISOString(),
        mileage_at_service: parseInt(formData.mileage_at_service),
        cost: formData.cost ? parseFloat(formData.cost) : null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Terminer la maintenance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">
            {vehicle?.brand} {vehicle?.model} — {vehicle?.license_plate}
          </p>
          <p className="text-sm text-gray-500 mt-1">{record.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Kilométrage actuel</label>
            <input
              type="number"
              required
              min="0"
              value={formData.mileage_at_service}
              onChange={(e) => setFormData({ ...formData, mileage_at_service: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Coût (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Optionnel"
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
