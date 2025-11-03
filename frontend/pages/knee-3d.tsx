import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, useGLTF, PerspectiveCamera, Environment, ContactShadows, Text3D, Center } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Wifi, WifiOff, RotateCcw, ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react'

import { API_URL } from '../utils/api'

type WebsocketFeedback = {
  risk_score: number
  warning: boolean
  message: string
}

type BiomechanicsDataPoint = {
  timestamp: string
  knee_angle: number
  hip_angle: number
  ankle_angle: number
  knee_valgus: number
  ground_reaction_force: number
  movement_type: string
}

// Animated Valgus Arc
function ValgusArc({ angleDeg, animated = false }: { angleDeg: number; animated?: boolean }) {
  const segments = 64
  const radius = 0.35
  const clamped = Math.max(0, Math.min(angleDeg, 30))
  const phi = (clamped * Math.PI) / 180
  
  const positions = useMemo(() => {
    const pts: number[] = []
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * phi
      pts.push(Math.sin(t) * radius, Math.cos(t) * radius, 0)
    }
    return new Float32Array(pts)
  }, [phi])
  
  const color = angleDeg > 18 ? '#ef4444' : angleDeg > 12 ? '#f59e0b' : '#10b981'
  
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color={color} linewidth={4} />
    </line>
  )
}

// Enhanced Tibial Plateau with pressure visualization
function TibialPlateau({ intensity, valgus }: { intensity: number; valgus: number }) {
  const emissive = intensity >= 1 ? Math.min(intensity / 3, 1) : 0
  const valgusEmissive = valgus > 15 ? 0.6 : 0.1
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.15, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshStandardMaterial 
          color="#8b8b8b" 
          emissive={valgus > 15 ? "#ef4444" : "#10b981"} 
          emissiveIntensity={valgusEmissive} 
          metalness={0.3} 
          roughness={0.5} 
        />
      </mesh>
      {/* Pressure indicator */}
      {intensity > 2.5 && (
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.14, 0]}>
          <circleGeometry args={[0.3, 32]} />
          <meshStandardMaterial 
            color="#ef4444" 
            emissive="#ef4444" 
            emissiveIntensity={Math.min((intensity - 2.5) / 2, 0.8)} 
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  )
}

// Enhanced anatomical knee bones with dynamic colors
function Femur({ valgus, grf }: { valgus: number; grf: number }) {
  // Femur color changes based on overall risk
  const riskLevel = (valgus > 18 || grf > 3) ? 'high' : (valgus > 12 || grf > 2.5) ? 'moderate' : 'low'
  const baseColor = riskLevel === 'high' ? '#ff9999' : riskLevel === 'moderate' ? '#ffe0b2' : '#e0e0e0'
  const emissiveColor = riskLevel === 'high' ? '#ef4444' : riskLevel === 'moderate' ? '#f59e0b' : '#000000'
  const emissiveIntensity = riskLevel === 'high' ? 0.4 : riskLevel === 'moderate' ? 0.2 : 0
  
  return (
    <mesh position={[0, 0.6, 0]} rotation={[0, 0, 0]}>
      <cylinderGeometry args={[0.12, 0.15, 0.4, 16]} />
      <meshStandardMaterial 
        color={baseColor} 
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity}
        metalness={0.3} 
        roughness={0.6} 
      />
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[0.25, 0.15, 0.2]} />
        <meshStandardMaterial 
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </mesh>
  )
}

function Tibia({ valgus, grf }: { valgus: number; grf: number }) {
  const rotation = (valgus * Math.PI) / 180
  
  // Tibia color based on valgus angle
  const tibiaColor = valgus > 18 ? '#ff9999' : valgus > 12 ? '#ffe0b2' : '#d9d9d9'
  const tibiaEmissive = valgus > 18 ? '#ef4444' : valgus > 12 ? '#f59e0b' : '#000000'
  const tibiaEmissiveIntensity = valgus > 18 ? 0.5 : valgus > 12 ? 0.3 : 0
  
  // Tibial plateau color based on GRF
  const plateauColor = grf > 3 ? '#ff6b6b' : grf > 2.5 ? '#ffa94d' : valgus > 15 ? '#ffcccc' : '#d0d0d0'
  const plateauEmissive = grf > 3 ? '#ef4444' : grf > 2.5 ? '#f59e0b' : valgus > 15 ? '#ef4444' : '#000000'
  const plateauEmissiveIntensity = grf > 3 ? 0.6 : grf > 2.5 ? 0.4 : valgus > 15 ? 0.3 : 0
  
  return (
    <group rotation={[0, 0, rotation]}>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 0.5, 16]} />
        <meshStandardMaterial 
          color={tibiaColor}
          emissive={tibiaEmissive}
          emissiveIntensity={tibiaEmissiveIntensity}
          metalness={0.25} 
          roughness={0.7} 
        />
      </mesh>
      <mesh position={[0, -0.35, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.35, 0.15, 0.18]} />
        <meshStandardMaterial 
          color={plateauColor}
          emissive={plateauEmissive}
          emissiveIntensity={plateauEmissiveIntensity}
        />
      </mesh>
    </group>
  )
}

// ACL Ligament visualization
function ACLLigament({ valgus, stress }: { valgus: number; stress: number }) {
  const color = valgus > 18 ? '#ef4444' : valgus > 12 ? '#f59e0b' : '#10b981'
  const intensity = Math.min(valgus / 30, 1) * 0.8
  
  return (
    <group>
      {/* ACL as connecting line from femur to tibia */}
      <mesh position={[0.08, 0.15, 0]} rotation={[0, 0, -0.7]}>
        <cylinderGeometry args={[0.015, 0.015, 0.4, 12]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={intensity}
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>
      {/* Stress indicator */}
      {stress > 2.5 && (
        <mesh position={[0.08, 0.05, 0]} rotation={[0, 0, -0.7]}>
          <sphereGeometry args={[0.025, 12, 12]} />
          <meshStandardMaterial 
            color="#ef4444" 
            emissive="#ef4444" 
            emissiveIntensity={0.9}
          />
        </mesh>
      )}
    </group>
  )
}

// Enhanced Knee Model
function EnhancedKnee({ valgus, grf }: { valgus: number; grf: number }) {
  return (
    <group>
      <Femur valgus={valgus} grf={grf} />
      <Tibia valgus={valgus} grf={grf} />
      <ACLLigament valgus={valgus} stress={grf} />
      <ValgusArc angleDeg={valgus} />
      <TibialPlateau intensity={grf} valgus={valgus} />
      
      {/* Labels */}
      <Html position={[0, 0.8, 0]} center>
        <div className="px-3 py-1.5 bg-gray-900/80 backdrop-blur-sm rounded-lg text-white text-xs font-medium shadow-lg border border-gray-700">
          Femur
        </div>
      </Html>
      <Html position={[0, -0.8, 0]} center>
        <div className="px-3 py-1.5 bg-gray-900/80 backdrop-blur-sm rounded-lg text-white text-xs font-medium shadow-lg border border-gray-700">
          Tibia
        </div>
      </Html>
      <Html position={[0.25, 0.15, 0]} center>
        <div className="px-2 py-1 bg-gray-900/80 backdrop-blur-sm rounded-lg text-white text-xs font-medium shadow-lg border border-gray-700">
          ACL
        </div>
      </Html>
    </group>
  )
}

// Load GLB model if available
function AnatomicalKneeModel({ valgus, grf, hasModel }: { valgus: number; grf: number; hasModel: boolean }) {
  // useGLTF hook must be called unconditionally (React rules)
  // Using the 'true' parameter makes it optional - won't throw if file doesn't exist
  const gltf = useGLTF('/models/knee.glb', true) as any
  
  // If model failed to load, return fallback
  if (!gltf || !gltf.scene) {
    return <EnhancedKnee valgus={valgus} grf={grf} />
  }
  
  try {
    const scene = gltf.scene?.clone()
    
    // Find and highlight ACL
    const acl = scene?.getObjectByName('ACL') || scene?.getObjectByName('AnteriorCruciateLigament') || 
                scene?.getObjectByName('acl') || scene?.traverse((obj: any) => {
                  if (obj.name?.toLowerCase().includes('acl') || obj.name?.toLowerCase().includes('cruciate')) {
                    return obj
                  }
                })
    
    if (acl && (acl as any).material) {
      try {
        const material = (acl as any).material
        const color = valgus > 18 ? '#ef4444' : valgus > 12 ? '#f59e0b' : '#10b981'
        if (material.emissive) {
          material.emissive.set(color)
          material.emissiveIntensity = Math.min(valgus / 30, 1) * 0.8
        }
      } catch {}
    }
    
    // Apply valgus rotation to tibia
    const tibia = scene?.getObjectByName('Tibia') || scene?.getObjectByName('tibia')
    if (tibia) {
      tibia.rotation.z = (valgus * Math.PI) / 180
    }
    
    return (
      <group scale={0.02} position={[0, -0.4, 0]}>
        {scene && <primitive object={scene} />}
        <ValgusArc angleDeg={valgus} />
        <TibialPlateau intensity={grf} valgus={valgus} />
      </group>
    )
  } catch {
    return null
  }
}

export default function Knee3D() {
  const [sessionId, setSessionId] = useState<number>(1)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [valgus, setValgus] = useState<number>(8)
  const [grf, setGrf] = useState<number>(2.0)
  const [connected, setConnected] = useState<boolean>(false)
  const [hasModel, setHasModel] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'anatomical' | 'schematic' | 'sketchfab'>('anatomical')
  const [showLabels, setShowLabels] = useState<boolean>(true)
  const [cameraReset, setCameraReset] = useState(0)
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (ws) ws.close()
    }
  }, [ws])

  const connect = () => {
    const wsUrl = API_URL.replace('http://', 'ws://').replace('https://', 'wss://')
    const socket = new WebSocket(`${wsUrl}/ws/biomechanics/${sessionId}`)
    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)
    socket.onerror = () => setConnected(false)
    socket.onmessage = (evt) => {
      try {
        const fb: WebsocketFeedback = JSON.parse(evt.data)
        // Feedback available
      } catch {}
    }
    setWs(socket)
  }

  const disconnect = () => {
    if (ws) {
      ws.close()
      setWs(null)
      setConnected(false)
    }
  }

  useEffect(() => {
    if (!connected || !ws) return
    const interval = setInterval(() => {
      const isHigh = Math.random() > 0.7
      const data: BiomechanicsDataPoint = {
        timestamp: new Date().toISOString(),
        knee_angle: 165 + Math.random() * 8,
        hip_angle: 170 + Math.random() * 6,
        ankle_angle: 90 + Math.random() * 4,
        knee_valgus: isHigh ? 18 + Math.random() * 6 : 8 + Math.random() * 6,
        ground_reaction_force: isHigh ? 3.4 + Math.random() * 1.0 : 2.0 + Math.random() * 0.8,
        movement_type: ['landing', 'cutting', 'pivoting'][Math.floor(Math.random() * 3)]
      }
      setValgus(data.knee_valgus)
      setGrf(data.ground_reaction_force)
      ws.send(JSON.stringify(data))
    }, 1000)
    return () => clearInterval(interval)
  }, [connected, ws])

  // Check if GLB model exists - with better error handling
  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout
    
    const checkModel = async () => {
      try {
        const controller = new AbortController()
        timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
        
        const res = await fetch('/models/knee.glb', { 
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        })
        
        clearTimeout(timeoutId)
        if (!isMounted) return
        setHasModel(res.ok && res.status === 200)
      } catch (err: any) {
        clearTimeout(timeoutId)
        if (!isMounted) return
        // Silently fail - model doesn't exist, use fallback
        setHasModel(false)
      }
    }
    
    checkModel()
    
    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const resetCamera = () => {
    setCameraReset(prev => prev + 1)
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Interactive 3D Knee Model</h1>
            <p className="text-gray-400">Real-time visualization of knee biomechanics and ACL stress</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-800 rounded-lg">
              {connected ? (
                <>
                  <Wifi className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 text-sm">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-500 text-sm">Disconnected</span>
                </>
              )}
            </div>
            {!connected ? (
              <button 
                onClick={connect} 
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Wifi className="h-4 w-4" />
                <span>Connect</span>
              </button>
            ) : (
              <button 
                onClick={disconnect} 
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Knee Valgus</div>
            <div className={`text-3xl font-bold mb-1 ${
              valgus > 18 ? 'text-red-400' : valgus > 12 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {valgus.toFixed(1)}°
            </div>
            <div className="text-xs text-gray-500">
              {valgus > 18 ? 'High Risk' : valgus > 12 ? 'Moderate Risk' : 'Low Risk'}
            </div>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Ground Reaction Force</div>
            <div className={`text-3xl font-bold mb-1 ${
              grf > 3 ? 'text-red-400' : grf > 2.5 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {grf.toFixed(2)}x BW
            </div>
            <div className="text-xs text-gray-500">
              {grf > 3 ? 'High Impact' : grf > 2.5 ? 'Moderate' : 'Normal'}
            </div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">ACL Stress</div>
            <div className={`text-3xl font-bold mb-1 ${
              valgus > 18 && grf > 3 ? 'text-red-400' : valgus > 12 || grf > 2.5 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {((valgus / 30 + grf / 4) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">Estimated</div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Status</div>
            <div className={`text-3xl font-bold mb-1 ${
              connected ? 'text-green-400' : 'text-gray-500'
            }`}>
              {connected ? 'LIVE' : 'IDLE'}
            </div>
            <div className="text-xs text-gray-500">
              {connected ? 'Real-time data' : 'No connection'}
            </div>
          </div>
        </div>

        {/* Sketchfab Model with Color Overlays */}
        <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700" style={{ height: '700px' }}>
          <div className="w-full h-full relative">
            <iframe
              title="3D View Knee"
              frameBorder="0"
              allowFullScreen={true}
              mozAllowFullScreen={true}
              webkitAllowFullScreen={true}
              allow="autoplay; fullscreen; xr-spatial-tracking"
              className="w-full h-full"
              style={{ border: 0 }}
              src="https://sketchfab.com/models/cf12c00c2c31481691e254f4c851757f/embed?autospin=0.2&autostart=0&preload=1&ui_controls=1&ui_infos=1&ui_inspector=1&ui_stop=1&ui_watermark=0&ui_watermark_link=0"
            />
            
            {/* Data Display */}
            <div className="absolute top-2 right-2 bg-gray-900/95 backdrop-blur-md px-2 py-1.5 rounded border border-gray-700 shadow-lg z-10">
              <div className="space-y-1">
                <div className="flex items-center justify-between space-x-2">
                  <span className="text-gray-400 text-[10px]">Valgus:</span>
                  <span className={`text-xs font-semibold ${
                    valgus > 18 ? 'text-red-400' : valgus > 12 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {valgus.toFixed(1)}°
                  </span>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <span className="text-gray-400 text-[10px]">GRF:</span>
                  <span className={`text-xs font-semibold ${
                    grf > 3 ? 'text-red-400' : grf > 2.5 ? 'text-orange-400' : 'text-green-400'
                  }`}>
                    {grf.toFixed(2)}x BW
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Valgus Angle Explanation</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <span className="text-green-400 font-medium">Low (0-12°):</span> Optimal knee alignment
              </p>
              <p>
                <span className="text-yellow-400 font-medium">Moderate (12-18°):</span> Risk of ACL stress
              </p>
              <p>
                <span className="text-red-400 font-medium">High (18°+):</span> High ACL injury risk
              </p>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-400">
                  Valgus angle measures how much your knee collapses inward. Higher angles indicate increased ACL stress and injury risk.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">ACL Stress Indicators</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-green-400"></div>
                <span className="text-sm text-gray-300">Normal stress - Safe movement</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                <span className="text-sm text-gray-300">Elevated stress - Monitor closely</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-red-400"></div>
                <span className="text-sm text-gray-300">High stress - Injury risk present</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  The ACL (red/pink ligament) changes color based on stress levels. Red indicates high stress requiring immediate attention.
                </p>
              </div>
            </div>
          </div>
        </div>

        {!hasModel && (
          <div className="mt-6 bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4">
            <p className="text-sm text-yellow-200">
              💡 <strong>Tip:</strong> Add a detailed knee model at <code className="bg-gray-800 px-2 py-1 rounded">/public/models/knee.glb</code> for enhanced anatomical visualization.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
