import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Car, AlertCircle, CheckCircle, Mail } from 'lucide-react'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [emailExists, setEmailExists] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp, resetPassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setEmailExists(false)
    setResetSent(false)

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setLoading(true)

    try {
      const { exists } = await api.post('/check-email', { email })
      if (exists) {
        setEmailExists(true)
        setLoading(false)
        return
      }

      await signUp(email, password, fullName)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setResetLoading(true)
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi du lien de réinitialisation')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Car className="h-16 w-16 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-text">Fleet Manager</h2>
          <p className="mt-2 text-sm text-gray-600">Créez votre compte</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-green-800">Compte créé avec succès ! Redirection...</span>
            </div>
          )}

          {emailExists && !resetSent && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Cette adresse email est déjà utilisée</p>
                  <p className="mt-1 text-sm text-amber-700">
                    Un compte existe déjà avec l'adresse <strong>{email}</strong>.
                  </p>
                  <div className="mt-3 flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={resetLoading}
                      className="inline-flex items-center px-3 py-1.5 border border-amber-300 text-sm font-medium rounded-md text-amber-800 bg-amber-100 hover:bg-amber-200 disabled:opacity-50"
                    >
                      {resetLoading ? 'Envoi...' : 'Renvoyer le mot de passe'}
                    </button>
                    <Link to="/login" className="text-sm font-medium text-primary hover:text-primary-600">
                      Se connecter
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {resetSent && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Email envoyé !</p>
                <p className="mt-1 text-sm text-green-700">
                  Un lien de réinitialisation du mot de passe a été envoyé à <strong>{email}</strong>.
                </p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nom complet
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer un compte'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary-600">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
