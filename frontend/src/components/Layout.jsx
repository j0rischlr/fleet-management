import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Car, Calendar, Wrench, LayoutDashboard, LogOut, User, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Layout() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)
  const [userNotifCount, setUserNotifCount] = useState(0)

  useEffect(() => {
    if (isAdmin()) {
      loadNotifications()
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    } else if (user) {
      loadUserNotifications()
      const interval = setInterval(loadUserNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [isAdmin, user])

  useEffect(() => {
    if (!isAdmin() && user && location.pathname === '/dashboard/reservations') {
      markUserNotificationsRead()
    }
  }, [location.pathname, user])

  const loadNotifications = async () => {
    try {
      const reservations = await api.get('/reservations')
      const pendingReservations = reservations.filter(r => r.status === 'pending').length
      setPendingCount(pendingReservations)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const loadUserNotifications = async () => {
    try {
      const result = await api.get(`/reservations/notifications/${user.id}`)
      setUserNotifCount(result.count)
    } catch (error) {
      console.error('Error loading user notifications:', error)
    }
  }

  const markUserNotificationsRead = async () => {
    try {
      await api.put(`/reservations/notifications/${user.id}/read`)
      setUserNotifCount(0)
    } catch (error) {
      console.error('Error marking notifications as read:', error)
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
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Véhicules', href: '/dashboard/vehicles', icon: Car },
    { name: 'Réservations', href: '/dashboard/reservations', icon: Calendar },
  ]

  if (isAdmin()) {
    navigation.push({ name: 'Maintenance', href: '/dashboard/maintenance', icon: Wrench })
    navigation.push({ name: 'Alertes', href: '/dashboard/maintenance-alerts', icon: AlertTriangle })
  }


  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Car className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold text-text">Fleet Manager</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  const showAdminBadge = item.href === '/dashboard/reservations' && isAdmin() && pendingCount > 0
                  const showUserBadge = item.href === '/dashboard/reservations' && !isAdmin() && userNotifCount > 0
                  const showBadge = showAdminBadge || showUserBadge
                  const badgeCount = showAdminBadge ? pendingCount : userNotifCount
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium relative ${
                        isActive
                          ? 'border-primary text-text'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                      {showBadge && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{profile?.full_name || user?.email}</div>
                  <div className="text-gray-500 capitalize">{profile?.role}</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
