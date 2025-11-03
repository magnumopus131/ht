import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { Upload, MessageSquare, AlertTriangle, CheckCircle, XCircle, FileImage, Camera, Video, X, Stethoscope, Activity } from 'lucide-react'

import { API_URL } from '../utils/api'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  analysisId?: number
}

type XRayAnalysis = {
  id: number
  athlete_id: number
  has_fracture: boolean
  has_alignment_issue: boolean
  joint_spacing_abnormal: boolean
  severity: string
  triage_recommendation: string
  findings: string
  educational_explanation: string
  confidence_score?: number
  uploaded_at: string
}

export default function XRayChat() {
  const [athleteId, setAthleteId] = useState<number>(1)
  const [athleteName, setAthleteName] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your X-ray analysis assistant. Upload a knee or leg X-ray image or use your camera to capture one, and I'll help analyze it for fractures, alignment issues, and joint spacing abnormalities.",
      timestamp: new Date()
    }
  ])
  const [uploading, setUploading] = useState(false)
  const [analyses, setAnalyses] = useState<XRayAnalysis[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Camera setup
  useEffect(() => {
    if (cameraActive && videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraActive, stream])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      setStream(mediaStream)
      setCameraActive(true)
    } catch (error: any) {
      const errorMsg: Message = {
        role: 'assistant',
        content: `❌ Camera access denied or not available: ${error.message}. Please ensure you're using HTTPS or localhost, and grant camera permissions.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraActive(false)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Set canvas size to video size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob and upload
    canvas.toBlob(async (blob) => {
      if (!blob) return

      // Create File from blob
      const file = new File([blob], `xray_${Date.now()}.jpg`, { type: 'image/jpeg' })
      
      // Use existing upload handler
      const fakeEvent = {
        target: {
          files: [file]
        }
      } as any

      await handleFileUpload(fakeEvent)
      stopCamera()
    }, 'image/jpeg', 0.95)
  }

  useEffect(() => {
    if (athleteId) {
      loadAnalyses()
      // Load athlete name
      axios.get(`${API_URL}/users/${athleteId}`).then(res => {
        setAthleteName(res.data.name || `Athlete ${athleteId}`)
      }).catch(() => setAthleteName(`Athlete ${athleteId}`))
    }
  }, [athleteId])


  const loadAnalyses = async () => {
    try {
      const res = await axios.get<XRayAnalysis[]>(`${API_URL}/athletes/${athleteId}/xray-analyses`)
      setAnalyses(res.data)
    } catch (error) {
      console.error('Error loading analyses:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('athlete_id', athleteId.toString())

    try {
      // Add user message
      const userMsg: Message = {
        role: 'user',
        content: `Uploaded X-ray: ${file.name}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMsg])

      // Upload and analyze
      const res = await axios.post<XRayAnalysis>(`${API_URL}/xray/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const analysis = res.data

      // Format analysis response
      const severityEmoji = {
        normal: '✅',
        minor: '⚠️',
        moderate: '⚠️',
        severe: '🚨',
        critical: '🚨'
      }[analysis.severity] || '✅'

      const triageColor = {
        routine: 'text-green-600',
        urgent: 'text-yellow-600',
        emergency: 'text-red-600'
      }[analysis.triage_recommendation] || 'text-gray-600'

      let responseText = `${severityEmoji} **Analysis Complete**\n\n`
      responseText += `**Findings:** ${analysis.findings}\n\n`
      responseText += `**Severity:** ${analysis.severity.toUpperCase()}\n`
      responseText += `**Triage:** <span class="${triageColor}">${analysis.triage_recommendation.toUpperCase()}</span>\n\n`
      
      if (analysis.has_fracture) {
        responseText += `🔴 **Fracture Detected:** Possible fracture in tibial or femoral region\n\n`
      }
      if (analysis.has_alignment_issue) {
        responseText += `⚠️ **Alignment Issue:** Bones may not be positioned normally\n\n`
      }
      if (analysis.joint_spacing_abnormal) {
        responseText += `📏 **Joint Spacing:** Abnormal spacing detected\n\n`
      }
      
      responseText += `**Educational Explanation:**\n${analysis.educational_explanation}\n\n`
      responseText += `**Confidence:** ${((analysis.confidence_score || 0) * 100).toFixed(0)}%`

      const assistantMsg: Message = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        analysisId: analysis.id
      }
      setMessages(prev => [...prev, assistantMsg])

      // Reload analyses
      await loadAnalyses()
    } catch (error: any) {
      console.error('Upload error:', error)
      const errorDetail = error.response?.data?.detail || error.message || 'Unknown error'
      const errorMsg: Message = {
        role: 'assistant',
        content: `❌ Error analyzing image: ${errorDetail}\n\nMake sure:\n1. Backend is running on ${API_URL}\n2. Athlete ID ${athleteId} exists\n3. Image file is valid (JPG, PNG)`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }


  return (
    <div className="min-h-screen bg-[#1a2332] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-400 rounded-lg">
                <Stethoscope className="h-6 w-6 text-[#1a2332]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">AI X-ray Analysis</h1>
                <p className="text-gray-400">Upload knee or leg X-ray images for AI-powered analysis</p>
              </div>
            </div>
            {athleteName && (
              <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg">
                <span className="text-white text-sm font-medium">{athleteName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2 bg-transparent border border-white/10 rounded-lg flex flex-col" style={{ height: '600px' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/text-green-600|text-yellow-600|text-red-600/g, 'text-white') }} />
                    <div className="text-xs mt-1 opacity-70 text-gray-400">
                      {format(msg.timestamp, 'HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
              {uploading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="text-sm text-white">Analyzing X-ray...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Camera Preview */}
            {cameraActive && (
              <div className="border-t border-white/10 p-4 bg-black/50">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-w-md mx-auto rounded-lg border border-white/10"
                    style={{ maxHeight: '400px' }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={stopCamera}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex justify-center mt-4 space-x-3">
                    <button
                      onClick={capturePhoto}
                      className="bg-yellow-400 hover:bg-yellow-500 text-[#1a2332] rounded-full p-4 shadow-lg font-semibold"
                    >
                      <Camera className="h-8 w-8" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Area */}
            {!cameraActive && (
              <div className="border-t border-white/10 p-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={startCamera}
                    className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                  >
                    <Camera className="h-5 w-5" />
                    <span>Use Camera</span>
                  </button>
                  <label className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="cursor-pointer border-2 border-dashed border-white/20 rounded-lg p-4 hover:border-yellow-400/50 transition-colors text-center bg-white/5">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                      <span className="text-sm text-white font-medium">
                        {uploading ? 'Analyzing X-ray...' : 'Click to upload X-ray image'}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">Knee or leg X-ray (JPG, PNG)</p>
                    </div>
                  </label>
                </div>
                <div className="mt-2 text-xs text-gray-400 text-center">
                  📱 Mobile: Use camera button | 💻 Desktop: Upload from file
                </div>
              </div>
            )}
          </div>

          {/* Analysis History */}
          <div className="bg-transparent border border-white/10 rounded-lg p-4" style={{ height: '600px', overflowY: 'auto' }}>
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="h-5 w-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Analysis History</h2>
            </div>
            {analyses.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <FileImage className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                <p className="text-sm">No analyses yet</p>
                <p className="text-xs mt-1">Upload an X-ray to see results here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analyses.map((analysis) => {
                  const severityColor = analysis.severity === 'critical' || analysis.severity === 'severe' ? 'bg-red-400' :
                                      analysis.severity === 'moderate' ? 'bg-yellow-400' :
                                      analysis.severity === 'minor' ? 'bg-blue-400' : 'bg-green-400'
                  return (
                    <div
                      key={analysis.id}
                      className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-1 h-12 ${severityColor} rounded-full`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-white uppercase">{analysis.severity}</span>
                            <span className="text-xs text-gray-400">
                              {format(new Date(analysis.uploaded_at), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <div className="text-sm text-white mb-2">{analysis.findings}</div>
                          <div className="flex items-center space-x-2 text-xs mb-2">
                            {analysis.has_fracture && <span className="bg-red-500/30 text-red-300 px-2 py-1 rounded border border-red-500/50">Fracture</span>}
                            {analysis.has_alignment_issue && <span className="bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded border border-yellow-500/50">Alignment</span>}
                            {analysis.joint_spacing_abnormal && <span className="bg-blue-500/30 text-blue-300 px-2 py-1 rounded border border-blue-500/50">Spacing</span>}
                          </div>
                          <div className="text-xs text-gray-400">
                            Triage: <span className="font-semibold text-white">{analysis.triage_recommendation}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Athlete Selector */}
        <div className="mt-6 bg-transparent border border-white/10 rounded-lg p-4">
          <label className="block text-sm font-medium text-white mb-2">
            Athlete Profile {athleteName && <span className="text-yellow-400">({athleteName})</span>}
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={athleteId}
              onChange={(e) => setAthleteId(parseInt(e.target.value) || 1)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg w-32 text-white placeholder-gray-400"
              min="1"
            />
            <span className="text-sm text-gray-400">
              ID: 1 (Emily), 2 (James), 3 (Sarah) - or create new athlete
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            💡 <strong className="text-white">Demo Tip:</strong> Upload any image file to see the AI analysis. The system will analyze the image and provide detailed findings.
          </p>
        </div>

      </div>
    </div>
  )
}

