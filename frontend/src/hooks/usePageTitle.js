import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/': 'Accueil',
  '/login': 'Connexion',
  '/register': 'Inscription',
  '/reset-password': 'Réinitialisation du mot de passe',
  '/dashboard': 'Tableau de bord',
  '/dashboard/vehicles': 'Véhicules',
  '/dashboard/reservations': 'Réservations',
  '/dashboard/maintenance': 'Maintenance',
  '/dashboard/maintenance-alerts': 'Alertes de maintenance',
}

const APP_NAME = 'Fleet'

export default function usePageTitle() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname

    let title = PAGE_TITLES[path]

    if (!title) {
      if (path.startsWith('/dashboard/vehicles/')) {
        title = 'Détail véhicule'
      } else if (path.startsWith('/garage-booking/')) {
        title = 'Réservation garage'
      }
    }

    document.title = title ? `${title} — ${APP_NAME}` : APP_NAME
  }, [location.pathname])
}
