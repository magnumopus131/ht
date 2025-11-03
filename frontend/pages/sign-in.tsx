import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { API_URL } from '../utils/api'

export default function SignIn() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.opacity = '1'
    document.body.style.transition = 'opacity 0.5s ease-in'
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      console.log('Attempting login to:', `${API_URL}/auth/login`)
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      })
      
      // Store token and user info
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('user_id', response.data.user_id.toString())
      localStorage.setItem('user_role', response.data.role)
      localStorage.setItem('user_name', response.data.name)
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      if (err.response) {
        // Server responded with error
        if (err.response.status === 404) {
          setError('Login endpoint not found. Please make sure the backend server is running and restarted.')
        } else {
          setError(err.response?.data?.detail || 'Incorrect email or password')
        }
      } else if (err.request) {
        // Request made but no response
        setError('Cannot connect to server. Please make sure the backend is running.')
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
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
      <div className="relative z-10 min-h-[calc(100vh-120px)] flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          {/* Sign In Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl p-8">
            <h2 
              className="text-4xl font-bold text-gray-900 mb-2 text-center"
              style={{ fontFamily: 'Norelli, sans-serif' }}
            >
              Sign In
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Welcome back to Dear, Tear.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-purple-600 hover:text-purple-700">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-purple-200 rounded-lg text-gray-900 font-medium hover:bg-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Big Casion, sans-serif' }}
              >
                {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/sign-up')
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

