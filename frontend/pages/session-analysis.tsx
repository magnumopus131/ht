import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, PerspectiveCamera, Environment, ContactShadows, Text3D } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { ArrowLeft, Activity, TrendingUp, AlertTriangle, CheckCircle2, Clock, BarChart3 } from 'lucide-react'
import * as THREE from 'three'
import axios from 'axios'

import { API_URL } from '../utils/api'

type MuscleActivation = {
  [key: string]: {
    total: number
    peak: number
    avg: number
  }
}

type SessionAnalysis = {
  session: {
    id: number
    athlete_id: number
    session_type: string
    sport: string
    duration_minutes: number
    start_time: string
    end_time: string
  }
  statistics: {
    total_movements: number
    high_risk_movements: number
    high_risk_percentage: number
    avg_knee_valgus: number
    avg_ground_reaction_force: number
    peak_impact_force: number
    movement_types: { [key: string]: number }
  }
  muscle_activation: MuscleActivation
  biomechanics_timeline: Array<{
    timestamp: string
    knee_angle: number
    hip_angle: number
    ankle_angle: number
    knee_valgus: number
    ground_reaction_force: number
    movement_type: string
    risk_score: number
  }>
}

// Muscle groups with anatomical positions and shapes
const MUSCLE_CONFIG: { 
  [key: string]: { 
    position: [number, number, number]
    shape: 'cylinder' | 'ellipsoid' | 'torus' | 'box'
    dimensions: [number, number, number]
    rotation?: [number, number, number]
  } 
} = {
  quadriceps: { 
    position: [0, 0.4, 0.05], 
    shape: 'cylinder',
    dimensions: [0.12, 0.45, 0.12],
    rotation: [0, 0, 0]
  },
  hamstrings: { 
    position: [0, 0.25, -0.08], 
    shape: 'cylinder',
    dimensions: [0.1, 0.4, 0.1],
    rotation: [0, 0, 0]
  },
  glutes: { 
    position: [0, 0.65, 0], 
    shape: 'ellipsoid',
    dimensions: [0.35, 0.2, 0.25],
    rotation: [0, 0, 0]
  },
  calves: { 
    position: [0, -0.45, 0.05], 
    shape: 'cylinder',
    dimensions: [0.09, 0.35, 0.09],
    rotation: [0, 0, 0]
  },
  hip_flexors: { 
    position: [0, 0.55, 0.15], 
    shape: 'cylinder',
    dimensions: [0.08, 0.25, 0.08],
    rotation: [Math.PI / 6, 0, 0]
  },
  hip_adductors: { 
    position: [-0.1, 0.45, 0], 
    shape: 'cylinder',
    dimensions: [0.07, 0.3, 0.07],
    rotation: [0, 0, Math.PI / 4]
  },
  hip_abductors: { 
    position: [0.1, 0.45, 0], 
    shape: 'cylinder',
    dimensions: [0.07, 0.3, 0.07],
    rotation: [0, 0, -Math.PI / 4]
  },
  core: { 
    position: [0, 0.8, 0], 
    shape: 'box',
    dimensions: [0.3, 0.4, 0.2],
    rotation: [0, 0, 0]
  },
}

// Muscle color mapping with smooth gradients
function getMuscleColor(activation: number): string {
  if (activation >= 70) return '#dc2626' // Bright red
  if (activation >= 50) return '#ea580c' // Orange-red
  if (activation >= 30) return '#f59e0b' // Orange
  if (activation >= 20) return '#eab308' // Yellow-orange
  if (activation >= 15) return '#22c55e' // Green
  if (activation >= 10) return '#3b82f6' // Blue
  return '#64748b' // Gray
}

// Get muscle display name
function getMuscleDisplayName(name: string): string {
  const names: { [key: string]: string } = {
    quadriceps: 'Quadriceps',
    hamstrings: 'Hamstrings',
    glutes: 'Glutes',
    calves: 'Calves',
    hip_flexors: 'Hip Flexors',
    hip_adductors: 'Hip Adductors',
    hip_abductors: 'Hip Abductors',
    core: 'Core'
  }
  return names[name] || name
}

// Individual muscle mesh with anatomical shape
function MuscleMesh({ 
  name, 
  activation, 
  config
}: { 
  name: string
  activation: number
  config: typeof MUSCLE_CONFIG[string]
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const color = getMuscleColor(activation)
  const intensity = Math.min(activation / 100, 1)
  const opacity = activation > 10 ? 0.9 : 0.3
  
  useFrame((state) => {
    if (meshRef.current && activation > 20) {
      // Subtle breathing effect for active muscles
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.03
      meshRef.current.scale.setScalar(pulse)
    }
  })

  const rotation = config.rotation || [0, 0, 0]

  // Create shape based on config
  let geometry: JSX.Element
  switch (config.shape) {
    case 'cylinder':
      geometry = <cylinderGeometry args={[config.dimensions[0], config.dimensions[0], config.dimensions[1], 32]} />
      break
    case 'ellipsoid':
      // Create ellipsoid using unit sphere that will be scaled
      geometry = <sphereGeometry args={[1, 32, 16]} />
      break
    case 'box':
      geometry = <boxGeometry args={config.dimensions} />
      break
    default:
      geometry = <sphereGeometry args={[config.dimensions[0], 32, 16]} />
  }

  return (
    <group position={config.position} rotation={rotation}>
      <mesh 
        ref={meshRef}
        scale={config.shape === 'ellipsoid' ? [
          config.dimensions[0],
          config.dimensions[1],
          config.dimensions[2]
        ] : [1, 1, 1]}
      >
        {geometry}
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={intensity * 0.7}
          metalness={0.2}
          roughness={0.5}
          transparent
          opacity={opacity}
        />
      </mesh>
      
      {/* Highlight ring for high activation */}
      {activation > 50 && (
        <mesh position={[0, 0, config.dimensions[2] / 2 + 0.02]}>
          <ringGeometry args={[config.dimensions[0] * 1.1, config.dimensions[0] * 1.3, 32]} />
          <meshStandardMaterial 
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
      
      {/* Label for active muscles */}
      {activation > 15 && (
        <Html position={[0, config.dimensions[1] / 2 + 0.15, 0]} center>
          <div className="px-3 py-1.5 bg-gray-900/95 backdrop-blur-md rounded-lg text-white text-xs font-semibold shadow-xl border-2 border-gray-700 whitespace-nowrap transform -translate-y-1/2">
            <div className="flex items-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>{getMuscleDisplayName(name)}</span>
            </div>
            <div className="text-yellow-400 font-bold text-sm mt-0.5">
              {activation.toFixed(0)}%
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// Enhanced anatomical skeleton
function AnatomicalSkeleton() {
  return (
    <group>
      {/* Pelvis */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.4, 0.15, 0.25]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.2} roughness={0.7} />
      </mesh>
      
      {/* Left Femur */}
      <mesh position={[-0.1, 0.4, 0]} rotation={[0, 0, 0.05]}>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 16]} />
        <meshStandardMaterial color="#e4e4e7" metalness={0.25} roughness={0.6} />
      </mesh>
      
      {/* Right Femur */}
      <mesh position={[0.1, 0.4, 0]} rotation={[0, 0, -0.05]}>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 16]} />
        <meshStandardMaterial color="#e4e4e7" metalness={0.25} roughness={0.6} />
      </mesh>
      
      {/* Left Knee Joint */}
      <group position={[-0.1, 0.15, 0]}>
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.2, 0.12, 0.1]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.2} roughness={0.6} />
        </mesh>
      </group>
      
      {/* Right Knee Joint */}
      <group position={[0.1, 0.15, 0]}>
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.2, 0.12, 0.1]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.2} roughness={0.6} />
        </mesh>
      </group>
      
      {/* Left Tibia */}
      <mesh position={[-0.1, -0.3, 0]} rotation={[0, 0, -0.02]}>
        <cylinderGeometry args={[0.07, 0.09, 0.6, 16]} />
        <meshStandardMaterial color="#e4e4e7" metalness={0.25} roughness={0.7} />
      </mesh>
      
      {/* Right Tibia */}
      <mesh position={[0.1, -0.3, 0]} rotation={[0, 0, 0.02]}>
        <cylinderGeometry args={[0.07, 0.09, 0.6, 16]} />
        <meshStandardMaterial color="#e4e4e7" metalness={0.25} roughness={0.7} />
      </mesh>
      
      {/* Left Ankle */}
      <mesh position={[-0.1, -0.6, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.5} />
      </mesh>
      
      {/* Right Ankle */}
      <mesh position={[0.1, -0.6, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  )
}

// Full body muscle visualization with realistic anatomy
function MuscleVisualization({ muscleActivation }: { muscleActivation: MuscleActivation }) {
  return (
    <group>
      {/* Anatomical Skeleton */}
      <AnatomicalSkeleton />
      
      {/* Render all muscles with anatomical shapes */}
      {Object.entries(MUSCLE_CONFIG).map(([muscleName, config]) => {
        const activation = muscleActivation[muscleName]?.avg || 0
        return (
          <MuscleMesh
            key={muscleName}
            name={muscleName}
            activation={activation}
            config={config}
          />
        )
      })}
      
      {/* Center label */}
      <Html position={[0, 1.4, 0]} center>
        <div className="px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-800 backdrop-blur-md rounded-lg text-white text-sm font-bold shadow-2xl border-2 border-gray-700">
          💪 Muscle Activation Heat Map
        </div>
      </Html>
      
      {/* Legend */}
      <Html position={[-1.5, 0, 0]} center>
        <div className="bg-gray-900/95 backdrop-blur-md rounded-lg p-3 shadow-xl border-2 border-gray-700 text-white text-xs">
          <div className="font-bold mb-2">Activation Level</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-gray-500"></div>
              <span>0-15%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>15-20%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>20-30%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span>30-50%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span>50-70%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-600"></div>
              <span>70%+</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  )
}

export default function SessionAnalysis() {
  const router = useRouter()
  const { sessionId } = router.query
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimePoint, setSelectedTimePoint] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'custom' | 'sketchfab'>('custom')

  useEffect(() => {
    if (!sessionId) return
    
    const fetchAnalysis = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_URL}/sessions/${sessionId}/analysis`)
        setAnalysis(response.data)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load session analysis')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnalysis()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading session analysis...</p>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error || 'Session not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const { session, statistics, muscle_activation, biomechanics_timeline } = analysis

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Session Analysis</h1>
              <p className="text-gray-400 text-sm mt-1">
                {session.sport} • {session.session_type} • {new Date(session.start_time).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400">{session.duration_minutes} minutes</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">Total Movements</div>
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold">{statistics.total_movements}</div>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">High Risk</div>
              {statistics.high_risk_percentage > 20 ? (
                <AlertTriangle className="h-5 w-5 text-red-400" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              )}
            </div>
            <div className={`text-3xl font-bold ${
              statistics.high_risk_percentage > 20 ? 'text-red-400' : 'text-green-400'
            }`}>
              {statistics.high_risk_percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {statistics.high_risk_movements} movements
            </div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">Avg Valgus</div>
              <TrendingUp className="h-5 w-5 text-yellow-400" />
            </div>
            <div className={`text-3xl font-bold ${
              statistics.avg_knee_valgus > 15 ? 'text-red-400' : 
              statistics.avg_knee_valgus > 10 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {statistics.avg_knee_valgus.toFixed(1)}°
            </div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">Peak Impact</div>
              <BarChart3 className="h-5 w-5 text-orange-400" />
            </div>
            <div className={`text-3xl font-bold ${
              statistics.peak_impact_force > 3 ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {statistics.peak_impact_force.toFixed(2)}x BW
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 3D Visualization Container */}
          <div className="lg:col-span-2 bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col" style={{ height: '600px' }}>
            <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold">3D Muscle Activation</h2>
                <p className="text-sm text-gray-400">Visual representation of muscle activity during session</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    console.log('Switching to custom view')
                    setViewMode('custom')
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Custom View
                </button>
                <button
                  onClick={() => {
                    console.log('Switching to sketchfab view')
                    setViewMode('sketchfab')
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'sketchfab'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Anatomical Model
                </button>
              </div>
            </div>
            
            <div className="flex-1 relative" style={{ minHeight: 0 }}>
            {/* Custom 3D Visualization */}
            {viewMode === 'custom' && (
              <div className="absolute inset-0">
              <Canvas 
                camera={{ position: [2.5, 2, 2.5], fov: 45 }}
                gl={{ 
                  antialias: true, 
                  alpha: false,
                  powerPreference: "high-performance"
                }}
              >
                <color attach="background" args={['#0a0a0f']} />
                
                {/* Enhanced Lighting */}
                <ambientLight intensity={0.5} />
                <directionalLight 
                  position={[5, 10, 5]} 
                  intensity={1.5} 
                  castShadow 
                  shadow-mapSize-width={2048}
                  shadow-mapSize-height={2048}
                />
                <directionalLight position={[-5, 4, -5]} intensity={0.8} />
                <directionalLight position={[0, 8, -5]} intensity={0.6} />
                <pointLight position={[2, 6, 2]} intensity={0.5} color="#ffffff" />
                <pointLight position={[-2, 4, -2]} intensity={0.3} color="#88ccff" />
                
                {/* Environment and Shadows */}
                <Environment preset="studio" />
                <ContactShadows 
                  opacity={0.5} 
                  scale={15} 
                  blur={3} 
                  far={6} 
                  position={[0, -0.8, 0]}
                  color="#000000"
                />
                
                {/* Subtle grid for depth */}
                <gridHelper 
                  args={[12, 12, '#2a2a3a', '#1a1a2a']} 
                  position={[0, -0.8, 0]} 
                  rotation={[0, 0, 0]}
                />
                
                {/* Main Visualization */}
                <Suspense fallback={null}>
                  <MuscleVisualization muscleActivation={muscle_activation} />
                </Suspense>
                
                {/* Smooth Controls */}
                <OrbitControls 
                  enablePan 
                  enableZoom 
                  enableRotate
                  minDistance={1.8}
                  maxDistance={10}
                  minPolarAngle={Math.PI / 6}
                  maxPolarAngle={Math.PI / 1.5}
                  dampingFactor={0.05}
                  enableDamping
                />
              </Canvas>
              </div>
            )}
            
            {/* Sketchfab Embed */}
            {viewMode === 'sketchfab' && (
              <div className="absolute inset-0 w-full h-full">
                <iframe
                  title="3D View Knee"
                  frameBorder="0"
                  allowFullScreen={true}
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  className="w-full h-full"
                  style={{ border: 0 }}
                  src="https://sketchfab.com/models/cf12c00c2c31481691e254f4c851757f/embed?autospin=0.2&autostart=0&preload=1&ui_controls=1&ui_infos=1&ui_inspector=1&ui_stop=1&ui_watermark=0&ui_watermark_link=0"
                />
              </div>
            )}
            </div>
          </div>

          {/* Muscle Activity List */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Muscle Activity Summary</h2>
            <div className="space-y-3 max-h-[540px] overflow-y-auto">
              {Object.entries(muscle_activation)
                .sort((a, b) => (b[1].avg || 0) - (a[1].avg || 0))
                .map(([muscle, data]) => (
                <div key={muscle} className="bg-gray-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">
                      {muscle.replace('_', ' ')}
                    </span>
                    <span className={`text-sm font-bold ${
                      data.avg >= 70 ? 'text-red-400' :
                      data.avg >= 50 ? 'text-orange-400' :
                      data.avg >= 30 ? 'text-green-400' :
                      data.avg >= 15 ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {data.avg.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${data.avg}%`,
                        backgroundColor: getMuscleColor(data.avg),
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Peak: {data.peak.toFixed(0)}%</span>
                    <span>Total: {data.total.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Movement Timeline */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6">
          <h2 className="text-lg font-semibold mb-4">Movement Timeline</h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {biomechanics_timeline.map((point, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedTimePoint === idx 
                    ? 'bg-blue-900/50 border-2 border-blue-500' 
                    : 'bg-gray-900/50 border border-gray-700 hover:bg-gray-900/70'
                }`}
                onClick={() => setSelectedTimePoint(idx === selectedTimePoint ? null : idx)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      point.risk_score > 0.7 ? 'bg-red-400' :
                      point.risk_score > 0.5 ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <span className="text-sm font-medium capitalize">{point.movement_type}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(point.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs">
                    <span>Valgus: <span className="font-bold">{point.knee_valgus.toFixed(1)}°</span></span>
                    <span>GRF: <span className="font-bold">{point.ground_reaction_force.toFixed(2)}x</span></span>
                    <span className={`font-bold ${
                      point.risk_score > 0.7 ? 'text-red-400' :
                      point.risk_score > 0.5 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      Risk: {(point.risk_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Movement Type Distribution */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Movement Type Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statistics.movement_types).map(([type, count]) => {
              const percentage = (count / statistics.total_movements) * 100
              return (
                <div key={type} className="bg-gray-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold mb-1">{count}</div>
                  <div className="text-sm text-gray-400 capitalize mb-2">{type}</div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

