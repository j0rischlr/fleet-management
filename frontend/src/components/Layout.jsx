import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Car, Calendar, Wrench, LayoutDashboard, LogOut, User, Bell, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Layout() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState({ pending: 0, maintenance: 0, alerts: 0 })
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    if (isAdmin()) {
      loadNotifications()
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [isAdmin])

  const loadNotifications = async () => {
    try {
      const [reservations, maintenance, alerts] = await Promise.all([
        api.get('/reservations'),
        api.get('/maintenance'),
        api.get('/maintenance-alerts')
      ])

      const pendingReservations = reservations.filter(r => r.status === 'pending').length
      const pendingMaintenance = maintenance.filter(m => m.status === 'scheduled').length
      const urgentAlerts = alerts.filter(a => a.priority === 'urgent' || a.priority === 'high').length

      setNotifications({
        pending: pendingReservations,
        maintenance: pendingMaintenance,
        alerts: urgentAlerts
      })
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Véhicules', href: '/vehicles', icon: Car },
    { name: 'Réservations', href: '/reservations', icon: Calendar },
  ]

  if (isAdmin()) {
    navigation.push({ name: 'Maintenance', href: '/maintenance', icon: Wrench })
    navigation.push({ name: 'Alertes', href: '/maintenance-alerts', icon: AlertTriangle })
  }

  const totalNotifications = notifications.pending + notifications.maintenance + notifications.alerts

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Car className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Fleet Manager</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin() && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <Bell className="h-6 w-6" />
                    {totalNotifications > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {totalNotifications}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowNotifications(false)}
                      />
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="p-4 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {totalNotifications === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p>Aucune notification</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {notifications.pending > 0 && (
                                <Link
                                  to="/reservations"
                                  onClick={() => setShowNotifications(false)}
                                  className="block p-4 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                      <Calendar className="h-6 w-6 text-yellow-500" />
                                    </div>
                                    <div className="ml-3 flex-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        Réservations en attente
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {notifications.pending} réservation{notifications.pending > 1 ? 's' : ''} à approuver
                                      </p>
                                    </div>
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      {notifications.pending}
                                    </span>
                                  </div>
                                </Link>
                              )}
                              {notifications.maintenance > 0 && (
                                <Link
                                  to="/maintenance"
                                  onClick={() => setShowNotifications(false)}
                                  className="block p-4 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                      <Wrench className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div className="ml-3 flex-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        Maintenance planifiée
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {notifications.maintenance} maintenance{notifications.maintenance > 1 ? 's' : ''} à venir
                                      </p>
                                    </div>
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                      {notifications.maintenance}
                                    </span>
                                  </div>
                                </Link>
                              )}
                              {notifications.alerts > 0 && (
                                <Link
                                  to="/maintenance-alerts"
                                  onClick={() => setShowNotifications(false)}
                                  className="block p-4 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                      <AlertTriangle className="h-6 w-6 text-red-500" />
                                    </div>
                                    <div className="ml-3 flex-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        Alertes de maintenance
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {notifications.alerts} alerte{notifications.alerts > 1 ? 's' : ''} urgente{notifications.alerts > 1 ? 's' : ''}
                                      </p>
                                    </div>
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      {notifications.alerts}
                                    </span>
                                  </div>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{profile?.full_name || user?.email}</div>
                  <div className="text-gray-500 capitalize">{profile?.role}</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
