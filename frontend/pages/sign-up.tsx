import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { API_URL } from '../utils/api'

export default function SignUp() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'athlete'
  })

  useEffect(() => {
    document.body.style.opacity = '1'
    document.body.style.transition = 'opacity 0.5s ease-in'
    setMounted(true)
  }, [])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsLoading(true)
    try {
      console.log('Creating account with data:', { email: formData.email, name: formData.name, role: formData.role })
      console.log('API URL:', API_URL)
      console.log('Full endpoint:', `${API_URL}/users`)
      
      const response = await axios.post(`${API_URL}/users`, {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        role: formData.role
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Account created successfully:', response.data)
      // Success - redirect to sign in or dashboard
      alert('Account created successfully! Please sign in.')
      router.push('/sign-in')
    } catch (err: any) {
      console.error('Sign up error:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      })
      
      let errorMessage = 'Failed to create account. Please try again.'
      
      if (err.response) {
        // Server responded with error
        if (err.response.status === 400) {
          errorMessage = err.response.data?.detail || 'Email already registered or invalid data'
        } else if (err.response.status === 404) {
          errorMessage = 'Backend server not found. Please check if the API is running.'
        } else if (err.response.status === 500) {
          errorMessage = 'Server error. Please try again later.'
        } else {
          errorMessage = err.response.data?.detail || `Error: ${err.response.status}`
        }
      } else if (err.request) {
        // Request made but no response (network/CORS issue)
        errorMessage = `Cannot connect to backend at ${API_URL}. Please check if the server is running and CORS is configured correctly.`
      } else {
        errorMessage = err.message || 'An unexpected error occurred'
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div 
      className="min-h-screen relative transition-opacity duration-500" 
      style={{ 
        backgroundColor: '#F3EFE7',
        opacity: mounted ? 1 : 0
      }}
    >
      {/* Header */}
      <header className="relative z-20 px-8 py-6 flex items-center justify-between">
        <h1 
          className="text-2xl font-bold text-gray-900 cursor-pointer" 
          style={{ fontFamily: 'Norelli, sans-serif' }}
          onClick={() => router.push('/discover')}
        >
          Dear, Tear.
        </h1>
        <nav className="flex items-center space-x-8">
          <button 
            onClick={() => router.push('/discover')}
            className="text-gray-900 hover:text-gray-700 text-sm font-medium"
          >
            WHAT WE DO
          </button>
          <button 
            onClick={() => router.push('/science')} 
            className="text-gray-900 hover:text-gray-700 text-sm font-medium"
          >
            SCIENCE
          </button>
          <button 
            onClick={() => router.push('/sign-in')}
            className="px-4 py-2 bg-purple-200 rounded-lg text-gray-900 text-sm font-medium hover:bg-purple-300 transition-colors"
          >
            SIGN IN
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <div className="relative z-10 min-h-[calc(100vh-120px)] flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {/* Sign Up Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl p-8">
            <h2 
              className="text-4xl font-bold text-gray-900 mb-2 text-center"
              style={{ fontFamily: 'Norelli, sans-serif' }}
            >
              Sign Up
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Create your Dear, Tear. account
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>

              {/* Role Field */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  I am a
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="athlete">Athlete</option>
                  <option value="coach">Coach</option>
                  <option value="provider">Doctor</option>
                </select>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="At least 8 characters"
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Re-enter your password"
                />
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="text-purple-600 hover:text-purple-700">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-purple-600 hover:text-purple-700">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-purple-200 rounded-lg text-gray-900 font-medium hover:bg-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Big Casion, sans-serif' }}
              >
                {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <a 
                  href="#" 
                  onClick={() => router.push('/sign-in')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

