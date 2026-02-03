const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const api = {
  async get(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`)
    if (!response.ok) throw new Error('API request failed')
    return response.json()
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('API request failed')
    return response.json()
  },

  async put(endpoint, data) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('API request failed')
    return response.json()
  },

  async delete(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('API request failed')
    return response.json()
  },
}
