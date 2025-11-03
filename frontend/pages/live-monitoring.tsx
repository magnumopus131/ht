import { useState, useEffect, useRef } from 'react'
import { Wifi, WifiOff, Monitor, Smartphone, X, Activity, AlertTriangle, Volume2, VolumeX } from 'lucide-react'
import { Pose } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { API_URL } from '../utils/api'

// Custom connections for legs only (lower body)
const LEG_CONNECTIONS = [
  [23, 24], // Left hip to Right hip
  [23, 25], // Left hip to Left knee
  [24, 26], // Right hip to Right knee
  [25, 27], // Left knee to Left ankle
  [26, 28], // Right knee to Right ankle
]

type CameraMode = 'wearable' | 'desktop' | 'mobile' | null

declare global {
  interface Window {
    cv: any
  }
}

export default function LiveMonitoring() {
  const [cameraMode, setCameraMode] = useState<CameraMode>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [networkIP, setNetworkIP] = useState<string>('')
  const [opencvReady, setOpencvReady] = useState(false)
  const [legDetected, setLegDetected] = useState(false)
  const [scanMode, setScanMode] = useState<'continuous' | 'single'>('single')
  const [scanCompleted, setScanCompleted] = useState(false)
  const [aclRisk, setAclRisk] = useState<{
    kneeAngle: number | null
    valgusAngle: number | null
    riskLevel: 'low' | 'moderate' | 'high'
    message: string
  }>({ kneeAngle: null, valgusAngle: null, riskLevel: 'low', message: '' })
  // AI Coach audio feedback
  const [coachEnabled, setCoachEnabled] = useState(false)
  const lastFeedbackTimeRef = useRef<number>(0)
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const lastFeedbackTypeRef = useRef<string>('')
  const animationFrameRef = useRef<number | null>(null)
  const backgroundSubtractorRef = useRef<any>(null)
  const poseRef = useRef<Pose | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  const isInitializingRef = useRef(false)
  // Smoothing buffers for stable detection
  const landmarkBufferRef = useRef<Array<{x: number, y: number, visibility: number}>[]>([])
  const lastSmoothedPositionsRef = useRef<Map<number, {x: number, y: number}>>(new Map())
  const SMOOTHING_BUFFER_SIZE = 20 // Average over 20 frames for maximum stability
  const SMOOTHING_ALPHA = 0.1 // Very low exponential smoothing (very stable, slower response)
  const MAX_POSITION_CHANGE = 0.05 // Reject movements larger than 5% of canvas size (dead zone)
  
  // Get user name from localStorage
  const [userName, setUserName] = useState<string>('Athlete')
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('user_name')
      if (name) {
        setUserName(name.split(' ')[0])
      }
      // Initialize speech synthesis
      speechSynthesisRef.current = window.speechSynthesis
    }
  }, [])

  // Suppress OpenCV WASM errors (conflicts with MediaPipe)
  useEffect(() => {
    const originalError = window.onerror
    window.onerror = (message, source, lineno, colno, error: any) => {
      const errorMsg = error?.message || message?.toString() || ''
      if (errorMsg.includes('Module.arguments') || 
          errorMsg.includes('arguments_') ||
          errorMsg.includes('pose_solution_simd_wasm_bin')) {
        // Suppress MediaPipe/OpenCV WASM conflicts
        return true
      }
      if (originalError) {
        return originalError(message, source, lineno, colno, error)
      }
      return false
    }
    
    return () => {
      window.onerror = originalError
    }
  }, [])

  // Load OpenCV.js
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Check if already loaded and initialized
    if (window.cv && window.cv.Mat && typeof window.cv.Mat === 'function') {
      console.log('✅ OpenCV.js already loaded')
      setOpencvReady(true)
      return
    }
    
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="opencv.js"]')
    if (existingScript) {
      console.log('OpenCV script exists, waiting for initialization...')
      // Wait for it to load and initialize
      const checkInterval = setInterval(() => {
        if (window.cv && window.cv.Mat && typeof window.cv.Mat === 'function') {
          console.log('✅ OpenCV.js initialized from existing script')
          setOpencvReady(true)
          clearInterval(checkInterval)
        }
      }, 500)
      
      // Timeout after 20 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        if (!window.cv || !window.cv.Mat) {
          console.warn('OpenCV.js taking longer than expected to initialize')
        }
      }, 20000)
      
      return () => clearInterval(checkInterval)
    }
    
    console.log('Loading OpenCV.js...')
    const script = document.createElement('script')
    // Use a more reliable CDN
    script.src = 'https://cdn.jsdelivr.net/npm/opencv-js@4.8.0/dist/opencv.js'
    script.async = true
    
    script.onload = () => {
      console.log('OpenCV.js script loaded, waiting for initialization...')
      
      // Poll for cv.Mat with longer intervals to avoid conflicts
      const checkReady = setInterval(() => {
        try {
          if (window.cv && window.cv.Mat && typeof window.cv.Mat === 'function') {
            // Test if Mat actually works
            try {
              const testMat = new window.cv.Mat(10, 10, window.cv.CV_8UC1)
              testMat.delete()
              console.log('✅ OpenCV.js ready')
              setOpencvReady(true)
              clearInterval(checkReady)
            } catch (e) {
              // Not fully ready yet
            }
          }
        } catch (e) {
          // Ignore errors during initialization
        }
      }, 500)
      
      // Timeout after 20 seconds
      setTimeout(() => {
        clearInterval(checkReady)
        if (!window.cv || !window.cv.Mat) {
          console.warn('OpenCV.js initialization timeout - detection will be disabled')
        }
      }, 20000)
    }
    
    script.onerror = () => {
      console.error('Failed to load OpenCV.js - leg detection will be disabled')
      // Set ready to false but don't block UI
    }
    
    document.body.appendChild(script)
    
    return () => {
      // Don't remove script on cleanup
    }
  }, [])

  // Get network IP
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const getIP = async () => {
        try {
          const response = await fetch('https://api.ipify.org?format=json')
          const data = await response.json()
          // This gets public IP, but for local network, we'd need a different approach
          // For now, we'll try to get local IP via WebRTC
          const pc = new RTCPeerConnection({ iceServers: [] })
          pc.createDataChannel('')
          pc.createOffer().then(offer => pc.setLocalDescription(offer))
          
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              const candidate = event.candidate.candidate
              const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/)
              if (ipMatch && !ipMatch[1].startsWith('127.') && !ipMatch[1].startsWith('169.')) {
                setNetworkIP(ipMatch[1])
                pc.close()
              }
            }
          }
        } catch (err) {
          console.log('Could not detect network IP')
        }
      }
      getIP()
    }
  }, [])

  const startDesktopCamera = async () => {
    try {
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: 'user' 
        },
        audio: false
      })
      
      setStream(mediaStream)
      streamRef.current = mediaStream
      setCameraMode('desktop')
    } catch (err: any) {
      console.error('Error accessing camera:', err)
      let errorMessage = 'Could not access camera.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please connect a camera device.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.'
      }
      alert(errorMessage)
    }
  }

  const startMobileCamera = async () => {
    try {
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: 'user' 
        },
        audio: false
      })
      
      setStream(mediaStream)
      streamRef.current = mediaStream
      setCameraMode('mobile')
    } catch (err: any) {
      console.error('Error accessing camera:', err)
      let errorMessage = 'Could not access camera.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please connect a camera device.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.'
      }
      alert(errorMessage)
    }
  }

  const stopCamera = () => {
    if (stream || streamRef.current) {
      const currentStream = stream || streamRef.current
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
      }
      setStream(null)
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
    
    setCameraMode(null)
  }

  // Initialize MediaPipe Pose for ACL risk detection
  useEffect(() => {
    if (typeof window === 'undefined' || cameraMode !== 'desktop') {
      console.log('⏸️ Skipping MediaPipe init:', { 
        hasWindow: typeof window !== 'undefined',
        cameraMode 
      })
      return
    }
    
    if (isInitializingRef.current) {
      console.log('⏸️ Already initializing MediaPipe')
      return
    }
    
    if (!videoRef.current) {
      console.log('⏸️ Video ref not ready, waiting...')
      // Wait for video ref
      const checkVideo = setInterval(() => {
        if (videoRef.current) {
          clearInterval(checkVideo)
          isInitializingRef.current = true
          // Will be initialized below
        }
      }, 500)
      setTimeout(() => clearInterval(checkVideo), 5000)
      return
    }
    
    isInitializingRef.current = true
    console.log('🚀 Starting MediaPipe initialization...')
    
    const initializePose = async () => {
      try {
        // Clean up existing pose instance
        if (poseRef.current) {
          await poseRef.current.close()
          poseRef.current = null
        }
        if (cameraRef.current) {
          cameraRef.current.stop()
          cameraRef.current = null
        }
        
        const video = videoRef.current
        if (!video) {
          console.error('❌ Video element not found')
          isInitializingRef.current = false
          return
        }
        
        if (!video.srcObject) {
          console.log('⏳ Waiting for video stream...', {
            hasVideo: !!video,
            hasSrcObject: !!video.srcObject,
            stream: stream ? 'exists' : 'null'
          })
          setTimeout(() => {
            if (video.srcObject) {
              isInitializingRef.current = false
              initializePose()
            } else {
              console.error('❌ Video stream never arrived after timeout')
              isInitializingRef.current = false
            }
          }, 2000)
          return
        }
        
        console.log('✅ Video stream found, initializing MediaPipe Pose')
        
        console.log('🎯 Initializing MediaPipe Pose for ACL detection...')
        console.log('📹 Video state:', {
          hasVideo: !!video,
          hasSrcObject: !!video?.srcObject,
          readyState: video?.readyState,
          HAVE_CURRENT_DATA: video?.HAVE_CURRENT_DATA,
          videoWidth: video?.videoWidth,
          videoHeight: video?.videoHeight,
          paused: video?.paused,
          currentTime: video?.currentTime
        })
        
        // Ensure video is playing before initializing MediaPipe
        if (video.paused) {
          console.log('▶️ Video is paused, trying to play...')
          video.play().then(() => {
            console.log('✅ Video started playing')
          }).catch(err => {
            console.error('❌ Failed to play video:', err)
          })
        }
        
        const pose = new Pose({
          locateFile: (file) => {
            const url = `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
            console.log(`📦 Loading MediaPipe file: ${file}`)
            return url
          }
        })
        
        pose.setOptions({
          modelComplexity: 1, // Use 1 for faster and more reliable detection
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.3, // Reasonable threshold - too low can cause false positives
          minTrackingConfidence: 0.5,  // Higher tracking confidence for stability
          staticImageMode: false        // Continuous detection mode
        })
        
        pose.onResults((results) => {
          // In single scan mode, stop after first good detection
          if (scanMode === 'single' && scanCompleted) {
            return // Skip processing if scan already completed
          }
          
          const canvas = canvasRef.current
          if (!canvas || !video) {
            console.warn('⚠️ Canvas or video not available in onResults', {
              hasCanvas: !!canvas,
              hasVideo: !!video
            })
            return
          }
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            console.warn('⚠️ Could not get canvas context')
            return
          }
          
          // Log detection status with detailed info
          if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
            // Only log every 30 frames to avoid spam (once per second at 30fps)
            if (frameCount % 30 === 0) {
              console.warn('⚠️ No pose landmarks detected - MediaPipe not detecting any person')
              console.warn('💡 IMPORTANT: MediaPipe Pose needs to see your FULL BODY to detect legs')
              console.warn('💡 Make sure your head, shoulders, and entire body are visible in the frame')
              console.warn('Check:', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                videoPlaying: !video.paused,
                readyState: video.readyState,
                framesProcessed: frameCount
              })
            }
          } else {
            console.log(`✅ MediaPipe detected ${results.poseLandmarks.length} total landmarks`)
            // Check ALL landmarks visibility
            const allLandmarks = results.poseLandmarks.map((lm, idx) => ({
              idx,
              vis: lm?.visibility || 0,
              x: lm?.x,
              y: lm?.y
            })).filter(lm => lm.vis > 0.1)
            console.log(`📍 Visible landmarks (>0.1): ${allLandmarks.length}`, allLandmarks.slice(0, 5))
            
            // Check leg landmarks specifically
            const legIndices = [23, 24, 25, 26, 27, 28]
            const legDetails = legIndices.map(idx => {
              const lm = results.poseLandmarks[idx]
              return {
                joint: ['L_Hip', 'R_Hip', 'L_Knee', 'R_Knee', 'L_Ankle', 'R_Ankle'][legIndices.indexOf(idx)],
                idx,
                hasData: !!lm,
                visibility: lm?.visibility || 0,
                x: lm?.x,
                y: lm?.y
              }
            })
            const legCount = legDetails.filter(l => l.visibility > 0.02).length
            console.log(`🦵 Leg landmarks:`, legDetails)
            console.log(`🦵 Legs with visibility >0.02: ${legCount}/6`)
            
            if (legCount === 0) {
              console.warn('⚠️ No leg landmarks detected! This could mean:')
              console.warn('  1. Legs are not visible in frame')
              console.warn('  2. Person is not detected (need full body)')
              console.warn('  3. Lighting is too poor')
              console.warn('  4. Camera angle is wrong')
            }
          }
          
          // Set canvas size
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 480
          }
          
          // Clear canvas completely - start fresh every frame
          ctx.save()
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          // NOTE: Canvas element has CSS transform: scaleX(-1) applied in the style
          // This mirrors everything drawn on the canvas to match the mirrored video
          // For text to appear unmirrored, we need to reverse the X coordinate
          
          // IMPORTANT: Only process and draw leg landmarks (23-28)
          // All other landmarks are completely ignored
          if (results.poseLandmarks) {
            // Filter to only leg joints: hips (23, 24), knees (25, 26), ankles (27, 28)
            const legLandmarkIndices = [23, 24, 25, 26, 27, 28]
            const legLandmarks = legLandmarkIndices.map(idx => results.poseLandmarks[idx])
            
            // Very lenient threshold for dark clothing (black pants) - accept even very low confidence
            const hasVisibleLegs = legLandmarks.some((lm) => {
              return lm && lm.visibility > 0.02  // Accept almost anything for dark clothing
            })
            
            // Log detailed leg detection info
            console.log('🦵 Leg detection check:', {
              landmarks: legLandmarkIndices.map(idx => {
                const lm = results.poseLandmarks[idx]
                return {
                  idx,
                  visible: lm?.visibility || 0,
                  hasData: !!lm,
                  x: lm?.x,
                  y: lm?.y
                }
              }),
              hasVisibleLegs
            })
            
            if (hasVisibleLegs) {
              // Add current frame to smoothing buffer
              // Very lenient for dark clothing - accept any leg landmark detection
              const currentFrame = legLandmarkIndices.map(idx => {
                const lm = results.poseLandmarks[idx]
                // Accept even extremely low visibility detections (for black pants)
                if (lm && lm.visibility > 0.02) {
                  return {
                    x: lm.x,
                    y: lm.y,
                    visibility: lm.visibility
                  }
                }
                return null
              })
              
              console.log('📊 Current frame leg data:', {
                frame: currentFrame.map((f, i) => ({
                  joint: ['L_Hip', 'R_Hip', 'L_Knee', 'R_Knee', 'L_Ankle', 'R_Ankle'][i],
                  hasData: !!f,
                  x: f?.x,
                  y: f?.y,
                  vis: f?.visibility
                }))
              })
              
              landmarkBufferRef.current.push(currentFrame)
              if (landmarkBufferRef.current.length > SMOOTHING_BUFFER_SIZE) {
                landmarkBufferRef.current.shift() // Remove oldest frame
              }
              
              // Calculate smoothed positions using exponential moving average + buffer average
              const smoothedLandmarks = legLandmarkIndices.map((idx, arrayIdx) => {
                const validFrames = landmarkBufferRef.current
                  .map(frame => frame[arrayIdx])
                  .filter(lm => lm !== null)
                
                if (validFrames.length === 0) return null
                
                // Calculate average from buffer
                const avgX = validFrames.reduce((sum, lm) => sum + lm.x, 0) / validFrames.length
                const avgY = validFrames.reduce((sum, lm) => sum + lm.y, 0) / validFrames.length
                const avgVisibility = validFrames.reduce((sum, lm) => sum + lm.visibility, 0) / validFrames.length
                
                // Apply aggressive exponential smoothing with position change filtering
                const lastPos = lastSmoothedPositionsRef.current.get(idx)
                let finalX = avgX
                let finalY = avgY
                
                if (lastPos && validFrames.length >= 5) {
                  // Calculate position change
                  const lastX = lastPos.x / canvas.width
                  const lastY = lastPos.y / canvas.height
                  const deltaX = Math.abs(avgX - lastX)
                  const deltaY = Math.abs(avgY - lastY)
                  
                  // Reject large jumps - if movement is too large, use previous position (dead zone)
                  if (deltaX < MAX_POSITION_CHANGE && deltaY < MAX_POSITION_CHANGE) {
                    // Small movement - apply exponential smoothing
                    finalX = SMOOTHING_ALPHA * avgX + (1 - SMOOTHING_ALPHA) * lastX
                    finalY = SMOOTHING_ALPHA * avgY + (1 - SMOOTHING_ALPHA) * lastY
                  } else {
                    // Large movement detected - reject it, keep previous position for stability
                    finalX = lastX
                    finalY = lastY
                  }
                } else if (lastPos) {
                  // Not enough frames yet, use previous position
                  finalX = lastPos.x / canvas.width
                  finalY = lastPos.y / canvas.height
                }
                
                // Update last smoothed position
                lastSmoothedPositionsRef.current.set(idx, {
                  x: finalX * canvas.width,
                  y: finalY * canvas.height
                })
                
                return {
                  x: finalX * canvas.width,
                  y: finalY * canvas.height,
                  visibility: avgVisibility,
                  originalX: finalX // Keep original for calculations
                }
              })
              
              // Canvas already has CSS transform: scaleX(-1), so coordinates are automatically mirrored
              // Manually draw ONLY leg connections (don't use drawConnectors as it might draw other connections)
              // Draw connections manually for full control
              const drawLegConnection = (idx1: number, idx2: number) => {
                const arrayIdx1 = legLandmarkIndices.indexOf(idx1)
                const arrayIdx2 = legLandmarkIndices.indexOf(idx2)
                
                if (arrayIdx1 >= 0 && arrayIdx2 >= 0) {
                  const lm1 = smoothedLandmarks[arrayIdx1]
                  const lm2 = smoothedLandmarks[arrayIdx2]
                  
                  // More lenient for dark clothing - accept lower visibility
                  if (lm1 && lm2 && lm1.visibility > 0.15 && lm2.visibility > 0.15) {
                    ctx.strokeStyle = '#00FF00'
                    ctx.lineWidth = 3
                    ctx.beginPath()
                    ctx.moveTo(lm1.x, lm1.y)
                    ctx.lineTo(lm2.x, lm2.y)
                    ctx.stroke()
                  }
                }
              }
              
              // Draw ONLY leg connections manually
              drawLegConnection(23, 24) // Left hip to Right hip
              drawLegConnection(23, 25) // Left hip to Left knee
              drawLegConnection(24, 26) // Right hip to Right knee
              drawLegConnection(25, 27) // Left knee to Left ankle
              drawLegConnection(26, 28) // Right knee to Right ankle
              
              // Draw ONLY smoothed leg landmarks (stable positions, canvas transform handles mirroring)
              // Filter to ensure we only draw leg joints with good visibility
              smoothedLandmarks.forEach((smoothedLm, arrayIdx) => {
                // More lenient for dark clothing - draw even with lower confidence
                if (smoothedLm && smoothedLm.visibility > 0.15) {
                  const idx = legLandmarkIndices[arrayIdx]
                  
                  // STRICT CHECK: Only draw leg landmarks (23-28), nothing else
                  // Explicitly check each index to prevent any other body parts
                  if (idx === 23 || idx === 24 || idx === 25 || idx === 26 || idx === 27 || idx === 28) {
                    // Draw landmark based on joint type (canvas CSS transform handles mirroring)
                    ctx.beginPath()
                    if (idx === 23 || idx === 24) {
                      // Left/Right Hip - red
                      ctx.fillStyle = '#FF0000'
                      ctx.arc(smoothedLm.x, smoothedLm.y, 6, 0, 2 * Math.PI)
                    } else if (idx === 25 || idx === 26) {
                      // Left/Right Knee - yellow (focus point)
                      ctx.fillStyle = '#FFFF00'
                      ctx.arc(smoothedLm.x, smoothedLm.y, 10, 0, 2 * Math.PI)
                    } else if (idx === 27 || idx === 28) {
                      // Left/Right Ankle - blue
                      ctx.fillStyle = '#0000FF'
                      ctx.arc(smoothedLm.x, smoothedLm.y, 6, 0, 2 * Math.PI)
                    }
                    ctx.fill()
                    ctx.strokeStyle = '#FFFFFF'
                    ctx.lineWidth = 2
                    ctx.stroke()
                  } else {
                    // Safety: Log if we somehow get a non-leg landmark
                    console.warn('⚠️ Attempted to draw non-leg landmark:', idx)
                  }
                }
              })
              
              // Analyze ACL risk with smoothed landmarks (ONLY leg landmarks)
              // Create a pose landmarks array with ONLY leg data, everything else null
              const smoothedPoseLandmarks = results.poseLandmarks.map((lm, idx) => {
                const arrayIdx = legLandmarkIndices.indexOf(idx)
                if (arrayIdx >= 0 && smoothedLandmarks[arrayIdx]) {
                  // Leg landmark - use smoothed data
                  const smoothed = smoothedLandmarks[arrayIdx]
                  return {
                    ...lm,
                    x: smoothed.originalX, // Use original normalized x (0-1)
                    y: smoothed.y / canvas.height,
                    visibility: smoothed.visibility
                  }
                }
                // Not a leg landmark - return null to exclude from analysis
                return null
              })
              // Lowered threshold for dark clothing - accept detection with lower visibility
              const hasGoodLegDetection = smoothedLandmarks.filter(lm => lm && lm.visibility > 0.15).length >= 2
              if (hasGoodLegDetection) {
                analyzeACLRisk(smoothedPoseLandmarks, ctx, canvas.width, canvas.height) // No mirror flag needed - CSS handles it
                
                // In single scan mode, mark as completed and stop continuous updates
                if (scanMode === 'single' && !scanCompleted) {
                  setScanCompleted(true)
                  console.log('✅ Single scan completed - detection frozen')
                }
              }
            } else {
              // Clear buffer when no legs detected
              landmarkBufferRef.current = []
              lastSmoothedPositionsRef.current.clear()
              setLegDetected(false)
              setAclRisk({ kneeAngle: null, valgusAngle: null, riskLevel: 'low', message: 'Position your legs in frame' })
            }
          } else {
            setLegDetected(false)
            setAclRisk({ kneeAngle: null, valgusAngle: null, riskLevel: 'low', message: 'Position your legs in frame' })
          }
          
          ctx.restore()
        })
        
        poseRef.current = pose
        
        // Use MediaPipe Camera utility - improved frame handling
        // Note: MediaPipe needs full body context to detect legs properly
        let frameCount = 0
        const camera = new Camera(video, {
          onFrame: async () => {
            if (!poseRef.current) {
              if (frameCount === 0) {
                console.warn('⚠️ Pose not initialized yet')
              }
              return
            }
            
            if (!video || video.readyState < video.HAVE_CURRENT_DATA) {
              if (frameCount % 60 === 0) {
                console.warn('⏳ Video not ready:', {
                  readyState: video?.readyState,
                  HAVE_CURRENT_DATA: video?.HAVE_CURRENT_DATA
                })
              }
              return
            }
            
            if (video.paused) {
              if (frameCount === 0) {
                console.warn('⏸️ Video is paused')
              }
              return
            }
            
            try {
              frameCount++
              if (frameCount === 1 || frameCount % 30 === 0) {
                console.log('📹 Sending frame to MediaPipe:', {
                  count: frameCount,
                  videoWidth: video.videoWidth,
                  videoHeight: video.videoHeight,
                  readyState: video.readyState
                })
              }
              await poseRef.current.send({ image: video })
            } catch (error: any) {
              console.error('❌ Error sending frame to MediaPipe:', error)
              console.error('Error details:', {
                message: error?.message,
                name: error?.name
              })
            }
          },
          width: 640,
          height: 480
        })
        
        cameraRef.current = camera
        
        try {
          camera.start()
          console.log('✅ MediaPipe Pose initialized and camera started')
          console.log('📹 Camera state:', {
            isActive: camera.isActive || 'unknown',
            frameRate: 'auto'
          })
        } catch (startError) {
          console.error('❌ Error starting camera:', startError)
        }
        
        isInitializingRef.current = false
        
      } catch (error) {
        console.error('❌ Error initializing MediaPipe Pose:', error)
        isInitializingRef.current = false
      }
    }
    
    // Wait for video to be ready with detailed logging
    const video = videoRef.current
    console.log('🔍 Checking video readiness for MediaPipe:', {
      hasVideo: !!video,
      hasSrcObject: !!video?.srcObject,
      readyState: video?.readyState,
      HAVE_METADATA: video?.HAVE_METADATA,
      HAVE_CURRENT_DATA: video?.HAVE_CURRENT_DATA,
      streamActive: stream?.active
    })
    
    if (video && video.srcObject && video.readyState >= video.HAVE_METADATA) {
      console.log('✅ Video ready, initializing MediaPipe immediately')
      initializePose()
    } else {
      console.log('⏳ Video not ready, waiting...')
      let attempts = 0
      const maxAttempts = 20 // 10 seconds total
      const checkInterval = setInterval(() => {
        attempts++
        const currentVideo = videoRef.current
        const isReady = currentVideo && currentVideo.srcObject && currentVideo.readyState >= currentVideo.HAVE_METADATA
        
        if (isReady) {
          console.log('✅ Video ready after wait, initializing MediaPipe')
          clearInterval(checkInterval)
          initializePose()
        } else if (attempts >= maxAttempts) {
          console.error('❌ Video never became ready after 10 seconds')
          console.error('Final state:', {
            hasVideo: !!currentVideo,
            hasSrcObject: !!currentVideo?.srcObject,
            readyState: currentVideo?.readyState
          })
          clearInterval(checkInterval)
          isInitializingRef.current = false
        } else if (attempts % 4 === 0) { // Log every 2 seconds
          console.log(`⏳ Still waiting for video (${attempts}/${maxAttempts})...`, {
            hasVideo: !!currentVideo,
            hasSrcObject: !!currentVideo?.srcObject,
            readyState: currentVideo?.readyState
          })
        }
      }, 500)
    }
    
    return () => {
      if (poseRef.current) {
        poseRef.current.close()
        poseRef.current = null
      }
      if (cameraRef.current) {
        cameraRef.current.stop()
        cameraRef.current = null
      }
      // Cancel any ongoing speech when component unmounts or camera stops
      if (speechSynthesisRef.current?.speaking) {
        speechSynthesisRef.current.cancel()
      }
      isInitializingRef.current = false
    }
  }, [cameraMode, stream])
  
  // Analyze ACL risk from pose landmarks
  // Note: Canvas has CSS transform: scaleX(-1), so coordinates are automatically mirrored
  const analyzeACLRisk = (landmarks: any[], ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // MediaPipe Pose landmark indices
    const LEFT_HIP = 23
    const LEFT_KNEE = 25
    const LEFT_ANKLE = 27
    const RIGHT_HIP = 24
    const RIGHT_KNEE = 26
    const RIGHT_ANKLE = 28
    
    const getLandmark = (index: number) => {
      const lm = landmarks[index]
      // Very lenient visibility for dark clothing (black pants) - accept almost any detection
      if (!lm || lm.visibility < 0.02) return null
      // Canvas CSS transform handles mirroring, so use coordinates as-is
      return { x: lm.x * width, y: lm.y * height }
    }
    
    const leftHip = getLandmark(LEFT_HIP)
    const leftKnee = getLandmark(LEFT_KNEE)
    const leftAnkle = getLandmark(LEFT_ANKLE)
    const rightHip = getLandmark(RIGHT_HIP)
    const rightKnee = getLandmark(RIGHT_KNEE)
    const rightAnkle = getLandmark(RIGHT_ANKLE)
    
    // Analyze both legs, prefer the one with better visibility
    let kneeAngle: number | null = null
    let valgusAngle: number | null = null
    let analyzedSide = 'none'
    let riskLevel: 'low' | 'moderate' | 'high' = 'low'
    let message = 'Position legs in frame'
    
    // Calculate angles for left leg
    if (leftHip && leftKnee && leftAnkle) {
      kneeAngle = calculateKneeAngle(leftHip, leftKnee, leftAnkle)
      valgusAngle = calculateValgusAngle(leftHip, leftKnee, leftAnkle)
      analyzedSide = 'left'
      
      // Draw analysis on left leg
      drawACLAnalysis(ctx, leftHip, leftKnee, leftAnkle, kneeAngle, valgusAngle, 'left', width)
    }
    
    // Calculate angles for right leg
    if (rightHip && rightKnee && rightAnkle) {
      const rightKneeAngle = calculateKneeAngle(rightHip, rightKnee, rightAnkle)
      const rightValgusAngle = calculateValgusAngle(rightHip, rightKnee, rightAnkle)
      
      // Use right leg if left leg wasn't detected, or use the one with higher valgus (worse)
      if (analyzedSide === 'none' || (rightValgusAngle !== null && (valgusAngle === null || rightValgusAngle > valgusAngle))) {
        kneeAngle = rightKneeAngle
        valgusAngle = rightValgusAngle
        analyzedSide = 'right'
        
        // Draw analysis on right leg
        drawACLAnalysis(ctx, rightHip, rightKnee, rightAnkle, kneeAngle, valgusAngle, 'right', width)
      }
    }
    
    // Assess risk level
    if (kneeAngle !== null && valgusAngle !== null) {
      setLegDetected(true)
      
      // Risk assessment based on research:
      // - Knee flexion < 30° during landing = high risk
      // - Valgus > 15° = high risk
      // - Valgus 8-15° = moderate risk
      if (kneeAngle < 30 || valgusAngle > 15) {
        riskLevel = 'high'
        message = '⚠️ HIGH RISK: Knee too straight or excessive valgus'
      } else if (valgusAngle > 8 || kneeAngle < 45) {
        riskLevel = 'moderate'
        message = '⚠️ MODERATE RISK: Improve knee control'
      } else {
        riskLevel = 'low'
        message = '✓ Good knee alignment'
      }
      
      setAclRisk({ kneeAngle, valgusAngle, riskLevel, message })
      
      // AI Coach audio feedback (only for desktop camera mode)
      if (cameraMode === 'desktop' && coachEnabled) {
        provideCoachFeedback(kneeAngle, valgusAngle, riskLevel, analyzedSide)
      }
    } else {
      setLegDetected(false)
      setAclRisk({ kneeAngle: null, valgusAngle: null, riskLevel: 'low', message: 'Position your legs in frame' })
    }
  }
  
  // AI Coach: Generate and speak feedback based on ACL risk
  const provideCoachFeedback = (
    kneeAngle: number,
    valgusAngle: number,
    riskLevel: 'low' | 'moderate' | 'high',
    side: string
  ) => {
    if (!speechSynthesisRef.current || !coachEnabled || cameraMode !== 'desktop') return
    
    const now = Date.now()
    const timeSinceLastFeedback = now - lastFeedbackTimeRef.current
    
    // Prevent overwhelming feedback - minimum 3 seconds between messages
    if (timeSinceLastFeedback < 3000) return
    
    // Cancel any ongoing speech
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel()
    }
    
    let feedback = ''
    let feedbackType = ''
    
    // Generate feedback based on risk level and specific angles
    if (riskLevel === 'high') {
      if (valgusAngle > 15) {
        feedback = `${userName}, your knee is caving inward too much. Keep your knee aligned over your foot. Push your knee out slightly.`
        feedbackType = 'high_valgus'
      } else if (kneeAngle < 30) {
        feedback = `${userName}, bend your knees more. You need at least 30 degrees of knee bend for safe movement.`
        feedbackType = 'low_flexion'
      } else {
        feedback = `${userName}, high risk detected. Focus on bending your knees and keeping them aligned.`
        feedbackType = 'high_risk'
      }
    } else if (riskLevel === 'moderate') {
      if (valgusAngle > 8) {
        feedback = `${userName}, slight knee valgus detected. Keep your knee tracking over your second toe.`
        feedbackType = 'moderate_valgus'
      } else if (kneeAngle < 45) {
        feedback = `${userName}, try bending your knees a bit more for better control.`
        feedbackType = 'moderate_flexion'
      } else {
        feedback = `${userName}, good form, keep it up.`
        feedbackType = 'moderate_general'
      }
    } else {
      // Low risk - only give positive feedback occasionally (every 10 seconds)
      if (timeSinceLastFeedback > 10000 && Math.random() > 0.7) {
        feedback = `Great form, ${userName}. Keep your knees aligned.`
        feedbackType = 'positive'
      } else {
        return // Don't speak for low risk too often
      }
    }
    
    // Don't repeat the same feedback type too quickly
    if (lastFeedbackTypeRef.current === feedbackType && timeSinceLastFeedback < 8000) {
      return
    }
    
    // Create and speak the feedback
    const utterance = new SpeechSynthesisUtterance(feedback)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 0.8
    
    utterance.onend = () => {
      currentUtteranceRef.current = null
    }
    
    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error)
      currentUtteranceRef.current = null
    }
    
    currentUtteranceRef.current = utterance
    lastFeedbackTimeRef.current = now
    lastFeedbackTypeRef.current = feedbackType
    
    try {
      speechSynthesisRef.current.speak(utterance)
    } catch (error) {
      console.error('Error speaking:', error)
    }
  }
  
  // Calculate knee flexion angle (hip-knee-ankle)
  const calculateKneeAngle = (hip: {x: number, y: number}, knee: {x: number, y: number}, ankle: {x: number, y: number}): number => {
    const vec1 = { x: hip.x - knee.x, y: hip.y - knee.y }
    const vec2 = { x: ankle.x - knee.x, y: ankle.y - knee.y }
    
    const dot = vec1.x * vec2.x + vec1.y * vec2.y
    const mag1 = Math.sqrt(vec1.x * vec1.x + vec1.y * vec1.y)
    const mag2 = Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y)
    
    const angle = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2)))) * (180 / Math.PI)
    return Math.round(angle)
  }
  
  // Calculate valgus angle (knee caving in) - key ACL risk factor
  const calculateValgusAngle = (hip: {x: number, y: number}, knee: {x: number, y: number}, ankle: {x: number, y: number}): number => {
    // Calculate the angle between hip-ankle line and vertical line through knee
    // Positive valgus = knee caves inward (bad)
    const hipAnkleSlope = (ankle.y - hip.y) / (ankle.x - hip.x + 0.0001)
    const kneeXLine = knee.x
    
    // Project knee onto hip-ankle line, calculate deviation
    const expectedKneeX = hip.x + (knee.y - hip.y) / hipAnkleSlope
    const deviation = kneeXLine - expectedKneeX
    
    // Convert to degrees (approximate)
    const hipKneeDist = Math.sqrt(Math.pow(knee.x - hip.x, 2) + Math.pow(knee.y - hip.y, 2))
    const angleDegrees = Math.atan(Math.abs(deviation) / hipKneeDist) * (180 / Math.PI)
    
    return Math.round(angleDegrees * (deviation > 0 ? 1 : -1))
  }
  
  // Draw ACL risk visualization on canvas
  const drawACLAnalysis = (
    ctx: CanvasRenderingContext2D,
    hip: {x: number, y: number},
    knee: {x: number, y: number},
    ankle: {x: number, y: number},
    kneeAngle: number | null,
    valgusAngle: number | null,
    side: string,
    canvasWidth: number
  ) => {
    if (!kneeAngle || !valgusAngle) return
    
    const riskColor = valgusAngle > 15 || kneeAngle < 30 ? '#FF0000' : valgusAngle > 8 ? '#FFA500' : '#00FF00'
    
    // Canvas element has CSS transform: scaleX(-1), which mirrors everything drawn
    // To make text readable (unmirrored), draw it at the opposite X position
    // Formula: textX = canvasWidth - kneeX
    const textX = canvasWidth - knee.x
    
    // Draw angle arcs at knee position (will be mirrored by CSS to match video)
    ctx.strokeStyle = riskColor
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(knee.x, knee.y, 30, 0, Math.PI * 2)
    ctx.stroke()
    
    // Draw text at mirrored X position so it appears unmirrored and readable
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(textX - 40, knee.y - 40, 80, 50)
    ctx.fillStyle = riskColor
    ctx.font = 'bold 14px Arial'
    ctx.fillText(`Flex: ${kneeAngle}°`, textX - 35, knee.y - 25)
    ctx.fillText(`Valgus: ${valgusAngle}°`, textX - 35, knee.y - 10)
    
    // Draw warning if high risk
    if (valgusAngle > 15 || kneeAngle < 30) {
      ctx.fillStyle = '#FF0000'
      ctx.font = 'bold 20px Arial'
      ctx.fillText('⚠️ ACL RISK', textX - 50, knee.y - 60)
    }
  }
  
  // Legacy simple leg detection (kept as fallback, but ACL detection is primary)
  const detectLegsSimple = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas) {
      console.log('❌ Video or canvas not available')
      return
    }
    
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      console.log('⏳ Video not ready yet, readyState:', video.readyState)
      return
    }
    
    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        console.log('❌ Could not get canvas context')
        return
      }
      
      // Set canvas size to match video
      const vWidth = video.videoWidth || 640
      const vHeight = video.videoHeight || 480
      
      if (canvas.width !== vWidth || canvas.height !== vHeight) {
        canvas.width = vWidth
        canvas.height = vHeight
        console.log(`Canvas resized to ${vWidth}x${vHeight}`)
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      console.log('✅ Video frame drawn to canvas')
      
      // Analyze a larger region - bottom 60% of frame
      const legStartY = Math.floor(canvas.height * 0.4)  // Start from 40% down
      const legRegionHeight = Math.floor(canvas.height * 0.6)  // Analyze bottom 60%
      
      console.log(`🔍 Starting detection - Analyzing region: y=${legStartY}, height=${legRegionHeight}, canvas=${canvas.width}x${canvas.height}`)
      
      // Get image data from leg region
      let legRegion
      try {
        legRegion = ctx.getImageData(0, legStartY, canvas.width, legRegionHeight)
      } catch (err) {
        console.error('❌ Error getting image data:', err)
        return
      }
      
      const data = legRegion.data
      const width = legRegion.width
      const height = legRegion.height
      
      console.log(`📊 Image data: ${width}x${height}, total pixels: ${data.length / 4}`)
      
      // Create a map of skin pixels by x position (to find leg columns)
      const skinColumns: { [x: number]: number } = {} // x position -> count of skin pixels in that column
      const legCandidates: Array<{x: number, width: number, topY: number, bottomY: number, pixelCount: number}> = []
      
      // Count total skin pixels first for debugging
      let totalSkinPixels = 0
      let samplePixels = 0
      
      // Quick sample to check if we're getting any data
      for (let i = 0; i < Math.min(1000, data.length); i += 40) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        samplePixels++
        // Very basic check
        if (r > 50 && g > 30 && b > 15 && r > b) {
          totalSkinPixels++
        }
      }
      console.log(`📈 Sample check: ${totalSkinPixels}/${samplePixels} pixels look like skin`)
      
      // Scan each column to find vertical leg-like structures
      // More lenient thresholds for detection
      for (let x = 0; x < width; x += 2) { // Step by 2 for better coverage
        let skinCountInColumn = 0
        
        for (let y = 0; y < height; y++) {
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          
          // Very lenient skin tone detection - multiple strategies
          // Strategy 1: Classic skin tone (R > G > B)
          const isSkinClassic = (
            r > 50 && g > 30 && b > 15 &&
            r > g && g > b &&
            r > b + 10 &&
            (r + g + b) > 80 && (r + g + b) < 750
          )
          
          // Strategy 2: Lighter skin tones (when overexposed)
          const isSkinLight = (
            r > 120 && g > 80 && b > 60 &&
            r > b && (r - b) > 20 &&
            (r + g + b) > 260 && (r + g + b) < 700
          )
          
          // Strategy 3: Darker skin tones
          const isSkinDark = (
            r > 40 && g > 25 && b > 15 &&
            r > b && r > g &&
            (r + g + b) > 80 && (r + g + b) < 400
          )
          
          const isSkin = isSkinClassic || isSkinLight || isSkinDark
          
          if (isSkin) {
            skinCountInColumn++
          }
        }
        
        // Very lenient threshold - at least 10% of column is skin
        // This will catch legs even with partial visibility or different lighting
        if (skinCountInColumn > height * 0.10) {
          skinColumns[x] = skinCountInColumn
        }
      }
      
      // Group adjacent columns to find leg shapes
      const columnKeys = Object.keys(skinColumns).map(Number).sort((a, b) => a - b)
      
      console.log(`Found ${columnKeys.length} columns with skin pixels`)
      
      if (columnKeys.length > 0) {
        let currentGroup: number[] = [columnKeys[0]]
        
        for (let i = 1; i < columnKeys.length; i++) {
          // More lenient grouping - columns within 15 pixels (was 10)
          if (columnKeys[i] - columnKeys[i - 1] < 15) {
            currentGroup.push(columnKeys[i])
          } else {
            // Process current group - lower minimum width (3% instead of 5%)
            if (currentGroup.length > width * 0.03) {
              const groupX = Math.min(...currentGroup)
              const groupWidth = Math.max(...currentGroup) - groupX + 1
              const pixelCount = currentGroup.reduce((sum, x) => sum + skinColumns[x], 0)
              
              legCandidates.push({
                x: groupX,
                width: groupWidth,
                topY: legStartY,
                bottomY: legStartY + height,
                pixelCount: pixelCount
              })
            }
            currentGroup = [columnKeys[i]]
          }
        }
        
        // Process last group - lower minimum width
        if (currentGroup.length > width * 0.03) {
          const groupX = Math.min(...currentGroup)
          const groupWidth = Math.max(...currentGroup) - groupX + 1
          const pixelCount = currentGroup.reduce((sum, x) => sum + skinColumns[x], 0)
          
          legCandidates.push({
            x: groupX,
            width: groupWidth,
            topY: legStartY,
            bottomY: legStartY + height,
            pixelCount: pixelCount
          })
        }
      }
      
      console.log(`Found ${legCandidates.length} leg candidates`)
      
      // Very lenient filtering - accept almost any detected structure in leg region
      const validLegs = legCandidates.filter(leg => {
        // Accept any structure that:
        // - Has minimum width (even very thin legs)
        // - Is not extremely wide (avoid whole body)
        // - Has some pixels (even sparse detection)
        const isValid = leg.width > width * 0.02 &&  // At least 2% of width
                       leg.width < width * 0.5 &&      // Not too wide
                       leg.pixelCount > 50            // Very low pixel count threshold
        if (isValid) {
          console.log(`✅ Valid leg detected: x=${leg.x}, width=${leg.width.toFixed(1)}, pixels=${leg.pixelCount}, height=${leg.bottomY - leg.topY}`)
        }
        return isValid
      })
      
      if (validLegs.length > 0) {
        console.log(`✅ Found ${validLegs.length} valid leg(s)!`)
        setLegDetected(true)
      } else {
        // Fallback: If we found ANY skin columns, mark as detected (very lenient)
        if (columnKeys.length > width * 0.1) { // If 10% of width has skin pixels
          console.log(`⚠️ No leg groups found, but ${columnKeys.length} columns have skin - marking as detected`)
          setLegDetected(true)
          
          // Draw a simple indicator
          ctx.strokeStyle = '#FFFF00'
          ctx.lineWidth = 3
          ctx.strokeRect(10, legStartY, canvas.width - 20, legRegionHeight)
          ctx.fillStyle = '#FFFF00'
          ctx.font = 'bold 18px Arial'
          ctx.fillText('Legs Detected (Basic)', 20, legStartY + 30)
        } else {
          console.log(`❌ No valid legs found. Candidates: ${legCandidates.length}, Columns with skin: ${columnKeys.length}`)
          setLegDetected(false)
        }
      }
      
      // Draw detection boxes directly on detected legs
      // Both video and canvas have scaleX(-1) transform, so coordinates match directly
      if (validLegs.length > 0) {
        validLegs.forEach(leg => {
          // Use detected coordinates directly - CSS transform handles mirroring
          const legX = leg.x
          const legY = leg.topY
          const legWidth = leg.width
          const legHeight = leg.bottomY - leg.topY
          
          // Draw bounding box around leg
          ctx.strokeStyle = '#00FF00'
          ctx.lineWidth = 5
          ctx.strokeRect(legX, legY, legWidth, legHeight)
          
          // Draw joints/landmarks
          const centerX = legX + legWidth / 2
          const hipY = legY
          const kneeY = legY + legHeight * 0.4 // Knee is about 40% down the leg
          const ankleY = legY + legHeight * 0.85 // Ankle near bottom
          
          // Draw hip marker (red) - larger and more visible
          ctx.fillStyle = '#FF0000'
          ctx.beginPath()
          ctx.arc(centerX, hipY, 8, 0, 2 * Math.PI)
          ctx.fill()
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.stroke()
          
          // Draw knee marker (yellow) - larger and more visible
          ctx.fillStyle = '#FFFF00'
          ctx.beginPath()
          ctx.arc(centerX, kneeY, 8, 0, 2 * Math.PI)
          ctx.fill()
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 2
          ctx.stroke()
          
          // Draw ankle marker (blue) - larger and more visible
          ctx.fillStyle = '#0000FF'
          ctx.beginPath()
          ctx.arc(centerX, ankleY, 8, 0, 2 * Math.PI)
          ctx.fill()
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.stroke()
          
          // Draw leg connection lines (thicker)
          ctx.strokeStyle = '#00FF00'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(centerX, hipY)
          ctx.lineTo(centerX, kneeY)
          ctx.lineTo(centerX, ankleY)
          ctx.stroke()
          
          // Draw label with background
          ctx.fillStyle = '#000000'
          ctx.fillRect(legX + 3, legY + 3, 45, 22)
          ctx.fillStyle = '#00FF00'
          ctx.font = 'bold 18px Arial'
          ctx.fillText('Leg', legX + 5, legY + 20)
        })
        
        if (validLegs.length > 1) {
          ctx.fillStyle = '#000000'
          ctx.fillRect(8, legStartY + 8, 180, 26)
          ctx.fillStyle = '#00FF00'
          ctx.font = 'bold 18px Arial'
          ctx.fillText(`${validLegs.length} Legs Detected ✓`, 10, legStartY + 28)
        }
      }
      
    } catch (err) {
      console.error('Simple detection error:', err)
    }
  }

  // OpenCV leg detection function (more accurate, but requires loading)
  const detectLegsOpenCV = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas || !window.cv || !opencvReady) return
    
    try {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // Set canvas size to match video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
      }
      
      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw video frame to canvas (for OpenCV processing)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert canvas to OpenCV Mat
      const src = window.cv.imread(canvas)
      
      // Clear canvas again to draw only detection results
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const hsv = new window.cv.Mat()
      const mask = new window.cv.Mat()
      const contours = new window.cv.MatVector()
      const hierarchy = new window.cv.Mat()
      
      // Convert to HSV for skin tone detection
      window.cv.cvtColor(src, hsv, window.cv.COLOR_RGBA2HSV)
      
      // Create mask for skin tones
      const lower = new window.cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 20, 70, 0])
      const upper = new window.cv.Mat(hsv.rows, hsv.cols, hsv.type(), [20, 255, 255, 255])
      window.cv.inRange(hsv, lower, upper, mask)
      
      // Morphological operations
      const kernel = window.cv.getStructuringElement(window.cv.MORPH_ELLIPSE, new window.cv.Size(5, 5))
      window.cv.morphologyEx(mask, mask, window.cv.MORPH_CLOSE, kernel)
      window.cv.morphologyEx(mask, mask, window.cv.MORPH_OPEN, kernel)
      
      // Find contours
      window.cv.findContours(mask, contours, hierarchy, window.cv.RETR_EXTERNAL, window.cv.CHAIN_APPROX_SIMPLE)
      
      // Filter contours to find leg-like shapes - ONLY in lower portion
      let legFound = false
      const minArea = (canvas.width * canvas.height) * 0.08  // Increased minimum
      const maxArea = (canvas.width * canvas.height) * 0.4
      const legRegionStartY = canvas.height * 0.6  // Only detect from 60% down (avoid face/torso)
      
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i)
        const area = window.cv.contourArea(contour)
        const moments = window.cv.moments(contour)
        
        if (moments.m00 > 0) {
          const cy = moments.m01 / moments.m00 // Centroid Y
          const cx = moments.m10 / moments.m00 // Centroid X
          
          // STRICT: Only detect if:
          // 1. In lower 40% of frame (60% down to bottom)
          // 2. Has reasonable size (not too small, not too large)
          // 3. Not too high up (definitely not face region)
          if (cy > legRegionStartY && 
              cy < canvas.height * 0.95 &&  // Not at very bottom edge
              area > minArea && 
              area < maxArea) {
            const rect = window.cv.boundingRect(contour)
            // Additional check: bounding box should be mostly in leg region
            if (rect.y + rect.height * 0.5 > legRegionStartY) {
              legFound = true
              
              ctx.strokeStyle = '#00FF00'
              ctx.lineWidth = 3
              ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
              
              // Draw contour
              ctx.strokeStyle = '#00FF00'
              ctx.lineWidth = 2
              ctx.beginPath()
              const data = contour.data32S
              if (data && data.length >= 2) {
                // Only draw if points are in leg region
                let firstPoint = true
                for (let j = 0; j < data.length; j += 2) {
                  const x = data[j]
                  const y = data[j + 1]
                  if (y > legRegionStartY) {
                    if (firstPoint) {
                      ctx.moveTo(x, y)
                      firstPoint = false
                    } else {
                      ctx.lineTo(x, y)
                    }
                  }
                }
                ctx.stroke()
              }
              
              ctx.fillStyle = '#00FF00'
              ctx.font = 'bold 16px Arial'
              ctx.fillText('Leg Detected', rect.x, Math.max(rect.y - 10, legRegionStartY + 10))
            }
          }
        }
        contour.delete()
      }
      
      setLegDetected(legFound)
      
      // Clean up
      src.delete()
      hsv.delete()
      mask.delete()
      contours.delete()
      hierarchy.delete()
      lower.delete()
      upper.delete()
      kernel.delete()
      
    } catch (err) {
      console.error('OpenCV detection error:', err)
    }
  }

  // Use OpenCV if available, otherwise use simple detection
  // Update video element when stream changes
  useEffect(() => {
    const video = videoRef.current
    if (video && stream) {
      console.log('Setting video srcObject, stream active:', stream.active)
      video.srcObject = stream
      
      // Ensure video plays (only once per stream)
      let playAttempted = false
      const playVideo = () => {
        if (playAttempted || !video || video.srcObject !== stream) return
        if (video.paused) {
          playAttempted = true
          video.play().catch(err => {
            // Ignore AbortError - video might already be playing
            if (err.name !== 'AbortError') {
              console.error('Error playing video:', err)
            }
            playAttempted = false // Allow retry on non-abort errors
          })
        }
      }
      
      // Try to play when video is ready
      if (video.readyState >= video.HAVE_METADATA) {
        playVideo()
      } else {
        video.addEventListener('loadedmetadata', playVideo, { once: true })
        video.addEventListener('canplay', playVideo, { once: true })
      }
      
      // MediaPipe Pose handles detection automatically via useEffect
      return () => {
        video.removeEventListener('loadedmetadata', playVideo)
        video.removeEventListener('canplay', playVideo)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
      }
    } else {
      // Stop detection when stream is removed
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      setLegDetected(false)
    }
  }, [stream, opencvReady])

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Only cleanup when component unmounts
      const currentStream = streamRef.current
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, []) // Empty dependency array - only run on unmount

  return (
    <div className="min-h-screen bg-[#1a2332] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-400 rounded-lg">
                <Activity className="h-6 w-6 text-[#1a2332]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Live Monitoring</h1>
                <p className="text-gray-400">Hello {userName}!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Selection */}
        {!cameraMode && (
          <div className="bg-transparent border border-white/10 rounded-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-white mb-6">Select Input Method</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => {
                  setCameraMode('wearable')
                }}
                className="p-6 border border-white/10 rounded-lg hover:border-blue-400 transition-all duration-300 text-left bg-white/5 hover:bg-white/10"
              >
                <Wifi className="h-8 w-8 text-blue-400 mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Wearable Device</h3>
                <p className="text-sm text-gray-400">Connect IMU sensors or smart brace</p>
              </button>

              <button
                onClick={startDesktopCamera}
                className="p-6 border border-white/10 rounded-lg hover:border-green-400 transition-all duration-300 text-left bg-white/5 hover:bg-white/10"
              >
                <Monitor className="h-8 w-8 text-green-400 mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Desktop Camera</h3>
                <p className="text-sm text-gray-400">Use webcam</p>
              </button>

              <button
                onClick={startMobileCamera}
                className="p-6 border border-white/10 rounded-lg hover:border-purple-400 transition-all duration-300 text-left bg-white/5 hover:bg-white/10"
              >
                <Smartphone className="h-8 w-8 text-purple-400 mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Mobile Camera</h3>
                <p className="text-sm text-gray-400">Access from your phone</p>
              </button>
            </div>

            <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
              {networkIP || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') ? (
                <div className="text-sm text-gray-300">
                  <strong className="text-white">📱 Mobile Access:</strong> On your phone, open{' '}
                  <code className="bg-black/30 px-2 py-1 rounded font-mono text-blue-400">
                    http://{networkIP || (typeof window !== 'undefined' ? window.location.hostname : '')}:3000/live-monitoring
                  </code>
                  {' '}then select "Desktop Camera"
                </div>
              ) : (
                <div className="text-sm text-gray-300">
                  <strong className="text-white">📱 Mobile Access:</strong> Detecting your IP address...
                  <div className="mt-2 text-xs text-gray-400">
                    If detection fails, find your IP manually: Mac (System Settings → Network) or Windows (ipconfig)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Camera Preview */}
        {(cameraMode === 'desktop' || cameraMode === 'mobile') && (
          <div className="bg-transparent border border-white/10 rounded-lg p-6 mb-6">
            {/* AI Coach Toggle - Only for Desktop Camera */}
            {cameraMode === 'desktop' && (
              <div className="mb-6 flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${coachEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                  <div>
                    <span className="text-white font-medium">AI Coach</span>
                    <p className="text-xs text-gray-400">Real-time audio feedback</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCoachEnabled(!coachEnabled)
                    // Cancel any ongoing speech when disabling
                    if (!coachEnabled && speechSynthesisRef.current?.speaking) {
                      speechSynthesisRef.current.cancel()
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2 ${
                    coachEnabled
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {coachEnabled ? (
                    <>
                      <Volume2 className="h-4 w-4" />
                      <span>Audio ON</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4" />
                      <span>Audio OFF</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-1 h-12 bg-blue-400 rounded-full"></div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Leg Scan</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    {scanCompleted ? (
                      <>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-400 text-sm font-semibold">Scan Complete</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span className="text-yellow-400 text-sm">Scanning Legs...</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {scanCompleted && (
                  <button
                    onClick={() => {
                      setScanCompleted(false)
                      setLegDetected(false)
                      landmarkBufferRef.current = []
                      lastSmoothedPositionsRef.current.clear()
                      setAclRisk({ kneeAngle: null, valgusAngle: null, riskLevel: 'low', message: '' })
                      console.log('🔄 Starting new scan...')
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Activity className="h-4 w-4" />
                    <span>Scan Again</span>
                  </button>
                )}
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-[#d4a574] hover:bg-[#c49564] text-[#1a2332] font-semibold rounded-lg transition-colors flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative bg-black rounded-lg overflow-hidden border border-white/10" style={{ height: '600px', maxWidth: '900px', width: '100%' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full rounded-lg bg-black"
                  width={900}
                  height={600}
                  style={{ 
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                    display: 'block',
                    backgroundColor: 'transparent',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1
                  }}
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget
                    console.log('Video metadata loaded:', {
                      videoWidth: video.videoWidth,
                      videoHeight: video.videoHeight,
                      readyState: video.readyState,
                      paused: video.paused
                    })
                    video.play().catch(err => {
                      console.error('Video play error on loadedmetadata:', err)
                    })
                  }}
                  onCanPlay={(e) => {
                    const video = e.currentTarget
                    console.log('Video can play')
                    if (video.paused) {
                      video.play().catch(err => {
                        console.error('Video play error on canplay:', err)
                      })
                    }
                  }}
                  onPlaying={() => {
                    console.log('✅ Video is now playing')
                  }}
                  onError={(e) => {
                    console.error('Video error:', e)
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="w-full h-full rounded-lg absolute top-0 left-0"
                  style={{
                    transform: 'scaleX(-1)',
                    zIndex: 2,
                    pointerEvents: 'none',
                    display: 'block'
                  }}
                />
                {/* Detection Status Overlay */}
                {!legDetected && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-6 py-4 bg-yellow-500/90 backdrop-blur-sm rounded-lg border border-yellow-400 z-20 text-center max-w-md">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="h-5 w-5 text-yellow-900 animate-pulse" />
                      <span className="font-bold text-yellow-900">Positioning Guide</span>
                    </div>
                    <p className="text-sm text-yellow-900 font-medium mb-1">
                      MediaPipe needs to see your FULL BODY to detect legs
                    </p>
                    <ul className="text-xs text-yellow-800 text-left space-y-1">
                      <li>✓ Stand 3-6 feet from camera</li>
                      <li>✓ Make sure your head and shoulders are visible</li>
                      <li>✓ Your entire body should be in frame</li>
                      <li>✓ Good lighting helps detection</li>
                    </ul>
                  </div>
                )}
                
                {/* ACL Risk Status Overlay */}
                <div className="absolute top-4 left-4 px-4 py-3 bg-black/90 backdrop-blur-sm rounded-lg border z-20 min-w-[280px]" style={{ 
                  borderColor: aclRisk.riskLevel === 'high' ? 'rgba(255, 0, 0, 0.5)' : 
                              aclRisk.riskLevel === 'moderate' ? 'rgba(255, 165, 0, 0.5)' : 
                              legDetected ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)' 
                }}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {aclRisk.riskLevel === 'high' ? (
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                      ) : aclRisk.riskLevel === 'moderate' ? (
                        <AlertTriangle className="h-5 w-5 text-orange-400" />
                      ) : legDetected ? (
                        <Activity className="h-5 w-5 text-green-400" />
                      ) : (
                        <Activity className="h-5 w-5 text-gray-400" />
                      )}
                      <span className={`text-sm font-bold ${
                        aclRisk.riskLevel === 'high' ? 'text-red-400' : 
                        aclRisk.riskLevel === 'moderate' ? 'text-orange-400' : 
                        legDetected ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {aclRisk.message || (legDetected ? 'Leg Detected ✓' : 'Position legs in frame')}
                      </span>
                    </div>
                    {aclRisk.kneeAngle !== null && aclRisk.valgusAngle !== null && (
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mt-2 pt-2 border-t border-white/10">
                        <div>
                          <span className="text-gray-500">Knee Flex:</span>
                          <span className="ml-1 font-semibold">{aclRisk.kneeAngle}°</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Valgus:</span>
                          <span className={`ml-1 font-semibold ${
                            aclRisk.valgusAngle > 15 ? 'text-red-400' : 
                            aclRisk.valgusAngle > 8 ? 'text-orange-400' : 'text-green-400'
                          }`}>
                            {aclRisk.valgusAngle > 0 ? '+' : ''}{aclRisk.valgusAngle}°
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <div className="text-center px-4">
                      <p className="text-white text-lg">Starting camera...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wearable Connection Status */}
        {cameraMode === 'wearable' && (
          <div className="bg-transparent border border-white/10 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <WifiOff className="h-6 w-6 text-gray-400" />
                <span className="text-gray-400">Wearable device connection coming soon</span>
              </div>
              <button
                onClick={() => setCameraMode(null)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {!cameraMode && (
          <div className="bg-transparent border border-white/10 rounded-lg p-12 text-center">
            <WifiOff className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Input Selected</h3>
            <p className="text-gray-400 mb-6">
              Choose a monitoring method above to start
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
