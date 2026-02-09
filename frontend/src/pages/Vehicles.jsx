import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Car, Plus, Edit, Trash2, Search, X, Shield, Fuel, Calendar, ClipboardList, Euro, History } from 'lucide-react'

export default function Vehicles() {
  const { isAdmin } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [reservations, setReservations] = useState([])
  const [filteredVehicles, setFilteredVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailVehicle, setDetailVehicle] = useState(null)

  const openDetailModal = (vehicle) => {
    setDetailVehicle(vehicle)
    setShowDetailModal(true)
  }

  const closeDetailModal = () => {
    setDetailVehicle(null)
    setShowDetailModal(false)
  }

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    filterVehicles()
  }, [vehicles, searchTerm, filterStatus])

  const loadVehicles = async () => {
    try {
      const [vehiclesData, reservationsData] = await Promise.all([
        api.get('/vehicles'),
        api.get('/reservations')
      ])
      setReservations(reservationsData)
      
      const vehiclesWithStatus = vehiclesData.map(vehicle => ({
        ...vehicle,
        displayStatus: getVehicleStatus(vehicle, reservationsData)
      }))
      
      setVehicles(vehiclesWithStatus)
    } catch (error) {
      console.error('Error loading vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVehicleStatus = (vehicle, reservationsList) => {
    if (vehicle.status === 'maintenance' || vehicle.status === 'unavailable') {
      return vehicle.status
    }

    const now = new Date()
    const activeReservation = reservationsList.find(reservation => {
      if (reservation.vehicle_id !== vehicle.id) return false
      if (reservation.status !== 'approved' && reservation.status !== 'active') return false
      
      const startDate = new Date(reservation.start_date)
      const endDate = new Date(reservation.end_date)
      
      return startDate <= now && endDate >= now
    })

    return activeReservation ? 'reserved' : vehicle.status
  }

  const filterVehicles = () => {
    let filtered = vehicles

    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((v) => v.displayStatus === filterStatus)
    }

    setFilteredVehicles(filtered)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return

    try {
      await api.delete(`/vehicles/${id}`)
      loadVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
    }
  }

  const openModal = (vehicle = null) => {
    setEditingVehicle(vehicle)
    setShowModal(true)
  }

  const closeModal = () => {
    setEditingVehicle(null)
    setShowModal(false)
  }

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    maintenance: 'bg-red-100 text-red-800',
    unavailable: 'bg-gray-100 text-gray-800',
  }

  const statusLabels = {
    available: 'Disponible',
    reserved: 'Réservé',
    maintenance: 'Maintenance',
    unavailable: 'Indisponible',
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
          <h1 className="text-3xl font-bold text-gray-900">Véhicules</h1>
          <p className="mt-2 text-gray-600">Gérez la flotte de véhicules</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => openModal()}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un véhicule
          </button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par marque, modèle ou plaque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="all">Tous les statuts</option>
            <option value="available">Disponible</option>
            <option value="reserved">Réservé</option>
            <option value="maintenance">Maintenance</option>
            <option value="unavailable">Indisponible</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openDetailModal(vehicle)}>
            <div className="h-48 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
              <Car className="h-24 w-24 text-primary" />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-sm text-gray-500">{vehicle.year}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[vehicle.displayStatus]}`}>
                  {statusLabels[vehicle.displayStatus]}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p>
                  <span className="font-medium">Plaque:</span> {vehicle.license_plate}
                </p>
                <p>
                  <span className="font-medium">Type:</span> {vehicle.type}
                </p>
                <p>
                  <span className="font-medium">Places:</span> {vehicle.seats}
                </p>
                <p>
                  <span className="font-medium">Kilométrage:</span> {vehicle.mileage?.toLocaleString()} km
                </p>
              </div>
              {isAdmin() && (
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openModal(vehicle) }}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(vehicle.id) }}
                    className="inline-flex items-center justify-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <Car className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun véhicule</h3>
          <p className="mt-1 text-sm text-gray-500">Commencez par ajouter un véhicule à la flotte.</p>
        </div>
      )}

      {showModal && (
        <VehicleModal
          vehicle={editingVehicle}
          onClose={closeModal}
          onSave={() => {
            loadVehicles()
            closeModal()
          }}
        />
      )}

      {showDetailModal && detailVehicle && (
        <VehicleDetailModal
          vehicle={detailVehicle}
          isAdmin={isAdmin()}
          onClose={closeDetailModal}
          onUpdate={() => {
            loadVehicles()
          }}
        />
      )}
    </div>
  )
}

function VehicleModal({ vehicle, onClose, onSave }) {
  const [formData, setFormData] = useState(
    vehicle || {
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      license_plate: '',
      vin: '',
      status: 'available',
      type: 'sedan',
      fuel_type: 'gasoline',
      seats: 5,
      mileage: 0,
      color: '',
      notes: '',
      maintenance_up_to_date: true,
    }
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (vehicle) {
        await api.put(`/vehicles/${vehicle.id}`, formData)
      } else {
        await api.post('/vehicles', formData)
      }
      onSave()
    } catch (error) {
      console.error('Error saving vehicle:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {vehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Marque</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Modèle</label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Année</label>
              <input
                type="number"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Plaque d'immatriculation</label>
              <input
                type="text"
                required
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="sedan">Berline</option>
                <option value="suv">SUV</option>
                <option value="van">Van</option>
                <option value="truck">Camion</option>
                <option value="electric">Électrique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Carburant</label>
              <select
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="gasoline">Essence</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Électrique</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Places</label>
              <input
                type="number"
                value={formData.seats}
                onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kilométrage</label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="available">Disponible</option>
                <option value="reserved">Réservé</option>
                <option value="maintenance">Maintenance</option>
                <option value="unavailable">Indisponible</option>
              </select>
            </div>
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

          {!vehicle && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.maintenance_up_to_date}
                  onChange={(e) => setFormData({ ...formData, maintenance_up_to_date: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  La maintenance est à jour
                </span>
              </label>
              <p className="mt-1 ml-6 text-xs text-gray-500">
                {formData.maintenance_up_to_date
                  ? 'Aucune alerte de maintenance ou pneumatiques ne sera générée pour le kilométrage actuel.'
                  : 'Des alertes seront générées si le kilométrage dépasse les seuils de maintenance.'}
              </p>
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
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function VehicleDetailModal({ vehicle, isAdmin, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('info')
  const [fuelCosts, setFuelCosts] = useState([])
  const [reservationHistory, setReservationHistory] = useState([])
  const [loadingFuel, setLoadingFuel] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detailData, setDetailData] = useState({
    insurance_provider: vehicle.insurance_provider || '',
    insurance_policy_number: vehicle.insurance_policy_number || '',
    insurance_expiry_date: vehicle.insurance_expiry_date || '',
    last_technical_inspection: vehicle.last_technical_inspection || '',
  })

  useEffect(() => {
    if (activeTab === 'fuel') {
      loadFuelCosts()
    }
    if (activeTab === 'history') {
      loadReservationHistory()
    }
  }, [activeTab])

  const loadReservationHistory = async () => {
    setLoadingHistory(true)
    try {
      const data = await api.get(`/reservations/vehicle/${vehicle.id}`)
      setReservationHistory(data)
    } catch (error) {
      console.error('Error loading reservation history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadFuelCosts = async () => {
    setLoadingFuel(true)
    try {
      const data = await api.get(`/fuel-costs/vehicle/${vehicle.id}`)
      setFuelCosts(data)
    } catch (error) {
      console.error('Error loading fuel costs:', error)
    } finally {
      setLoadingFuel(false)
    }
  }

  const handleSaveDetails = async () => {
    setSaving(true)
    try {
      await api.put(`/vehicles/${vehicle.id}`, detailData)
      onUpdate()
      alert('Informations mises à jour')
    } catch (error) {
      console.error('Error saving vehicle details:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFuelCost = async (id) => {
    if (!window.confirm('Supprimer cette entrée ?')) return
    try {
      await api.delete(`/fuel-costs/${id}`)
      loadFuelCosts()
    } catch (error) {
      console.error('Error deleting fuel cost:', error)
    }
  }

  const fuelTypeLabels = {
    gasoline: 'Essence',
    diesel: 'Diesel',
    electric: 'Électrique',
    hybrid: 'Hybride',
  }

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    maintenance: 'bg-red-100 text-red-800',
    unavailable: 'bg-gray-100 text-gray-800',
  }

  const statusLabels = {
    available: 'Disponible',
    reserved: 'Réservé',
    maintenance: 'Maintenance',
    unavailable: 'Indisponible',
  }

  const tabs = [
    { id: 'info', label: 'Informations', icon: Car },
    { id: 'insurance', label: 'Assurance', icon: Shield },
    { id: 'inspection', label: 'Contrôle technique', icon: ClipboardList },
    { id: 'fuel', label: 'Historique carburant', icon: Fuel },
    { id: 'history', label: 'Historique locations', icon: History },
  ]

  const totalFuelCost = fuelCosts.reduce((sum, fc) => sum + parseFloat(fc.amount || 0), 0)

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 bg-primary-100 rounded-lg flex items-center justify-center">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {vehicle.brand} {vehicle.model}
              </h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-gray-500">{vehicle.license_plate}</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[vehicle.displayStatus || vehicle.status]}`}>
                  {statusLabels[vehicle.displayStatus || vehicle.status]}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-4">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {activeTab === 'info' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase">Marque / Modèle</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.brand} {vehicle.model}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase">Année</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.year}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase">Plaque</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.license_plate}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase">Carburant</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{fuelTypeLabels[vehicle.fuel_type] || vehicle.fuel_type}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase">Type</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.type}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase">Places</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.seats}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase">Kilométrage</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.mileage?.toLocaleString()} km</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase">Couleur</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.color || '—'}</p>
            </div>
            {vehicle.vin && (
              <div className="col-span-2 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase">VIN</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.vin}</p>
              </div>
            )}
            {vehicle.notes && (
              <div className="col-span-2 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase">Notes</p>
                <p className="mt-1 text-sm text-gray-900">{vehicle.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insurance' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Assureur</label>
              <input
                type="text"
                value={detailData.insurance_provider}
                onChange={(e) => setDetailData({ ...detailData, insurance_provider: e.target.value })}
                disabled={!isAdmin}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ex: MAIF, AXA, Allianz..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Numéro de police</label>
              <input
                type="text"
                value={detailData.insurance_policy_number}
                onChange={(e) => setDetailData({ ...detailData, insurance_policy_number: e.target.value })}
                disabled={!isAdmin}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Numéro de contrat"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date d'expiration</label>
              <input
                type="date"
                value={detailData.insurance_expiry_date}
                onChange={(e) => setDetailData({ ...detailData, insurance_expiry_date: e.target.value })}
                disabled={!isAdmin}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            {detailData.insurance_expiry_date && (
              <div className={`p-4 rounded-lg ${
                new Date(detailData.insurance_expiry_date) < new Date()
                  ? 'bg-red-50 border border-red-200'
                  : new Date(detailData.insurance_expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-green-50 border border-green-200'
              }`}>
                <p className={`text-sm font-medium ${
                  new Date(detailData.insurance_expiry_date) < new Date()
                    ? 'text-red-800'
                    : new Date(detailData.insurance_expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      ? 'text-yellow-800'
                      : 'text-green-800'
                }`}>
                  {new Date(detailData.insurance_expiry_date) < new Date()
                    ? '⚠️ Assurance expirée !'
                    : new Date(detailData.insurance_expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      ? '⚠️ Assurance expire bientôt'
                      : '✅ Assurance valide'}
                </p>
              </div>
            )}
            {isAdmin && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveDetails}
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inspection' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date du dernier contrôle technique</label>
              <input
                type="date"
                value={detailData.last_technical_inspection}
                onChange={(e) => setDetailData({ ...detailData, last_technical_inspection: e.target.value })}
                disabled={!isAdmin}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            {detailData.last_technical_inspection && (() => {
              const lastDate = new Date(detailData.last_technical_inspection)
              const nextDate = new Date(lastDate)
              nextDate.setFullYear(nextDate.getFullYear() + 2)
              const now = new Date()
              const daysUntil = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24))
              const isExpired = daysUntil < 0
              const isExpiringSoon = daysUntil >= 0 && daysUntil <= 60

              return (
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase">Prochain contrôle technique</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {nextDate.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isExpired
                      ? 'bg-red-50 border border-red-200'
                      : isExpiringSoon
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-green-50 border border-green-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      isExpired ? 'text-red-800' : isExpiringSoon ? 'text-yellow-800' : 'text-green-800'
                    }`}>
                      {isExpired
                        ? `⚠️ Contrôle technique expiré depuis ${Math.abs(daysUntil)} jours !`
                        : isExpiringSoon
                          ? `⚠️ Contrôle technique dans ${daysUntil} jours`
                          : `✅ Contrôle technique valide (${daysUntil} jours restants)`}
                    </p>
                  </div>
                </div>
              )
            })()}
            {isAdmin && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveDetails}
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fuel' && (
          <div>
            {loadingFuel ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {fuelCosts.length > 0 && (
                  <div className="mb-4 p-4 bg-primary-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Euro className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-gray-700">Coût total carburant :</span>
                    </div>
                    <span className="text-lg font-bold text-primary">{totalFuelCost.toFixed(2)} €</span>
                  </div>
                )}
                {fuelCosts.length === 0 ? (
                  <div className="text-center py-12">
                    <Fuel className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun historique de carburant</h3>
                    <p className="mt-1 text-sm text-gray-500">Les coûts de carburant seront ajoutés lors du retour des véhicules.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Litres</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Km</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                          {isAdmin && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fuelCosts.map((fc) => (
                          <tr key={fc.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(fc.date).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {parseFloat(fc.amount).toFixed(2)} €
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {fc.liters ? `${parseFloat(fc.liters).toFixed(1)} L` : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {fc.mileage_at_fill ? `${fc.mileage_at_fill.toLocaleString()} km` : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {fc.profiles?.full_name || fc.profiles?.email || '—'}
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleDeleteFuelCost(fc.id)}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {loadingHistory ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : reservationHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune location</h3>
                <p className="mt-1 text-sm text-gray-500">Ce véhicule n'a pas encore été réservé.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 p-4 bg-primary-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total de réservations :</span>
                  <span className="text-lg font-bold text-primary">{reservationHistory.length}</span>
                </div>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Début</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motif</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reservationHistory.map((r) => {
                        const statusMap = {
                          pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
                          approved: { label: 'Approuvée', color: 'bg-blue-100 text-blue-800' },
                          active: { label: 'En cours', color: 'bg-green-100 text-green-800' },
                          completed: { label: 'Terminée', color: 'bg-gray-100 text-gray-800' },
                          cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
                        }
                        const st = statusMap[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-800' }
                        return (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {r.profiles?.full_name || r.profiles?.email || '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(r.start_date).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(r.end_date).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${st.color}`}>
                                {st.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {r.purpose || '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
