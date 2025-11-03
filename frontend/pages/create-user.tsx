import { useState, useEffect } from 'react'
import axios from 'axios'

import { API_URL } from '../utils/api'

interface User {
  email: string
  name: string
  role: string
  age?: number
  gender?: string
  bmi?: number
  location?: string
  is_rural?: boolean
}

export default function CreateUser() {
  const [formData, setFormData] = useState<User>({
    email: '',
    name: '',
    role: 'athlete',
    age: undefined,
    gender: '',
    bmi: undefined,
    location: '',
    is_rural: false
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      await axios.post(`${API_URL}/users`, formData)
      setSuccess(true)
      setFormData({
        email: '',
        name: '',
        role: 'athlete',
        age: undefined,
        gender: '',
        bmi: undefined,
        location: '',
        is_rural: false
      })
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Error creating user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create User Account</h1>

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">User created successfully!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="athlete">Athlete</option>
                <option value="coach">Coach</option>
                <option value="trainer">Trainer</option>
                <option value="provider">Healthcare Provider</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min="10"
                  max="30"
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BMI
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="50"
                  value={formData.bmi || ''}
                  onChange={(e) => setFormData({ ...formData, bmi: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location (Louisiana)
                </label>
                <input
                  type="text"
                  placeholder="e.g., New Orleans, Baton Rouge"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_rural"
                checked={formData.is_rural}
                onChange={(e) => setFormData({ ...formData, is_rural: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_rural" className="ml-2 block text-sm text-gray-700">
                Rural area (limited access to specialists)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
