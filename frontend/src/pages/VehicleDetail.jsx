import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Car, ArrowLeft, Shield, Fuel, Calendar, ClipboardList, Euro, History, Wrench, Trash2, Edit, CreditCard, CheckCircle, XCircle, UserPlus, UserMinus, User } from 'lucide-react'

export default function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin } = useAuth()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'info')
  const [fuelCosts, setFuelCosts] = useState([])
  const [reservationHistory, setReservationHistory] = useState([])
  const [maintenanceHistory, setMaintenanceHistory] = useState([])
  const [loadingFuel, setLoadingFuel] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingMaintenance, setLoadingMaintenance] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastFuelInfo, setLastFuelInfo] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [detailData, setDetailData] = useState({
    insurance_provider: '',
    insurance_policy_number: '',
    insurance_expiry_date: '',
    last_technical_inspection: '',
  })

  useEffect(() => {
    loadVehicle()
    if (isAdmin()) loadProfiles()
  }, [id])

  useEffect(() => {
    if (!vehicle) return
    if (!isAdmin()) {
      loadLastFuelInfo()
    }
    if (activeTab === 'fuel' || activeTab === 'costs') loadFuelCosts()
    if (activeTab === 'history') loadReservationHistory()
    if (activeTab === 'maintenance' || activeTab === 'costs') loadMaintenanceHistory()
  }, [activeTab, vehicle])

  const loadLastFuelInfo = async () => {
    try {
      const data = await api.get(`/reservations/vehicle/${id}`)
      const completed = data.filter(r => r.status === 'completed' && r.notes)
      if (completed.length > 0) {
        const last = completed[0]
        const essenceMatch = last.notes.match(/Essence:\s*([^,]+)/)
        const batterieMatch = last.notes.match(/Batterie:\s*([^,]+)/)
        setLastFuelInfo({
          fuel: essenceMatch ? essenceMatch[1].trim() : null,
          battery: batterieMatch ? batterieMatch[1].trim() : null,
          date: last.end_date,
        })
      }
    } catch (error) {
      console.error('Error loading last fuel info:', error)
    }
  }

  const loadVehicle = async () => {
    try {
      const vehicles = await api.get('/vehicles')
      const found = vehicles.find(v => v.id === id)
      if (found) {
        setVehicle(found)
        setDetailData({
          insurance_provider: found.insurance_provider || '',
          insurance_policy_number: found.insurance_policy_number || '',
          insurance_expiry_date: found.insurance_expiry_date || '',
          last_technical_inspection: found.last_technical_inspection || '',
        })
      }
    } catch (error) {
      console.error('Error loading vehicle:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProfiles = async () => {
    try {
      const data = await api.get('/profiles')
      setProfiles(data)
    } catch (error) {
      console.error('Error loading profiles:', error)
    }
  }

  const handleAssign = async () => {
    if (!selectedUserId) return
    setAssigning(true)
    try {
      await api.put(`/vehicles/${id}/assign`, { user_id: selectedUserId })
      setSelectedUserId('')
      await loadVehicle()
    } catch (error) {
      console.error('Error assigning vehicle:', error)
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassign = async () => {
    setAssigning(true)
    try {
      await api.put(`/vehicles/${id}/assign`, { user_id: null })
      await loadVehicle()
    } catch (error) {
      console.error('Error unassigning vehicle:', error)
    } finally {
      setAssigning(false)
    }
  }

  const loadFuelCosts = async () => {
    if (fuelCosts.length > 0) return
    setLoadingFuel(true)
    try {
      const data = await api.get(`/fuel-costs/vehicle/${id}`)
      setFuelCosts(data)
    } catch (error) {
      console.error('Error loading fuel costs:', error)
    } finally {
      setLoadingFuel(false)
    }
  }

  const loadReservationHistory = async () => {
    if (reservationHistory.length > 0) return
    setLoadingHistory(true)
    try {
      const data = await api.get(`/reservations/vehicle/${id}`)
      setReservationHistory(data)
    } catch (error) {
      console.error('Error loading reservation history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadMaintenanceHistory = async () => {
    if (maintenanceHistory.length > 0) return
    setLoadingMaintenance(true)
    try {
      const data = await api.get(`/maintenance/vehicle/${id}`)
      setMaintenanceHistory(data)
    } catch (error) {
      console.error('Error loading maintenance history:', error)
    } finally {
      setLoadingMaintenance(false)
    }
  }

  const handleSaveDetails = async () => {
    setSaving(true)
    try {
      await api.put(`/vehicles/${id}`, detailData)
      loadVehicle()
    } catch (error) {
      console.error('Error saving vehicle details:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFuelCost = async (fcId) => {
    if (!window.confirm('Supprimer cette entrée ?')) return
    try {
      await api.delete(`/fuel-costs/${fcId}`)
      setFuelCosts([])
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

  const maintenanceStatusColors = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const maintenanceStatusLabels = {
    scheduled: 'Planifiée',
    in_progress: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
  }

  const maintenanceTypeLabels = {
    routine: 'Entretien',
    repair: 'Réparation',
    inspection: 'Inspection',
    other: 'Autre',
  }

  const tabs = [
    { id: 'info', label: 'Informations', icon: Car },
    { id: 'insurance', label: 'Assurance', icon: Shield },
    { id: 'inspection', label: 'Contrôle technique', icon: ClipboardList },
    { id: 'fuel', label: 'Carburant', icon: Fuel },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'history', label: 'Locations', icon: History },
    { id: 'costs', label: 'Coût total', icon: CreditCard },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <Car className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Véhicule introuvable</h3>
        <button onClick={() => navigate('/dashboard/vehicles')} className="mt-4 text-primary hover:text-primary-600 text-sm font-medium">
          Retour aux véhicules
        </button>
      </div>
    )
  }

  const totalFuelCost = fuelCosts.reduce((sum, fc) => sum + parseFloat(fc.amount || 0), 0)
  const totalMaintenanceCost = maintenanceHistory.reduce((sum, m) => sum + parseFloat(m.cost || 0), 0)
  const grandTotal = totalFuelCost + totalMaintenanceCost

  const insuranceValid = detailData.insurance_expiry_date
    ? new Date(detailData.insurance_expiry_date) >= new Date()
    : null

  const inspectionValid = detailData.last_technical_inspection
    ? (() => {
        const next = new Date(detailData.last_technical_inspection)
        next.setFullYear(next.getFullYear() + 2)
        return next >= new Date()
      })()
    : null

  // Employee simplified view
  if (!isAdmin()) {
    return (
      <div className="px-4 sm:px-0">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard/vehicles')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour aux véhicules
          </button>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-primary-100 rounded-xl flex items-center justify-center">
              <Car className="h-9 w-9 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {vehicle.brand} {vehicle.model}
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-gray-500">{vehicle.license_plate}</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-500">{vehicle.year}</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[vehicle.displayStatus || vehicle.status]}`}>
                  {statusLabels[vehicle.displayStatus || vehicle.status]}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vehicle Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Car className="h-5 w-5 text-primary mr-2" />
              Informations
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase">Marque / Modèle</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.brand} {vehicle.model}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase">Année</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.year}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase">Plaque</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.license_plate}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase">Carburant</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{fuelTypeLabels[vehicle.fuel_type] || vehicle.fuel_type}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase">Type</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.type}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase">Places</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.seats}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase">Kilométrage</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.mileage?.toLocaleString()} km</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase">Couleur</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.color || '—'}</p>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="space-y-4">
            {/* Insurance Status */}
            <div className={`bg-white shadow rounded-lg p-6 border-l-4 ${
              insuranceValid === null ? 'border-gray-300' : insuranceValid ? 'border-green-500' : 'border-red-500'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className={`h-6 w-6 ${
                    insuranceValid === null ? 'text-gray-400' : insuranceValid ? 'text-green-500' : 'text-red-500'
                  }`} />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Assurance</h3>
                    <p className="text-xs text-gray-500">
                      {insuranceValid === null
                        ? 'Non renseignée'
                        : insuranceValid
                          ? `Valide jusqu'au ${new Date(detailData.insurance_expiry_date).toLocaleDateString('fr-FR')}`
                          : `Expirée le ${new Date(detailData.insurance_expiry_date).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                </div>
                {insuranceValid !== null && (
                  insuranceValid
                    ? <CheckCircle className="h-6 w-6 text-green-500" />
                    : <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
            </div>

            {/* Technical Inspection Status */}
            <div className={`bg-white shadow rounded-lg p-6 border-l-4 ${
              inspectionValid === null ? 'border-gray-300' : inspectionValid ? 'border-green-500' : 'border-red-500'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ClipboardList className={`h-6 w-6 ${
                    inspectionValid === null ? 'text-gray-400' : inspectionValid ? 'text-green-500' : 'text-red-500'
                  }`} />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Contrôle technique</h3>
                    <p className="text-xs text-gray-500">
                      {inspectionValid === null
                        ? 'Non renseigné'
                        : (() => {
                            const next = new Date(detailData.last_technical_inspection)
                            next.setFullYear(next.getFullYear() + 2)
                            return inspectionValid
                              ? `Valide jusqu'au ${next.toLocaleDateString('fr-FR')}`
                              : `Expiré le ${next.toLocaleDateString('fr-FR')}`
                          })()}
                    </p>
                  </div>
                </div>
                {inspectionValid !== null && (
                  inspectionValid
                    ? <CheckCircle className="h-6 w-6 text-green-500" />
                    : <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
            </div>

            {/* Last Fuel Level */}
            <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center space-x-3">
                <Fuel className="h-6 w-6 text-blue-500" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Dernier état du réservoir</h3>
                  {lastFuelInfo ? (
                    <div className="mt-1">
                      {lastFuelInfo.fuel && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Essence :</span> {lastFuelInfo.fuel}
                        </p>
                      )}
                      {lastFuelInfo.battery && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Batterie :</span> {lastFuelInfo.battery}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Déclaré le {new Date(lastFuelInfo.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Aucune information disponible</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Admin full view
  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/vehicles')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour aux véhicules
        </button>
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-primary-100 rounded-xl flex items-center justify-center">
            <Car className="h-9 w-9 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {vehicle.brand} {vehicle.model}
            </h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-sm text-gray-500">{vehicle.license_plate}</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-500">{vehicle.year}</span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[vehicle.displayStatus || vehicle.status]}`}>
                {statusLabels[vehicle.displayStatus || vehicle.status]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-1 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center whitespace-nowrap px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
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

        <div className="p-6">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase">VIN</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{vehicle.vin}</p>
                </div>
              )}
              {vehicle.notes && (
                <div className="col-span-2 md:col-span-3 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase">Notes</p>
                  <p className="mt-1 text-sm text-gray-900">{vehicle.notes}</p>
                </div>
              )}

              {/* Vehicle Assignment */}
              {isAdmin() && (
                <div className="col-span-2 md:col-span-3 mt-2 p-4 bg-white border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="h-4 w-4 text-primary mr-2" />
                    Attribution du véhicule
                  </h3>
                  {vehicle.assigned_user_id ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {vehicle.assigned_user?.full_name || vehicle.assigned_user?.email || 'Utilisateur'}
                          </p>
                          {vehicle.assigned_user?.full_name && (
                            <p className="text-xs text-gray-500">{vehicle.assigned_user.email}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleUnassign}
                        disabled={assigning}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        {assigning ? 'En cours...' : 'Retirer'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary text-sm"
                      >
                        <option value="">Sélectionner un utilisateur</option>
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name || p.email}{p.role === 'admin' ? ' (Admin)' : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssign}
                        disabled={!selectedUserId || assigning}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-600 disabled:opacity-50"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {assigning ? 'En cours...' : 'Attribuer'}
                      </button>
                    </div>
                  )}
                  {vehicle.assigned_user_id && (
                    <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded">
                      Ce véhicule est attribué et n'apparaît plus dans la liste des véhicules disponibles à la location.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Insurance Tab */}
          {activeTab === 'insurance' && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700">Assureur</label>
                <input
                  type="text"
                  value={detailData.insurance_provider}
                  onChange={(e) => setDetailData({ ...detailData, insurance_provider: e.target.value })}
                  disabled={!isAdmin()}
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
                  disabled={!isAdmin()}
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
                  disabled={!isAdmin()}
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
                      ? 'Assurance expirée !'
                      : new Date(detailData.insurance_expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        ? 'Assurance expire bientôt'
                        : 'Assurance valide'}
                  </p>
                </div>
              )}
              {isAdmin() && (
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

          {/* Inspection Tab */}
          {activeTab === 'inspection' && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date du dernier contrôle technique</label>
                <input
                  type="date"
                  value={detailData.last_technical_inspection}
                  onChange={(e) => setDetailData({ ...detailData, last_technical_inspection: e.target.value })}
                  disabled={!isAdmin()}
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
                          ? `Contrôle technique expiré depuis ${Math.abs(daysUntil)} jours !`
                          : isExpiringSoon
                            ? `Contrôle technique dans ${daysUntil} jours`
                            : `Contrôle technique valide (${daysUntil} jours restants)`}
                      </p>
                    </div>
                  </div>
                )
              })()}
              {isAdmin() && (
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

          {/* Fuel Tab */}
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
                            {isAdmin() && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
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
                              {isAdmin() && (
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

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div>
              {loadingMaintenance ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : maintenanceHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune maintenance</h3>
                  <p className="mt-1 text-sm text-gray-500">Aucune maintenance enregistrée pour ce véhicule.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-primary-50 rounded-lg flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Total maintenances :</span>
                      <span className="text-lg font-bold text-primary">{maintenanceHistory.length}</span>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Euro className="h-5 w-5 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700">Coût total :</span>
                      </div>
                      <span className="text-lg font-bold text-orange-600">{totalMaintenanceCost.toFixed(2)} €</span>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date prévue</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date fin</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coût</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prestataire</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {maintenanceHistory.map((m) => (
                          <tr key={m.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {maintenanceTypeLabels[m.type] || m.type}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                              {m.description}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(m.scheduled_date).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {m.completed_date ? new Date(m.completed_date).toLocaleDateString('fr-FR') : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${maintenanceStatusColors[m.status]}`}>
                                {maintenanceStatusLabels[m.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {m.cost ? `${parseFloat(m.cost).toFixed(2)} €` : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {m.provider || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Reservation History Tab */}
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

          {/* Total Cost Tab */}
          {activeTab === 'costs' && (
            <div>
              {(loadingFuel || loadingMaintenance) ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <Fuel className="h-4 w-4 text-blue-500" />
                        <p className="text-xs font-medium text-blue-600 uppercase">Carburant</p>
                      </div>
                      <p className="text-xl font-bold text-blue-900">{totalFuelCost.toFixed(2)} €</p>
                      <p className="text-xs text-blue-600 mt-1">{fuelCosts.length} plein(s)</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <Wrench className="h-4 w-4 text-orange-500" />
                        <p className="text-xs font-medium text-orange-600 uppercase">Maintenance</p>
                      </div>
                      <p className="text-xl font-bold text-orange-900">{totalMaintenanceCost.toFixed(2)} €</p>
                      <p className="text-xs text-orange-600 mt-1">{maintenanceHistory.filter(m => m.cost).length} intervention(s)</p>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="p-6 bg-gradient-to-r from-primary to-blue-600 rounded-xl text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white text-opacity-80">Coût total d'utilisation</p>
                        <p className="text-3xl font-bold mt-1">{grandTotal.toFixed(2)} €</p>
                      </div>
                      <CreditCard className="h-12 w-12 text-white text-opacity-30" />
                    </div>
                  </div>

                  {/* Breakdown Table */}
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% du total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 flex items-center space-x-2">
                            <Fuel className="h-4 w-4 text-blue-500" />
                            <span>Carburant</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{totalFuelCost.toFixed(2)} €</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{grandTotal > 0 ? ((totalFuelCost / grandTotal) * 100).toFixed(1) : 0} %</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 flex items-center space-x-2">
                            <Wrench className="h-4 w-4 text-orange-500" />
                            <span>Maintenance</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{totalMaintenanceCost.toFixed(2)} €</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{grandTotal > 0 ? ((totalMaintenanceCost / grandTotal) * 100).toFixed(1) : 0} %</td>
                        </tr>
                        <tr className="bg-gray-50 font-bold">
                          <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{grandTotal.toFixed(2)} €</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">100 %</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
