import { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { useRouter } from 'next/router'
import { 
  Users, 
  Activity, 
  TrendingDown, 
  TrendingUp, 
  FileText, 
  Calendar,
  Video,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  MessageSquare,
  VideoIcon,
  Stethoscope,
  Bell,
  MapPin,
  Phone,
  Mail,
  Download,
  Plus,
  Edit,
  Eye,
  BarChart3,
  Search,
  Filter,
  FileCheck,
  ClipboardList,
  HeartPulse,
  Shield,
  Award,
  Zap,
  UserCircle,
  Building2,
  CalendarDays,
  PhoneCall,
  Send,
  Briefcase,
  GraduationCap,
  Hospital,
  ArrowRight
} from 'lucide-react'
import { API_URL } from '../utils/api'

// Louisiana Parishes for rural access tracking
const LOUISIANA_PARISHES = [
  'Acadia', 'Allen', 'Ascension', 'Assumption', 'Avoyelles', 'Beauregard', 'Bienville',
  'Bossier', 'Caddo', 'Calcasieu', 'Caldwell', 'Cameron', 'Catahoula', 'Claiborne',
  'Concordia', 'De Soto', 'East Baton Rouge', 'East Carroll', 'East Feliciana', 'Evangeline',
  'Franklin', 'Grant', 'Iberia', 'Iberville', 'Jackson', 'Jefferson', 'Jefferson Davis',
  'Lafayette', 'Lafourche', 'LaSalle', 'Lincoln', 'Livingston', 'Madison', 'Morehouse',
  'Natchitoches', 'Orleans', 'Ouachita', 'Plaquemines', 'Pointe Coupee', 'Rapides', 'Red River',
  'Richland', 'Sabine', 'St. Bernard', 'St. Charles', 'St. Helena', 'St. James', 'St. John the Baptist',
  'St. Landry', 'St. Martin', 'St. Mary', 'St. Tammany', 'Tangipahoa', 'Tensas', 'Terrebonne',
  'Union', 'Vermilion', 'Vernon', 'Washington', 'Webster', 'West Baton Rouge', 'West Carroll',
  'West Feliciana', 'Winn'
]

interface Athlete {
  id: number
  name: string
  email: string
  age?: number
  gender?: string
  bmi?: number
  location?: string
  is_rural?: boolean
  phone?: string
  emergency_contact?: string
  sport?: string
  school?: string
}

interface RiskAssessment {
  overall_risk_score: number
  movement_pattern_risk: number
  demographic_risk: number
  health_history_risk: number
  recommendations: string
  focus_areas: string[]
  assessment_date?: string
}

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
  notes?: string
}

interface TelehealthAppointment {
  id: number
  athlete_id: number
  provider_id: number
  scheduled_date: string
  scheduled_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
}

interface InjuryHistory {
  id: number
  athlete_id: number
  injury_type: string
  injury_date: string
  recovery_status: string
  notes?: string
}

interface Session {
  id: number
  athlete_id: number
  session_date: string
  duration_minutes: number
  movement_type: string
}

interface ProviderStats {
  totalPatients: number
  highRiskPatients: number
  activeRehabPlans: number
  upcomingAppointments: number
  avgRiskScore: number
  recentInjuries: number
  ruralPatients: number
}

export default function Provider() {
  const router = useRouter()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [selectedAthlete, setSelectedAthlete] = useState<number | null>(null)
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null)
  const [rehabPlans, setRehabPlans] = useState<RehabilitationPlan[]>([])
  const [telehealthAppointments, setTelehealthAppointments] = useState<TelehealthAppointment[]>([])
  const [injuryHistory, setInjuryHistory] = useState<InjuryHistory[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'assessment' | 'rehab' | 'telehealth' | 'injury'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'moderate' | 'low'>('all')
  const [providerStats, setProviderStats] = useState<ProviderStats>({
    totalPatients: 0,
    highRiskPatients: 0,
    activeRehabPlans: 0,
    upcomingAppointments: 0,
    avgRiskScore: 0,
    recentInjuries: 0,
    ruralPatients: 0
  })
  const [showCreateRehab, setShowCreateRehab] = useState(false)
  const [showScheduleTelehealth, setShowScheduleTelehealth] = useState(false)

  useEffect(() => {
    loadAthletes()
    loadProviderStats()
  }, [])

  useEffect(() => {
    if (selectedAthlete) {
      loadAthleteData()
    }
  }, [selectedAthlete])

  const loadAthletes = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/users`, {
        params: { role: 'athlete' }
      })
      const athleteData = response.data || []
      
      // Enhance with risk data
      const athletesWithRisk = await Promise.all(
        athleteData.map(async (athlete: Athlete) => {
          try {
            const riskRes = await axios.get(`${API_URL}/athletes/${athlete.id}/risk-assessment`).catch(() => ({ data: null }))
            return {
              ...athlete,
              riskScore: riskRes.data?.overall_risk_score || 0,
              riskLevel: getRiskLevelFromScore(riskRes.data?.overall_risk_score || 0)
            }
          } catch {
            return { ...athlete, riskScore: 0, riskLevel: 'low' }
          }
        })
      )
      
      setAthletes(athletesWithRisk)
    } catch (error) {
      console.error('Error loading athletes:', error)
      setAthletes([])
    } finally {
      setLoading(false)
    }
  }

  const loadProviderStats = async () => {
    try {
      const allAthletes = await axios.get(`${API_URL}/users`, { params: { role: 'athlete' } }).catch(() => ({ data: [] }))
      
      let highRisk = 0
      let totalRisk = 0
      let ruralCount = 0
      
      for (const athlete of allAthletes.data || []) {
        try {
          const riskRes = await axios.get(`${API_URL}/athletes/${athlete.id}/risk-assessment`).catch(() => ({ data: null }))
          if (riskRes.data) {
            const score = riskRes.data.overall_risk_score || 0
            totalRisk += score
            if (score >= 0.7) highRisk++
          }
          if (athlete.is_rural) ruralCount++
        } catch {}
      }
      
      const activeRehab = await Promise.all(
        (allAthletes.data || []).map(async (a: Athlete) => {
          const rehabRes = await axios.get(`${API_URL}/rehabilitation-plans/${a.id}`).catch(() => ({ data: [] }))
          return (rehabRes.data || []).filter((p: RehabilitationPlan) => p.is_active).length
        })
      )
      
      setProviderStats({
        totalPatients: allAthletes.data?.length || 0,
        highRiskPatients: highRisk,
        activeRehabPlans: activeRehab.reduce((a: number, b: number) => a + b, 0),
        upcomingAppointments: 3, // Mock
        avgRiskScore: allAthletes.data?.length > 0 ? totalRisk / allAthletes.data.length : 0,
        recentInjuries: 2, // Mock
        ruralPatients: ruralCount
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadAthleteData = async () => {
    if (!selectedAthlete) return
    
    setLoading(true)
    try {
      const [riskRes, rehabRes, sessionsRes] = await Promise.all([
        axios.get(`${API_URL}/athletes/${selectedAthlete}/risk-assessment`).catch(() => ({ data: null })),
        axios.get(`${API_URL}/rehabilitation-plans/${selectedAthlete}`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/athletes/${selectedAthlete}/sessions`).catch(() => ({ data: [] }))
      ])
      
      setRiskAssessment(riskRes.data)
      setRehabPlans(rehabRes.data || [])
      setSessions(sessionsRes.data || [])
      
      // Mock telehealth and injury data
      setTelehealthAppointments([
        {
          id: 1,
          athlete_id: selectedAthlete,
          provider_id: 1,
          scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          scheduled_time: '14:00',
          status: 'scheduled',
          notes: 'Follow-up assessment'
        }
      ])
      setInjuryHistory([
        {
          id: 1,
          athlete_id: selectedAthlete,
          injury_type: 'ACL Tear - Right Knee',
          injury_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          recovery_status: 'Recovery Phase',
          notes: 'Surgery completed, progressing well'
        }
      ])
    } catch (error) {
      console.error('Error loading athlete data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 0.7) return { level: 'High', color: 'text-red-600 bg-red-50 border-red-200', badge: 'bg-red-100 text-red-800' }
    if (score >= 0.5) return { level: 'Moderate', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800' }
    return { level: 'Low', color: 'text-green-600 bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800' }
  }

  const getRiskLevelFromScore = (score: number): 'high' | 'moderate' | 'low' => {
    if (score >= 0.7) return 'high'
    if (score >= 0.5) return 'moderate'
    return 'low'
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

  const selectedAthleteData = athletes.find(a => a.id === selectedAthlete)
  
  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = searchTerm === '' || 
      athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.sport?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRisk = riskFilter === 'all' || 
      (athlete as any).riskLevel === riskFilter
    return matchesSearch && matchesRisk
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/20">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-elevated border-b-2 border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4 animate-slide-up">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-purple rounded-xl shadow-glow">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Medical Provider Portal</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {localStorage.getItem('user_name') || 'Dr. Smith'} • Sports Medicine • Louisiana
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowScheduleTelehealth(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <VideoIcon className="h-4 w-4" />
                <span>Schedule Telehealth</span>
              </button>
              <button
                onClick={() => router.push('/live-monitoring')}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Eye className="h-4 w-4" />
                <span>Remote Assessment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Provider Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-elevated p-6 border-l-4 border-blue-500 card-hover animate-scale-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1 font-medium">Total Patients</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{providerStats.totalPatients}</div>
                <div className="text-xs text-gray-500 mt-2 font-medium">Active athletes</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-elevated p-6 border-l-4 border-red-500 card-hover animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1 font-medium">High Risk Patients</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">{providerStats.highRiskPatients}</div>
                <div className="text-xs text-gray-500 mt-2 font-medium">Require immediate attention</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl">
                <Bell className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-elevated p-6 border-l-4 border-green-500 card-hover animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1 font-medium">Active Rehab Plans</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">{providerStats.activeRehabPlans}</div>
                <div className="text-xs text-gray-500 mt-2 font-medium">In progress</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl">
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-elevated p-6 border-l-4 border-purple-500 card-hover animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1 font-medium">Rural Patients</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">{providerStats.ruralPatients}</div>
                <div className="text-xs text-gray-500 mt-2 font-medium">Telehealth eligible</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                <MapPin className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-elevated p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Average Risk Score</span>
              <div className={`p-2 rounded-lg ${providerStats.avgRiskScore < 0.5 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                <TrendingDown className={`h-5 w-5 ${providerStats.avgRiskScore < 0.5 ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
              {(providerStats.avgRiskScore * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-2 font-medium">Across all patients</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-elevated p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Upcoming Appointments</span>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{providerStats.upcomingAppointments}</div>
            <div className="text-xs text-gray-500 mt-2 font-medium">Next 7 days</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-elevated p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Recent Injuries</span>
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">{providerStats.recentInjuries}</div>
            <div className="text-xs text-gray-500 mt-2 font-medium">Last 30 days</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Patient List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Patients</span>
                </h2>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {filteredAthletes.length}
                </span>
              </div>

              {/* Search and Filter */}
              <div className="mb-4 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk</option>
                  <option value="moderate">Moderate Risk</option>
                  <option value="low">Low Risk</option>
                </select>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loading && athletes.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 text-sm">Loading patients...</div>
                ) : filteredAthletes.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 text-sm">No patients found</div>
                ) : (
                  filteredAthletes.map((athlete) => {
                    const risk = (athlete as any).riskScore || 0
                    const riskLevel = getRiskLevel(risk)
                    return (
                      <button
                        key={athlete.id}
                        onClick={() => setSelectedAthlete(athlete.id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          selectedAthlete === athlete.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-semibold text-gray-900 text-sm">{athlete.name}</div>
                          {risk >= 0.7 && (
                            <Bell className="h-4 w-4 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {athlete.age ? `${athlete.age} years • ` : ''}{athlete.gender || 'N/A'}
                          {athlete.is_rural && (
                            <span className="ml-2 text-purple-600">• Rural</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${riskLevel.badge}`}>
                            {riskLevel.level} Risk
                          </span>
                          <span className="text-xs text-gray-500">
                            {(risk * 100).toFixed(0)}%
                          </span>
                        </div>
                        {athlete.location && (
                          <div className="text-xs text-gray-500 mt-1">{athlete.location}</div>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedAthlete ? (
              <>
                {/* Patient Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{selectedAthleteData?.name}</h2>
                        {selectedAthleteData?.is_rural && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>Rural Patient</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{selectedAthleteData?.email}</span>
                        </div>
                        {selectedAthleteData?.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>{selectedAthleteData.phone}</span>
                          </div>
                        )}
                        {selectedAthleteData?.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{selectedAthleteData.location}</span>
                          </div>
                        )}
                      </div>
                      {selectedAthleteData?.sport && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Sport:</span> {selectedAthleteData.sport}
                          {selectedAthleteData?.school && ` • ${selectedAthleteData.school}`}
                        </div>
                      )}
                    </div>
                    {riskAssessment && (
                      <div className={`px-4 py-3 rounded-lg border-2 text-center min-w-[120px] ${getRiskLevel(riskAssessment.overall_risk_score).color}`}>
                        <div className="text-xs font-medium mb-1">Overall Risk</div>
                        <div className="text-3xl font-bold">
                          {(riskAssessment.overall_risk_score * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs mt-1 font-semibold">{getRiskLevel(riskAssessment.overall_risk_score).level}</div>
                      </div>
                    )}
                  </div>

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {selectedAthleteData?.age && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Age</div>
                        <div className="font-bold text-gray-900">{selectedAthleteData.age}</div>
                      </div>
                    )}
                    {selectedAthleteData?.bmi && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">BMI</div>
                        <div className="font-bold text-gray-900">{selectedAthleteData.bmi.toFixed(1)}</div>
                      </div>
                    )}
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Total Sessions</div>
                      <div className="font-bold text-gray-900">{sessions.length}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Active Plans</div>
                      <div className="font-bold text-gray-900">{rehabPlans.filter(p => p.is_active).length}</div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex space-x-1 border-b">
                    {[
                      { id: 'overview', label: 'Overview', icon: Activity },
                      { id: 'assessment', label: 'Risk Assessment', icon: AlertCircle },
                      { id: 'rehab', label: 'Rehabilitation', icon: Target },
                      { id: 'telehealth', label: 'Telehealth', icon: Video },
                      { id: 'injury', label: 'Injury History', icon: HeartPulse },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Risk Analysis Summary */}
                    {riskAssessment && (
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5" />
                          <span>Risk Analysis Summary</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="border rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Movement Pattern Risk</div>
                            <div className="text-2xl font-bold text-yellow-600">
                              {(riskAssessment.movement_pattern_risk * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Based on biomechanics data</div>
                          </div>
                          <div className="border rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Demographic Risk</div>
                            <div className="text-2xl font-bold text-orange-600">
                              {(riskAssessment.demographic_risk * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Age, gender, BMI factors</div>
                          </div>
                          <div className="border rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Health History Risk</div>
                            <div className="text-2xl font-bold text-blue-600">
                              {(riskAssessment.health_history_risk * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Previous injuries</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Sessions */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                          <Clock className="h-5 w-5" />
                          <span>Recent Training Sessions</span>
                        </h3>
                        <button
                          onClick={() => router.push(`/sessions?athlete=${selectedAthlete}`)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                        >
                          <span>View All</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                      {sessions.length > 0 ? (
                        <div className="space-y-3">
                          {sessions.slice(0, 5).map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                              <div>
                                <div className="font-medium text-gray-900">{session.movement_type}</div>
                                <div className="text-sm text-gray-600">
                                  {format(new Date(session.session_date), 'MMM dd, yyyy')} • {session.duration_minutes} min
                                </div>
                              </div>
                              <button 
                                onClick={() => router.push(`/sessions/${session.id}`)}
                                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                              >
                                View Details
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">No training sessions recorded</div>
                      )}
                    </div>

                    {/* Active Rehab Plans */}
                    {rehabPlans.filter(p => p.is_active).length > 0 && (
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <Target className="h-5 w-5" />
                            <span>Active Rehabilitation Plans</span>
                          </h3>
                          <button
                            onClick={() => setShowCreateRehab(true)}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>New Plan</span>
                          </button>
                        </div>
                        <div className="space-y-3">
                          {rehabPlans.filter(p => p.is_active).map((plan) => (
                            <div key={plan.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`px-3 py-1 rounded text-sm font-medium ${getPhaseColor(plan.phase)}`}>
                                  {plan.phase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                                <div className="text-sm text-gray-600 font-medium">
                                  {plan.progress_percentage}% Complete
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${plan.progress_percentage}%` }}
                                />
                              </div>
                              <div className="text-sm text-gray-600">
                                {plan.duration_weeks} weeks • Created {format(new Date(plan.created_at), 'MMM dd, yyyy')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'assessment' && riskAssessment && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Detailed Risk Assessment</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const dataStr = JSON.stringify(riskAssessment, null, 2)
                            const dataBlob = new Blob([dataStr], { type: 'application/json' })
                            const url = URL.createObjectURL(dataBlob)
                            const link = document.createElement('a')
                            link.href = url
                            link.download = `risk-assessment-${selectedAthleteData?.name}-${new Date().toISOString().split('T')[0]}.json`
                            link.click()
                          }}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Export</span>
                        </button>
                        <button
                          onClick={() => setShowScheduleTelehealth(true)}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Schedule Follow-up
                        </button>
                        <button
                          onClick={() => setShowCreateRehab(true)}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Create Rehab Plan
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <div className="text-sm font-medium text-blue-900 mb-2">AI-Generated Recommendations</div>
                        <div className="text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border">{riskAssessment.recommendations}</div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-700 mb-3">Focus Areas for Intervention</div>
                        <div className="flex flex-wrap gap-2">
                          {typeof riskAssessment.focus_areas === 'string' 
                            ? JSON.parse(riskAssessment.focus_areas || '[]').map((area: string, idx: number) => (
                                <span key={idx} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                  {area}
                                </span>
                              ))
                            : riskAssessment.focus_areas?.map((area, idx) => (
                                <span key={idx} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                  {area}
                                </span>
                              ))
                          }
                        </div>
                      </div>
                    </div>

                    {/* Risk Breakdown Chart */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Risk Component Breakdown</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">Movement Pattern</span>
                            <span className="font-semibold">{(riskAssessment.movement_pattern_risk * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${riskAssessment.movement_pattern_risk * 100}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">Demographic Factors</span>
                            <span className="font-semibold">{(riskAssessment.demographic_risk * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${riskAssessment.demographic_risk * 100}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">Health History</span>
                            <span className="font-semibold">{(riskAssessment.health_history_risk * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${riskAssessment.health_history_risk * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'rehab' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Rehabilitation Plans</h3>
                      <button
                        onClick={() => setShowCreateRehab(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create New Plan</span>
                      </button>
                    </div>

                    {rehabPlans.length > 0 ? (
                      <div className="space-y-4">
                        {rehabPlans.map((plan) => (
                          <div key={plan.id} className="border rounded-lg p-5 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1.5 rounded text-sm font-medium ${getPhaseColor(plan.phase)}`}>
                                  {plan.phase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                                <span className={`px-3 py-1 rounded text-xs font-medium ${
                                  plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {plan.is_active ? 'Active' : 'Completed'}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-gray-700">
                                {plan.progress_percentage}% Complete
                              </div>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                              <div
                                className="bg-blue-600 h-3 rounded-full transition-all"
                                style={{ width: `${plan.progress_percentage}%` }}
                              />
                            </div>

                            <div className="text-sm text-gray-700 mb-2">
                              <strong>Exercises:</strong> {typeof plan.exercises === 'string' ? plan.exercises : JSON.parse(plan.exercises || '[]').join(', ')}
                            </div>
                            <div className="text-xs text-gray-500 mb-3">
                              Duration: {plan.duration_weeks} weeks • Created: {format(new Date(plan.created_at), 'MMM dd, yyyy')}
                            </div>

                            <div className="flex space-x-2">
                              <button className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center space-x-1">
                                <Edit className="h-3 w-3" />
                                <span>Edit Plan</span>
                              </button>
                              <button className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 flex items-center space-x-1">
                                <FileCheck className="h-3 w-3" />
                                <span>Update Progress</span>
                              </button>
                              <button className="px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100 flex items-center space-x-1">
                                <Download className="h-3 w-3" />
                                <span>Export Plan</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="mb-2">No rehabilitation plans yet</p>
                        <p className="text-sm mb-4">Create a personalized rehabilitation plan for this athlete</p>
                        <button
                          onClick={() => setShowCreateRehab(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Create First Plan
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'telehealth' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <Video className="h-5 w-5" />
                        <span>Telehealth Consultations</span>
                        {selectedAthleteData?.is_rural && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                            Rural Access Priority
                          </span>
                        )}
                      </h3>
                      <button
                        onClick={() => setShowScheduleTelehealth(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>Schedule Consultation</span>
                      </button>
                    </div>

                    <div className="space-y-4 mb-6">
                      {telehealthAppointments.map((appt) => (
                        <div key={appt.id} className={`border rounded-lg p-4 ${
                          appt.status === 'completed' ? 'opacity-60' : 'hover:shadow-md'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-medium text-gray-900">
                                {appt.status === 'scheduled' ? 'Upcoming Consultation' : 'Completed Consultation'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {format(new Date(appt.scheduled_date), 'MMM dd, yyyy')} at {appt.scheduled_time}
                              </div>
                              {appt.notes && (
                                <div className="text-sm text-gray-700 mt-1">{appt.notes}</div>
                              )}
                            </div>
                            {appt.status === 'scheduled' ? (
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                                <VideoIcon className="h-4 w-4" />
                                <span>Join Session</span>
                              </button>
                            ) : (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Remote Assessment Tools */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <VideoIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-blue-900 mb-1">Remote Assessment Tools</div>
                          <div className="text-sm text-blue-700 mb-3">
                            Use video analysis and movement assessment tools to evaluate athletes remotely. 
                            Access recorded sessions, analyze movement patterns, and provide recommendations.
                          </div>
                          <button
                            onClick={() => router.push(`/live-monitoring?athlete=${selectedAthlete}&mode=remote`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Start Remote Assessment</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'injury' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <HeartPulse className="h-5 w-5" />
                        <span>Injury History</span>
                      </h3>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Add Injury Record</span>
                      </button>
                    </div>

                    {injuryHistory.length > 0 ? (
                      <div className="space-y-4">
                        {injuryHistory.map((injury) => (
                          <div key={injury.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-semibold text-gray-900 mb-1">{injury.injury_type}</div>
                                <div className="text-sm text-gray-600">
                                  {format(new Date(injury.injury_date), 'MMM dd, yyyy')}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded text-xs font-medium ${
                                injury.recovery_status.toLowerCase().includes('recovery') ? 'bg-yellow-100 text-yellow-800' :
                                injury.recovery_status.toLowerCase().includes('complete') ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {injury.recovery_status}
                              </span>
                            </div>
                            {injury.notes && (
                              <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                                {injury.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <HeartPulse className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No injury history recorded</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Patient</h3>
                <p className="text-gray-600">
                  Choose a patient from the list to view their data, assessments, and rehabilitation progress
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Rehab Plan Modal */}
      {showCreateRehab && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create Rehabilitation Plan</h3>
              <button onClick={() => setShowCreateRehab(false)} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Acute</option>
                  <option>Recovery</option>
                  <option>Return to Sport</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks)</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exercises</label>
                <textarea 
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter exercise plan..."
                />
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  alert('Rehabilitation plan created successfully!')
                  setShowCreateRehab(false)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Plan
              </button>
              <button
                onClick={() => setShowCreateRehab(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Telehealth Modal */}
      {showScheduleTelehealth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Schedule Telehealth Consultation</h3>
              <button onClick={() => setShowScheduleTelehealth(false)} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                  value={selectedAthleteData?.name || ''}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Consultation notes..."
                />
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  alert('Telehealth consultation scheduled successfully!')
                  setShowScheduleTelehealth(false)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Schedule
              </button>
              <button
                onClick={() => setShowScheduleTelehealth(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
