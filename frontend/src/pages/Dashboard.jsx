import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Car, Calendar, Wrench, TrendingUp } from 'lucide-react'
import DashboardCalendar from '../components/DashboardCalendar'

export default function Dashboard() {
  const { profile } = useAuth()
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

  useEffect(() => {
    loadStats()
  }, [])

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
        />
      </div>

      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Aperçu rapide</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Taux d'utilisation</p>
              <p className="text-sm text-gray-500">
                {stats.totalVehicles > 0
                  ? Math.round(((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100)
                  : 0}
                % des véhicules sont actuellement utilisés
              </p>
            </div>
          </div>
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
