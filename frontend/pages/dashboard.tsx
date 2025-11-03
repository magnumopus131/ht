import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { Home, Grid, CheckCircle2, BarChart3, Users, Target } from 'lucide-react'
import { API_URL } from '../utils/api'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token')
    const userId = localStorage.getItem('user_id')
    const userName = localStorage.getItem('user_name')
    const userRole = localStorage.getItem('user_role')

    if (!token || !userId) {
      router.push('/sign-in')
      return
    }

    // Auto-redirect coaches and providers to their dedicated pages
    if (userRole === 'coach' || userRole === 'trainer') {
      router.push('/coach')
      return
    }
    
    if (userRole === 'provider') {
      router.push('/provider')
      return
    }

    // Set user info from localStorage
    setUser({
      id: userId,
      name: userName,
      role: userRole
    })
    setLoading(false)

    // Optionally fetch full user details
    // fetchUserDetails(userId, token)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_name')
    router.push('/sign-in')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3EFE7' }}>
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <h1 
            className="text-2xl font-bold text-white" 
            style={{ fontFamily: 'Norelli, sans-serif' }}
          >
            Dear, Tear.
          </h1>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 rounded-lg text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 pb-24">
        {/* Navigation Bar - Pill Shaped - Fixed at Bottom */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="inline-flex items-center bg-gray-200 rounded-full p-1.5 shadow-lg">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all ${
                activeTab === 'home'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-900 hover:bg-gray-300'
              }`}
            >
              <Home className={`h-5 w-5 ${activeTab === 'home' ? 'text-white' : 'text-gray-900'}`} />
              <span className="font-medium">Home</span>
            </button>
            
            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all ${
                activeTab === 'services'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-900 hover:bg-gray-300'
              }`}
            >
              <Grid className={`h-5 w-5 ${activeTab === 'services' ? 'text-white' : 'text-gray-900'}`} />
              <span className="font-medium">Services</span>
            </button>
            
            <button
              onClick={() => setActiveTab('action-plan')}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all ${
                activeTab === 'action-plan'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-900 hover:bg-gray-300'
              }`}
            >
              <CheckCircle2 className={`h-5 w-5 ${activeTab === 'action-plan' ? 'text-white' : 'text-gray-900'}`} />
              <span className="font-medium">Action Plan</span>
            </button>
            
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all ${
                activeTab === 'data'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-900 hover:bg-gray-300'
              }`}
            >
              <BarChart3 className={`h-5 w-5 ${activeTab === 'data' ? 'text-white' : 'text-gray-900'}`} />
              <span className="font-medium">Data</span>
            </button>
            
            <button
              onClick={() => setActiveTab('doctors')}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all ${
                activeTab === 'doctors'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-900 hover:bg-gray-300'
              }`}
            >
              <Users className={`h-5 w-5 ${activeTab === 'doctors' ? 'text-white' : 'text-gray-900'}`} />
              <span className="font-medium">Doctors</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'home' && (
          <div className="bg-gray-900 rounded-2xl p-8 text-white min-h-screen">
            {/* Top Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Biomarkers Panel */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Movement Metrics</h3>
                <div className="text-3xl font-bold text-white mb-2">127 metrics tracked</div>
                <div className="flex flex-wrap gap-1 mt-4">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const colors = ['#10b981', '#fbbf24', '#ec4899', '#8b5cf6', '#3b82f6']
                    const color = colors[i % colors.length]
                    return (
                      <div
                        key={i}
                        className="w-2 h-8 rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Movement Quality Score Panel */}
              <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-white mb-4">Movement Quality Score</h3>
                  <div className="text-6xl font-bold text-white mb-2">87</div>
                  <div className="text-white/90 text-sm">Excellent biomechanics and low injury risk</div>
                </div>
              </div>
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Physical Health Panel */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Physical Health</h3>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeDasharray={`${75 * 3.14} ${157}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-bold text-white">75%</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400 mb-4">January 15, 2025</div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-white mb-3">Training goals for you</h4>
                  <p className="text-sm text-gray-300 mb-4">
                    Hello {user?.name || 'Athlete'}, I've identified these specific movement goals to optimize your ACL injury prevention and athletic performance.
                  </p>
                  <div className="bg-gray-700 rounded-lg p-3 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">External Focus Training</div>
                      <div className="text-xs text-gray-400">Daily practice recommended</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Movement Analysis Panel */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Movement Analysis</h3>
                <div className="text-sm text-gray-300 mb-2">
                  <span className="text-pink-400">12 out of range</span>, <span className="text-green-400">71 in range</span>
                </div>
                <div className="relative w-48 h-48 mx-auto mt-4">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {Array.from({ length: 72 }).map((_, i) => {
                      const angle = (i * 5) * (Math.PI / 180)
                      const x1 = 100 + 70 * Math.cos(angle - Math.PI / 2)
                      const y1 = 100 + 70 * Math.sin(angle - Math.PI / 2)
                      const x2 = 100 + 85 * Math.cos(angle - Math.PI / 2)
                      const y2 = 100 + 85 * Math.sin(angle - Math.PI / 2)
                      const colors = ['#10b981', '#fbbf24', '#ec4899', '#8b5cf6', '#3b82f6']
                      const color = colors[Math.floor(Math.random() * colors.length)]
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={color}
                          strokeWidth="3"
                        />
                      )
                    })}
                  </svg>
                </div>
                <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-gray-300">Optimal</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <span className="text-gray-300">In range</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                    <span className="text-gray-300">Out of range</span>
                  </div>
                </div>
              </div>

              {/* Provider Chat Panel */}
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Provider</div>
                    <div className="text-xs text-gray-400">Movement Specialist</div>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  <div className="bg-gray-700 rounded-lg p-3 ml-8">
                    <div className="text-xs text-gray-300">Hi, what can I do to improve my landing mechanics?</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-xs text-white mb-1">Knee Valgus</div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-pink-400">Out of range</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-300">18°</span>
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-xs text-gray-300">I'm here to help! Let's focus on external focus cues to improve your movement patterns.</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-xs text-gray-300">High knee valgus indicates your knee is collapsing inward during movement. Our protocol includes:</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations Section */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Personalized Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/live-monitoring')}>
                  <div className="text-white font-semibold mb-1">AI Coach Training</div>
                  <div className="text-white/80 text-xs">Practice with real-time voice guidance</div>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/rehabilitation')}>
                  <div className="text-white font-semibold mb-1">Rehabilitation Plan</div>
                  <div className="text-white/80 text-xs">Track your recovery progress</div>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/live-monitoring')}>
                  <div className="text-white font-semibold mb-1">Live Monitoring</div>
                  <div className="text-white/80 text-xs">Real-time biomechanics analysis</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Norelli, sans-serif' }}>
              Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Service cards from the grid above */}
              <div 
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => router.push('/live-monitoring')}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">Live Monitoring</h3>
                <p className="text-gray-600 text-sm">
                  Real-time biomechanics tracking and movement analysis
                </p>
              </div>

              <div 
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => router.push('/xray-chat')}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">X-Ray Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Upload and analyze X-ray images with AI
                </p>
              </div>

              <div 
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => router.push('/knee-3d')}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">3D Knee Model</h3>
                <p className="text-gray-600 text-sm">
                  Interactive 3D visualization of knee anatomy
                </p>
              </div>

              <div 
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => router.push('/telehealth')}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">Telehealth</h3>
                <p className="text-gray-600 text-sm">
                  Schedule consultations with healthcare providers
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'action-plan' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Norelli, sans-serif' }}>
              Action Plan
            </h2>
            <div 
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow mb-4"
              onClick={() => router.push('/rehabilitation')}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">Rehabilitation Plans</h3>
              <p className="text-gray-600 text-sm">
                Track your recovery progress and exercise plans
              </p>
            </div>
            <div className="text-gray-600">
              <p className="text-sm">Click above to view your personalized rehabilitation plans and track your recovery progress.</p>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Norelli, sans-serif' }}>
              Data & Analytics
            </h2>
            <div className="space-y-4">
              <div 
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => router.push('/live-monitoring')}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">Biomechanics Data</h3>
                <p className="text-gray-600 text-sm">
                  View your movement analysis data and risk assessments
                </p>
              </div>
              {(user?.role === 'coach' || user?.role === 'trainer' || user?.role === 'provider') && (
                <div 
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => router.push('/coach')}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Coach Dashboard</h3>
                  <p className="text-gray-600 text-sm">
                    Team monitoring and athlete risk management
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Norelli, sans-serif' }}>
              Doctors & Coaches
            </h2>
            <div className="space-y-4">
              <div 
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => router.push('/telehealth')}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule Consultation</h3>
                <p className="text-gray-600 text-sm">
                  Connect with healthcare doctors and specialists
                </p>
              </div>
              {(user?.role === 'coach' || user?.role === 'trainer' || user?.role === 'provider') && (
                <div 
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => router.push('/coach')}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Coach Portal</h3>
                  <p className="text-gray-600 text-sm">
                    Access team monitoring and athlete management tools
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

