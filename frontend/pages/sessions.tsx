import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { Calendar, Clock, Activity, TrendingUp, ExternalLink, ArrowLeft } from 'lucide-react'
import { API_URL } from '../utils/api'

type TrainingSession = {
  id: number
  athlete_id: number
  session_type: string
  sport: string
  duration_minutes: number
  start_time: string
  end_time: string
  high_risk_movements: number
  avg_knee_valgus: number | null
  avg_landing_force: number | null
  peak_impact_force: number | null
}

export default function Sessions() {
  const router = useRouter()
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [athleteId] = useState<number>(() => {
    const stored = localStorage.getItem('user_id')
    return stored ? parseInt(stored) : 1
  })

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_URL}/athletes/${athleteId}/sessions`)
        setSessions(response.data)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load sessions')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSessions()
  }, [athleteId])

  const handleViewAnalysis = (sessionId: number) => {
    router.push(`/session-analysis?sessionId=${sessionId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Training Sessions</h1>
              <p className="text-gray-400 text-sm mt-1">View and analyze your training sessions</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-12 border border-gray-700 text-center">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Sessions Found</h3>
            <p className="text-gray-500">Start a training session to see your data here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer"
                onClick={() => handleViewAnalysis(session.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-medium capitalize">
                        {session.session_type}
                      </span>
                      <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs font-medium capitalize">
                        {session.sport}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {new Date(session.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </h3>
                  </div>
                  <ExternalLink className="h-5 w-5 text-gray-500" />
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>{session.duration_minutes} minutes</span>
                  </div>

                  {session.avg_knee_valgus !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Avg Valgus</span>
                      <span className={`text-sm font-semibold ${
                        session.avg_knee_valgus > 15 ? 'text-red-400' :
                        session.avg_knee_valgus > 10 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {session.avg_knee_valgus.toFixed(1)}°
                      </span>
                    </div>
                  )}

                  {session.high_risk_movements > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">High Risk Movements</span>
                      <span className="text-sm font-semibold text-red-400">
                        {session.high_risk_movements}
                      </span>
                    </div>
                  )}

                  {session.peak_impact_force !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Peak Impact</span>
                      <span className={`text-sm font-semibold ${
                        session.peak_impact_force > 3 ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {session.peak_impact_force.toFixed(2)}x BW
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewAnalysis(session.id)
                  }}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Activity className="h-4 w-4" />
                  <span>View Analysis</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

