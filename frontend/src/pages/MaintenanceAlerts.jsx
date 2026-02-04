import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { AlertTriangle, Car, Calendar, Gauge, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function MaintenanceAlerts() {
  const { isAdmin } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterPriority, setFilterPriority] = useState('all')

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const data = await api.get('/maintenance-alerts')
      setAlerts(data)
    } catch (error) {
      console.error('Error loading maintenance alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAlerts = filterPriority === 'all' 
    ? alerts 
    : alerts.filter(a => a.priority === filterPriority)

  const priorityColors = {
    urgent: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    normal: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
  }

  const priorityLabels = {
    urgent: 'Urgent',
    high: 'Élevée',
    normal: 'Normale',
    low: 'Faible',
  }

  const priorityIcons = {
    urgent: 'text-red-600',
    high: 'text-orange-600',
    normal: 'text-yellow-600',
    low: 'text-blue-600',
  }

  const getAlertMessage = (alert) => {
    if (alert.alert_type === 'mileage') {
      const remaining = alert.next_due_value - alert.current_value
      return `${remaining.toLocaleString()} km restants avant maintenance`
    } else {
      const remaining = alert.days_until_due
      if (remaining < 0) {
        return `En retard de ${Math.abs(remaining)} jours`
      }
      return `${remaining} jours restants`
    }
  }

  const getProgressPercentage = (alert) => {
    if (alert.alert_type === 'mileage') {
      const interval = alert.next_due_value - (alert.next_due_value - alert.current_value)
      return Math.min((alert.current_value / alert.next_due_value) * 100, 100)
    } else {
      const totalDays = alert.next_due_value
      const elapsed = totalDays - alert.days_until_due
      return Math.min((elapsed / totalDays) * 100, 100)
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Alertes de Maintenance</h1>
        <p className="mt-2 text-gray-600">
          Rappels automatiques basés sur le kilométrage et le temps
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filtrer par priorité:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Toutes</option>
              <option value="urgent">Urgent</option>
              <option value="high">Élevée</option>
              <option value="normal">Normale</option>
              <option value="low">Faible</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            {filteredAlerts.length} alerte{filteredAlerts.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune alerte de maintenance
          </h3>
          <p className="text-gray-500">
            {filterPriority === 'all' 
              ? 'Tous les véhicules sont à jour dans leur maintenance !'
              : `Aucune alerte avec la priorité "${priorityLabels[filterPriority]}"`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert, index) => {
            const progress = getProgressPercentage(alert)
            return (
              <div
                key={index}
                className={`bg-white shadow rounded-lg border-l-4 ${priorityColors[alert.priority]} overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`flex-shrink-0 ${priorityIcons[alert.priority]}`}>
                        <AlertTriangle className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {alert.rule_name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[alert.priority]}`}>
                            {priorityLabels[alert.priority]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {alert.brand} {alert.model}
                            </span>
                            <span className="text-gray-500">({alert.license_plate})</span>
                          </div>
                          {alert.alert_type === 'mileage' ? (
                            <div className="flex items-center space-x-2">
                              <Gauge className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">
                                {alert.current_value?.toLocaleString()} km / {alert.next_due_value?.toLocaleString()} km
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">
                                {alert.current_value} jours / {alert.next_due_value} jours
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">{getAlertMessage(alert)}</span>
                            <span className="font-medium text-gray-900">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                progress >= 100 ? 'bg-red-600' :
                                progress >= 90 ? 'bg-orange-500' :
                                progress >= 80 ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isAdmin() && (
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <Link
                        to={`/vehicles`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Voir le véhicule
                      </Link>
                      <Link
                        to={`/maintenance`}
                        className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                      >
                        Planifier maintenance
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Règles de maintenance automatiques</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Essence/Diesel:</strong> Maintenance obligatoire tous les 15 000 km</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Électrique:</strong> Révision annuelle obligatoire</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Pneumatiques:</strong> Contrôle tous les 10 000 km (tous types)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Hybride:</strong> Maintenance obligatoire tous les 15 000 km</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
