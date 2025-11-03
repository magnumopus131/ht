import { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { Calendar, CheckCircle2, Clock, Target, TrendingUp, User } from 'lucide-react'

import { API_URL } from '../utils/api'

interface RehabilitationPlan {
  id: number
  athlete_id: number
  provider_id: number
  phase: string
  exercises: string
  duration_weeks: number
  progress_percentage: number
  is_active: boolean
  created_at: string
}

export default function Rehabilitation() {
  const [athleteId] = useState<number>(1)
  const [plans, setPlans] = useState<RehabilitationPlan[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRehabilitationPlans()
  }, [athleteId])

  const loadRehabilitationPlans = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/rehabilitation-plans/${athleteId}`)
      setPlans(response.data)
    } catch (error) {
      console.error('Error loading rehabilitation plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'acute':
        return 'bg-red-100 text-red-800'
      case 'recovery':
        return 'bg-yellow-100 text-yellow-800'
      case 'return_to_sport':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rehabilitation Plans</h1>
          <p className="text-gray-600">AI-powered personalized recovery protocols</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : plans.length > 0 ? (
          <div className="space-y-6">
            {plans.map((plan) => {
              const exercises = JSON.parse(plan.exercises || '[]')
              return (
                <div key={plan.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">
                          {plan.phase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Phase
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPhaseColor(plan.phase)}`}>
                          {plan.phase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Started {format(new Date(plan.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{plan.duration_weeks} weeks</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Progress</div>
                      <div className="text-2xl font-bold text-primary-600">
                        {plan.progress_percentage.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${plan.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Exercises */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Prescribed Exercises</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {exercises.length > 0 ? (
                        exercises.map((exercise: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                          >
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <span className="text-gray-900">{exercise}</span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-gray-500 text-sm">
                          Exercise list will be provided based on your rehabilitation phase
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Phase Guidelines</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {plan.phase === 'acute' && (
                        <>
                          <p>• Focus on pain management and reducing inflammation</p>
                          <p>• Maintain range of motion within safe limits</p>
                          <p>• Avoid weight-bearing activities until cleared</p>
                        </>
                      )}
                      {plan.phase === 'recovery' && (
                        <>
                          <p>• Gradual return to strength training</p>
                          <p>• Focus on neuromuscular control and proprioception</p>
                          <p>• Monitor for any signs of reinjury</p>
                        </>
                      )}
                      {plan.phase === 'return_to_sport' && (
                        <>
                          <p>• Sport-specific movement training</p>
                          <p>• Gradual increase in intensity and duration</p>
                          <p>• Continue monitoring biomechanics during activities</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Rehabilitation Plans</h3>
            <p className="text-gray-600 mb-6">
              A rehabilitation plan will be created based on your injury assessment and movement analysis
            </p>
          </div>
        )}

        {/* Educational Resources */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Educational Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="font-semibold text-gray-900 mb-2">ACL Injury Prevention</h3>
              <p className="text-sm text-gray-600">
                Learn about proper landing mechanics and movement patterns to reduce ACL injury risk.
              </p>
            </div>
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="font-semibold text-gray-900 mb-2">Recovery Guidelines</h3>
              <p className="text-sm text-gray-600">
                Understand the phases of ACL recovery and what to expect during rehabilitation.
              </p>
            </div>
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="font-semibold text-gray-900 mb-2">Nutrition & Wellness</h3>
              <p className="text-sm text-gray-600">
                Support your recovery with proper nutrition and weight management strategies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
