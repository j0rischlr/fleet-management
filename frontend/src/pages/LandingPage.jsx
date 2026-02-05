import { Link } from 'react-router-dom'
import { Car, Calendar, Wrench, BarChart3, Shield, Clock, ArrowRight, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: Car,
      title: 'Gestion de flotte',
      description: 'Gérez tous vos véhicules en un seul endroit avec un suivi en temps réel.'
    },
    {
      icon: Calendar,
      title: 'Réservations simplifiées',
      description: 'Système de réservation intuitif avec calendrier visuel et validation automatique.'
    },
    {
      icon: Wrench,
      title: 'Maintenance intelligente',
      description: 'Alertes automatiques basées sur le kilométrage et le temps pour ne rien manquer.'
    },
    {
      icon: BarChart3,
      title: 'Tableaux de bord',
      description: 'Visualisez vos données et prenez des décisions éclairées instantanément.'
    },
    {
      icon: Shield,
      title: 'Sécurisé',
      description: 'Vos données sont protégées avec les dernières technologies de sécurité.'
    },
    {
      icon: Clock,
      title: 'Gain de temps',
      description: 'Automatisez vos processus et concentrez-vous sur l\'essentiel.'
    }
  ]

  const benefits = [
    'Réduction des coûts de maintenance',
    'Optimisation de l\'utilisation des véhicules',
    'Suivi en temps réel de votre flotte',
    'Rapports détaillés et analyses',
    'Interface intuitive et moderne',
    'Support client réactif'
  ]

  return (
    <div className="min-h-screen bg-[#faf3f2]">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-[#c05c4f]" />
              <span className="text-2xl font-bold text-[#0d0604]">FleetManager</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-[#0d0604] hover:text-[#c05c4f] transition-colors"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 text-sm font-medium text-white bg-[#c05c4f] rounded-lg hover:bg-[#a84d41] transition-colors shadow-md"
              >
                Commencer
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-[#0d0604] mb-6">
              Gérez votre flotte automobile
              <span className="block text-[#c05c4f] mt-2">en toute simplicité</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              La solution complète pour optimiser la gestion de vos véhicules, 
              planifier les maintenances et coordonner les réservations.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-[#c05c4f] rounded-lg hover:bg-[#a84d41] transition-colors shadow-lg"
              >
                Démarrer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 text-lg font-medium text-[#0d0604] bg-white border-2 border-[#c05c4f] rounded-lg hover:bg-gray-50 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-[#cdce74] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-[#d8c692] rounded-full opacity-10 blur-3xl"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0d0604] mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600">
              Des fonctionnalités puissantes pour une gestion efficace
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-[#faf3f2] rounded-xl hover:shadow-lg transition-shadow border border-gray-200"
              >
                <div className="w-12 h-12 bg-[#c05c4f] rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#0d0604] mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-[#faf3f2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[#0d0604] mb-6">
                Pourquoi choisir FleetManager ?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Notre plateforme vous aide à optimiser la gestion de votre flotte 
                avec des outils modernes et une interface intuitive.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#c05c4f] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-[#faf3f2] rounded-lg">
                    <div className="w-12 h-12 bg-[#cdce74] rounded-full flex items-center justify-center">
                      <Car className="h-6 w-6 text-[#0d0604]" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-[#faf3f2] rounded-lg">
                    <div className="w-12 h-12 bg-[#d8c692] rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-[#0d0604]" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-[#faf3f2] rounded-lg">
                    <div className="w-12 h-12 bg-[#c05c4f] rounded-full flex items-center justify-center">
                      <Wrench className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-4/5 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/5"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#cdce74] rounded-full opacity-20 blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-[#0d0604] mb-6">
            Prêt à optimiser votre flotte ?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Rejoignez les entreprises qui font confiance à FleetManager pour gérer leurs véhicules.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-[#c05c4f] rounded-lg hover:bg-[#a84d41] transition-colors shadow-lg"
          >
            Commencer maintenant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d0604] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Car className="h-6 w-6 text-[#c05c4f]" />
                <span className="text-xl font-bold">FleetManager</span>
              </div>
              <p className="text-gray-400">
                La solution moderne pour gérer votre flotte automobile en toute simplicité.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-[#c05c4f] transition-colors">
                    Connexion
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-[#c05c4f] transition-colors">
                    Inscription
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">
                Une question ? Contactez-nous pour en savoir plus sur FleetManager.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 FleetManager. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
