import { useEffect, useState } from 'react'
import axios from 'axios'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Activity,
  Calendar,
  BarChart3,
  MessageSquare,
  Download,
  Eye,
  Clock,
  Target,
  ArrowRight,
  Bell,
  Phone,
  Stethoscope,
  MapPin,
  CircleDot,
  UserCircle,
  PlayCircle,
  FileText,
  AlertCircle,
  Sparkles,
  Settings,
  Search,
  Filter,
  ChevronDown,
  Award,
  TrendingDown as TrendingDownIcon,
  Calendar as CalendarIcon,
  Zap
} from 'lucide-react'
import { useRouter } from 'next/router'
import { API_URL } from '../utils/api'

// Louisiana Parishes (all 64)
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

const SPORTS = ['Football', 'Soccer', 'Basketball', 'Gymnastics', 'Lacrosse', 'Volleyball', 'Track & Field']
const SEASONS = ['2024-25 Fall', '2024-25 Winter', '2023-24 Spring', '2023-24 Fall']

// Louisiana-Specific External Focus Cues by Sport
const LOUISIANA_CUES = {
  'Football': [
    'Drive toward the Superdome end zone',
    'Plant firm like cypress roots in the bayou',
    'Push the ground away like launching from the Saints tunnel',
    'Cut sharp like a pelican diving for fish',
    'Land soft like stepping into gumbo'
  ],
  'Soccer': [
    'Aim for the goal posts like targeting a crawfish trap',
    'Land soft like stepping on café beignets',
    'Drive through the ball like pushing through swamp grass',
    'Cut around defenders like navigating the French Quarter',
    'Balance like a heron on one leg'
  ],
  'Basketball': [
    'Reach for the rim like grabbing Mardi Gras beads',
    'Balance like walking French Quarter cobblestones',
    'Land quiet like stepping into soft mud',
    'Plant like a live oak tree in Audubon Park',
    'Drive through like pushing through a second-line parade'
  ],
  'Gymnastics': [
    'Land soft like sinking into a featherbed',
    'Balance steady like a pelican on a piling',
    'Control like paddling through calm bayou waters'
  ],
  'Lacrosse': [
    'Drive through like pushing through tall grass',
    'Cut sharp like a gator snapping',
    'Land controlled like settling on a lily pad'
  ],
  'Volleyball': [
    'Reach high like stretching for Spanish moss',
    'Land balanced like a cypress knee',
    'Push through like powering through humid air'
  ],
  'Track & Field': [
    'Drive forward like chasing a crawfish',
    'Land light like stepping over fallen leaves',
    'Push off like launching from a levee'
  ]
}

type AthleteCard = {
  athlete_id: number
  name: string
  risk: number
  bucket: 'low' | 'moderate' | 'high' | 'injured'
  position?: string
  jersey?: number
  sport?: string
  lastAssessment?: string
  movementQuality?: number
  photo?: string
  parish?: string
  school?: string
}

type HeatmapResponse = {
  team: AthleteCard[]
}

type Cue = {
  id: number
  text: string
  modality: string
  movement_context: string
  risk_driver: string
  culture_tags?: string
  locale: string
}

type TeamStats = {
  totalAthletes: number
  highRiskCount: number
  moderateRiskCount: number
  lowRiskCount: number
  injuredCount: number
  avgRiskScore: number
  avgMovementQuality: number
  activeSessions: number
  totalSessionsToday: number
  trainingCompletionRate: number
  recentInjuries: number
  teamImprovement: number
}

export default function Coach() {
  const router = useRouter()
  const [team, setTeam] = useState<AthleteCard[]>([])
  const [cues, setCues] = useState<Cue[]>([])
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState('landing')
  const [driver, setDriver] = useState('valgus')
  const [selectedAthlete, setSelectedAthlete] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'training' | 'analytics'>('overview')
  const [selectedParish, setSelectedParish] = useState<string>('Orleans')
  const [selectedSport, setSelectedSport] = useState<string>('Football')
  const [selectedSeason, setSelectedSeason] = useState<string>(SEASONS[0])
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'moderate' | 'high' | 'injured'>('all')

  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalAthletes: 0,
    highRiskCount: 0,
    moderateRiskCount: 0,
    lowRiskCount: 0,
    injuredCount: 0,
    avgRiskScore: 0,
    avgMovementQuality: 0,
    activeSessions: 0,
    totalSessionsToday: 0,
    trainingCompletionRate: 0,
    recentInjuries: 0,
    teamImprovement: 15
  })

  const load = async () => {
    setLoading(true)
    try {
      const [heat, cueList] = await Promise.all([
        axios.get<HeatmapResponse>(`${API_URL}/team/heatmap`).catch(() => ({ data: { team: [] } as HeatmapResponse })),
        axios.get<Cue[]>(`${API_URL}/cues`, { params: { context, driver } }).catch(() => ({ data: [] as Cue[] }))
      ])
      
      // Enhance team data with mock sport/position data if not present
      const enhancedTeam = heat.data.team.map(athlete => ({
        ...athlete,
        sport: athlete.sport || selectedSport,
        position: athlete.position || (selectedSport === 'Football' ? ['QB', 'WR', 'RB', 'LB'][Math.floor(Math.random() * 4)] :
                  selectedSport === 'Soccer' ? ['Forward', 'Midfielder', 'Defender', 'Goalie'][Math.floor(Math.random() * 4)] :
                  selectedSport === 'Basketball' ? ['PG', 'SG', 'SF', 'PF', 'C'][Math.floor(Math.random() * 5)] : 'Player'),
        jersey: athlete.jersey || Math.floor(Math.random() * 99) + 1,
        lastAssessment: athlete.lastAssessment || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        movementQuality: athlete.movementQuality || Math.floor(Math.random() * 40) + 60,
        parish: athlete.parish || selectedParish,
        school: athlete.school || `${selectedParish} High School`
      }))
      
      setTeam(enhancedTeam)
      setCues(cueList.data)
      
      // Calculate team statistics
      if (enhancedTeam.length > 0) {
        const highRisk = enhancedTeam.filter(a => a.bucket === 'high').length
        const moderateRisk = enhancedTeam.filter(a => a.bucket === 'moderate').length
        const lowRisk = enhancedTeam.filter(a => a.bucket === 'low').length
        const injured = enhancedTeam.filter(a => a.bucket === 'injured').length
        const avgRisk = enhancedTeam.reduce((sum, a) => sum + a.risk, 0) / enhancedTeam.length
        const avgQuality = enhancedTeam.reduce((sum, a) => sum + (a.movementQuality || 70), 0) / enhancedTeam.length
        
        setTeamStats({
          totalAthletes: enhancedTeam.length,
          highRiskCount: highRisk,
          moderateRiskCount: moderateRisk,
          lowRiskCount: lowRisk,
          injuredCount: injured,
          avgRiskScore: avgRisk,
          avgMovementQuality: avgQuality,
          activeSessions: Math.floor(Math.random() * 5) + 1,
          totalSessionsToday: enhancedTeam.length * 2,
          trainingCompletionRate: Math.floor(Math.random() * 20) + 75,
          recentInjuries: injured,
          teamImprovement: Math.max(0, 15 - (avgRisk * 20))
        })
      }
    } catch (e) {
      setTeam([])
      setCues([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 10000) // Auto-refresh every 10s
    return () => clearInterval(t)
  }, [context, driver, selectedSport, selectedParish])

  const bucketColor = (b: AthleteCard['bucket']) => {
    switch(b) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300'
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 border-green-300'
      case 'injured': return 'bg-purple-100 text-purple-800 border-purple-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getRiskLabel = (b: AthleteCard['bucket']) => {
    switch(b) {
      case 'high': return 'Immediate Intervention Required'
      case 'moderate': return 'Needs Attention'
      case 'low': return 'Ready to Play'
      case 'injured': return 'Return-to-Play Protocol'
      default: return 'Unknown'
    }
  }

  const sendCue = async (athleteId: number, cueId: number) => {
    try {
      await axios.post(`${API_URL}/events/cue`, {
        athlete_id: athleteId,
        movement_context: context,
        risk_driver: driver,
        cue_id: cueId
      })
      alert('Cue sent successfully!')
    } catch (e) {
      alert('Failed to send cue')
    }
  }

  const filteredTeam = team.filter(athlete => {
    const matchesSearch = searchTerm === '' || 
      athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.position?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRisk = riskFilter === 'all' || athlete.bucket === riskFilter
    return matchesSearch && matchesRisk
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Top Navigation Bar */}
      <div className="bg-white/90 backdrop-blur-md border-b-2 border-gray-200 shadow-elevated sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4 animate-slide-up">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-blue rounded-xl shadow-glow">
                  <UserCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Coach Dashboard</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {localStorage.getItem('user_name') || 'Coach'} • {selectedParish} Parish
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEmergencyContacts(!showEmergencyContacts)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Phone className="h-4 w-4" />
                <span>Emergency Contacts</span>
              </button>
              <button 
                onClick={() => router.push('/live-monitoring')}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Activity className="h-4 w-4" />
                <span>Live Monitoring</span>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Parish</label>
              <select 
                value={selectedParish} 
                onChange={(e) => setSelectedParish(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {LOUISIANA_PARISHES.map(parish => (
                  <option key={parish} value={parish}>{parish}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sport</label>
              <select 
                value={selectedSport} 
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SPORTS.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Season</label>
              <select 
                value={selectedSeason} 
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SEASONS.map(season => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quick Actions</label>
              <button
                onClick={() => router.push('/live-monitoring?mode=team')}
                className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <PlayCircle className="h-4 w-4" />
                <span>Start Team Assessment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contacts Modal */}
      {showEmergencyContacts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Emergency Contacts</h3>
              <button onClick={() => setShowEmergencyContacts(false)} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="font-semibold text-red-900">Emergency: 911</div>
                <div className="text-sm text-red-700">Medical Emergency</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-900">Team Physician</div>
                <div className="text-sm text-blue-700">Dr. Smith • (504) 555-0100</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-900">Athletic Trainer</div>
                <div className="text-sm text-green-700">Sarah Johnson • (504) 555-0101</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Team Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-elevated p-6 border-l-4 border-blue-500 card-hover animate-scale-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1 font-medium">Total Athletes</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{teamStats.totalAthletes}</div>
                <div className="text-xs text-gray-500 mt-2 font-medium">{selectedSport}</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-elevated p-6 border-l-4 border-red-500 card-hover animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1 font-medium">High Risk</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">{teamStats.highRiskCount}</div>
                <div className="text-xs text-gray-500 mt-2 font-medium">Immediate attention</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl">
                <Bell className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-elevated p-6 border-l-4 border-purple-500 card-hover animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1 font-medium">Injured/Recovery</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">{teamStats.injuredCount}</div>
                <div className="text-xs text-gray-500 mt-2 font-medium">RTP protocol</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                <AlertCircle className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-elevated p-6 border-l-4 border-green-500 card-hover animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1 font-medium">Movement Quality</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">{teamStats.avgMovementQuality.toFixed(0)}%</div>
                <div className="text-xs text-gray-500 mt-2 font-medium">Team average</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl">
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-elevated p-6 border-l-4 border-orange-500 card-hover animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1 font-medium">Training Completion</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">{teamStats.trainingCompletionRate}%</div>
                <div className="text-xs text-gray-500 mt-2 font-medium">This week</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-elevated mb-6 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex space-x-2 px-4">
              {[
                { id: 'overview', label: 'Team Overview', icon: Users },
                { id: 'training', label: 'External Focus Training', icon: Sparkles },
                { id: 'analytics', label: 'Movement Analysis', icon: BarChart3 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-3 transition-all duration-200 relative ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                  )}
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search athletes by name or position..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk</option>
                  <option value="moderate">Moderate Risk</option>
                  <option value="low">Low Risk</option>
                  <option value="injured">Injured/Recovery</option>
                </select>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(filteredTeam, null, 2)
                    const dataBlob = new Blob([dataStr], { type: 'application/json' })
                    const url = URL.createObjectURL(dataBlob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `team-report-${selectedSeason}-${new Date().toISOString().split('T')[0]}.json`
                    link.click()
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Athlete Risk Management Grid */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Athlete Risk Management • {filteredTeam.length} athletes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTeam.map((athlete) => (
                  <div
                    key={athlete.athlete_id}
                    onClick={() => setSelectedAthlete(athlete.athlete_id)}
                    className={`border-2 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl cursor-pointer card-hover ${
                      selectedAthlete === athlete.athlete_id ? 'ring-4 ring-blue-500 shadow-glow scale-105' : ''
                    } ${bucketColor(athlete.bucket)}`}
                  >
                    {/* Athlete Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                          {athlete.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{athlete.name}</div>
                          <div className="text-xs text-gray-600">
                            #{athlete.jersey} • {athlete.position}
                          </div>
                        </div>
                      </div>
                      {athlete.bucket === 'high' && (
                        <Bell className="h-5 w-5 text-red-600 flex-shrink-0" />
                      )}
                      {athlete.bucket === 'injured' && (
                        <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      )}
                    </div>

                    {/* Risk Indicator */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">Risk Level</span>
                        <span className="text-xs font-bold">{(athlete.risk * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            athlete.bucket === 'high' ? 'bg-red-600' :
                            athlete.bucket === 'moderate' ? 'bg-yellow-600' :
                            athlete.bucket === 'injured' ? 'bg-purple-600' :
                            'bg-green-600'
                          }`}
                          style={{ width: `${athlete.risk * 100}%` }}
                        />
                      </div>
                      <div className="text-xs font-semibold mt-1">{getRiskLabel(athlete.bucket)}</div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div>
                        <div className="text-gray-600">Movement Quality</div>
                        <div className="font-bold">{athlete.movementQuality || 75}%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Last Assessment</div>
                        <div className="font-bold">
                          {athlete.lastAssessment 
                            ? new Date(athlete.lastAssessment).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/live-monitoring?athlete=${athlete.athlete_id}`)
                        }}
                        className="flex-1 px-2 py-1.5 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex items-center justify-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Assess</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/sessions?athlete=${athlete.athlete_id}`)
                        }}
                        className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 flex items-center justify-center space-x-1"
                      >
                        <BarChart3 className="h-3 w-3" />
                        <span>History</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredTeam.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No athletes found matching your filters</p>
                </div>
              )}
            </div>

            {/* Selected Athlete Details Panel */}
            {selectedAthlete && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {team.find(a => a.athlete_id === selectedAthlete)?.name} - Detailed Actions
                  </h3>
                  <button
                    onClick={() => setSelectedAthlete(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    × Close
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => router.push(`/live-monitoring?athlete=${selectedAthlete}`)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <Activity className="h-6 w-6 text-blue-600 mb-2" />
                    <div className="font-semibold text-gray-900">Assess Now</div>
                    <div className="text-sm text-gray-600">Start real-time movement analysis</div>
                  </button>
                  <button
                    onClick={() => router.push(`/sessions?athlete=${selectedAthlete}`)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
                  >
                    <BarChart3 className="h-6 w-6 text-green-600 mb-2" />
                    <div className="font-semibold text-gray-900">View History</div>
                    <div className="text-sm text-gray-600">Historical sessions & trends</div>
                  </button>
                  <button
                    onClick={() => router.push(`/provider?athlete=${selectedAthlete}`)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                  >
                    <Calendar className="h-6 w-6 text-purple-600 mb-2" />
                    <div className="font-semibold text-gray-900">Schedule Check</div>
                    <div className="text-sm text-gray-600">Contact medical provider</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'training' && (
          <div className="space-y-6">
            {/* External Focus Training Center */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">External Focus Training Center</h2>
              <p className="text-gray-600 mb-6">
                Research-based coaching cues that direct attention to movement effects rather than body mechanics.
                Use these Louisiana-specific cues to improve motor learning and reduce ACL injury risk.
              </p>

              {/* Sport-Specific Cue Generator */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 mb-6 border-2 border-purple-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedSport} - Louisiana External Focus Cues
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(LOUISIANA_CUES[selectedSport as keyof typeof LOUISIANA_CUES] || LOUISIANA_CUES.Football).map((cue, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 italic mb-2">"{cue}"</div>
                          <div className="text-xs text-gray-600">
                            External Focus • {selectedSport} • Louisiana Culture
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const highRiskAthletes = team.filter(a => a.bucket === 'high' || a.bucket === 'moderate')
                            if (highRiskAthletes.length > 0) {
                              alert(`Ready to send cue "${cue}" to ${highRiskAthletes.length} athletes`)
                            } else {
                              alert(`Cue "${cue}" ready for team practice`)
                            }
                          }}
                          className="ml-3 px-3 py-1.5 bg-purple-100 text-purple-800 rounded text-xs hover:bg-purple-200 font-medium"
                        >
                          Use in Practice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* External vs Internal Focus Guide */}
              <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Internal vs External Focus Quick Reference</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold text-red-900 mb-2">❌ Internal Focus (Avoid)</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• "Keep your knee over your toe"</li>
                      <li>• "Bend your knee more"</li>
                      <li>• "Control your landing"</li>
                      <li>• "Stabilize your knee"</li>
                    </ul>
                    <p className="text-xs text-gray-600 mt-2">Focuses attention on body movements - less effective for motor learning</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-green-900 mb-2">✅ External Focus (Use)</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• "Drive your feet into the ground"</li>
                      <li>• "Land soft like stepping on eggs"</li>
                      <li>• "Push the Earth away from you"</li>
                      <li>• "Balance like a tree"</li>
                    </ul>
                    <p className="text-xs text-gray-600 mt-2">Focuses attention on movement effects - improves motor learning and retention</p>
                  </div>
                </div>
              </div>

              {/* Daily Coaching Suggestions */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span>Today's Coaching Suggestions</span>
                </h3>
                <div className="space-y-3">
                  {team.filter(a => a.bucket === 'high' || a.bucket === 'moderate').slice(0, 3).map((athlete) => (
                    <div key={athlete.athlete_id} className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{athlete.name}</div>
                          <div className="text-sm text-gray-600">
                            Risk: {(athlete.risk * 100).toFixed(0)}% • Focus: {driver === 'valgus' ? 'Knee alignment' : 'Landing mechanics'}
                          </div>
                          <div className="text-sm italic text-purple-700 mt-1">
                            "{LOUISIANA_CUES[selectedSport as keyof typeof LOUISIANA_CUES]?.[0] || 'Drive your feet into the ground'}"
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const cueText = LOUISIANA_CUES[selectedSport as keyof typeof LOUISIANA_CUES]?.[0] || 'Focus on external targets'
                            alert(`Sending cue "${cueText}" to ${athlete.name}`)
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium"
                        >
                          Send Cue
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* External Focus Cue Library */}
              {cues.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional External Focus Cues</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cues.map((c) => (
                      <div key={c.id} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all">
                        <div className="text-sm font-semibold text-gray-900 mb-2 italic">"{c.text}"</div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {c.movement_context}
                          </span>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                            {c.risk_driver}
                          </span>
                        </div>
                        {team.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {team.filter(a => a.bucket === 'high' || a.bucket === 'moderate').slice(0, 3).map((a) => (
                              <button
                                key={a.athlete_id}
                                onClick={() => sendCue(a.athlete_id, c.id)}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                              >
                                Send to {a.name.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Team Performance Trends */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Team Performance Trends - {selectedSeason}</span>
              </h3>
              <div className="h-64 flex items-end justify-between space-x-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((week) => {
                  const height = 30 + Math.random() * 70
                  const improving = week > 4
                  return (
                    <div key={week} className="flex-1 flex flex-col items-center">
                      <div 
                        className={`w-full rounded-t transition-all hover:opacity-80 cursor-pointer ${
                          improving ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ height: `${height}%`, minHeight: '20px' }}
                        title={`Week ${week}: ${(100 - height).toFixed(0)}% avg risk`}
                      />
                      <div className="text-xs text-gray-500 mt-2">W{week}</div>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Early Season</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Recent Improvement</span>
                </div>
              </div>
            </div>

            {/* Team Assessment Workflow */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <PlayCircle className="h-5 w-5" />
                <span>Team Movement Analysis</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => router.push('/live-monitoring?mode=team&assessment=quick')}
                  className="p-6 border-2 border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <Clock className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-bold text-gray-900">Quick Team Assessment</div>
                      <div className="text-sm text-gray-600">5-minute group warm-up analysis</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    Evaluate entire team during warm-up. Identifies high-risk patterns and provides immediate coaching recommendations.
                  </div>
                  <div className="mt-4 text-blue-600 font-medium flex items-center space-x-1">
                    <span>Start Assessment</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>

                <button
                  onClick={() => router.push('/live-monitoring?mode=individual')}
                  className="p-6 border-2 border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <Target className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-bold text-gray-900">Individual Assessment</div>
                      <div className="text-sm text-gray-600">15-minute detailed evaluation</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    Comprehensive movement analysis for specific athletes. Includes detailed biomechanics report and personalized training recommendations.
                  </div>
                  <div className="mt-4 text-green-600 font-medium flex items-center space-x-1">
                    <span>Start Assessment</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              </div>

              {/* Movement Quality by Context */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Movement Quality by Context</h4>
                <div className="space-y-3">
                  {['landing', 'cutting', 'pivoting', 'decelerating'].map((movement) => (
                    <div key={movement} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 capitalize">{movement}</span>
                        <span className="text-sm text-gray-600">
                          {Math.floor(team.length * 0.3)} athletes need improvement
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full"
                          style={{ width: `${60 + Math.random() * 30}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(60 + Math.random() * 30).toFixed(0)}% showing good form • {selectedSport} benchmark: 75%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pre/Post Season Comparison */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Season Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">2023-24 Season</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Risk Score:</span>
                      <span className="font-semibold">42%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Movement Quality:</span>
                      <span className="font-semibold">68%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Injuries:</span>
                      <span className="font-semibold text-red-600">3</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">{selectedSeason} (Current)</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Risk Score:</span>
                      <span className="font-semibold text-green-600">{(teamStats.avgRiskScore * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Movement Quality:</span>
                      <span className="font-semibold text-green-600">{teamStats.avgMovementQuality.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Injuries:</span>
                      <span className="font-semibold">{teamStats.recentInjuries}</span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 text-green-800">
                      <TrendingDownIcon className="h-4 w-4" />
                      <span className="text-sm font-semibold">Improvement: {teamStats.teamImprovement.toFixed(0)}% reduction in risk</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sport-Specific Benchmarks */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedSport} Movement Quality Benchmarks
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">75%+</div>
                    <div className="text-sm text-gray-600">Excellent</div>
                    <div className="text-xs text-gray-500 mt-1">Team avg: {teamStats.avgMovementQuality.toFixed(0)}%</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600">60-74%</div>
                    <div className="text-sm text-gray-600">Good</div>
                    <div className="text-xs text-gray-500 mt-1">Needs attention</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-600">&lt;60%</div>
                    <div className="text-sm text-gray-600">Needs Training</div>
                    <div className="text-xs text-gray-500 mt-1">Immediate intervention</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
