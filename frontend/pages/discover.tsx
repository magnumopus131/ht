import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

interface MapDot {
  id: number
  x: number
  y: number
  color: 'red' | 'purple' | 'green'
  title: string
  description: string
  stat?: string
  icon?: string
}

interface Feature {
  id: number
  title: string
  description: string
  icon: string
  details: string[]
}

const getFeatureIllustration = (featureId: number) => {
  switch (featureId) {
    case 1: // Real-Time Biomechanics Monitoring
      return (
        <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
          <ellipse cx="200" cy="100" rx="40" ry="50" fill="#D4A574" opacity="0.3" />
          <rect x="185" y="150" width="30" height="120" fill="#D4A574" opacity="0.3" rx="5" />
          <rect x="160" y="160" width="25" height="100" fill="#D4A574" opacity="0.3" rx="5" />
          <rect x="215" y="160" width="25" height="100" fill="#D4A574" opacity="0.3" rx="5" />
          <rect x="185" y="270" width="15" height="40" fill="#D4A574" opacity="0.3" rx="5" />
          <rect x="200" y="270" width="15" height="40" fill="#D4A574" opacity="0.3" rx="5" />
          <circle cx="200" cy="200" r="25" fill="none" stroke="#8B5CF6" strokeWidth="3" />
          <circle cx="200" cy="200" r="15" fill="#8B5CF6" opacity="0.3" />
          <path d="M 250 150 Q 270 140, 290 150 T 330 150" stroke="#8B5CF6" strokeWidth="2" fill="none" />
          <path d="M 250 180 Q 270 170, 290 180 T 330 180" stroke="#8B5CF6" strokeWidth="2" fill="none" />
          <path d="M 250 210 Q 270 200, 290 210 T 330 210" stroke="#8B5CF6" strokeWidth="2" fill="none" />
          <circle cx="175" cy="190" r="3" fill="#10B981" />
          <circle cx="225" cy="190" r="3" fill="#10B981" />
          <circle cx="200" cy="210" r="3" fill="#10B981" />
        </svg>
      )
    case 2: // AI-Powered Risk Assessment
      return (
        <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
          <circle cx="100" cy="100" r="20" fill="#8B5CF6" opacity="0.4" />
          <circle cx="200" cy="80" r="20" fill="#8B5CF6" opacity="0.4" />
          <circle cx="300" cy="100" r="20" fill="#8B5CF6" opacity="0.4" />
          <circle cx="150" cy="200" r="25" fill="#8B5CF6" opacity="0.5" />
          <circle cx="250" cy="200" r="25" fill="#8B5CF6" opacity="0.5" />
          <circle cx="200" cy="300" r="30" fill="#8B5CF6" opacity="0.6" />
          <line x1="100" y1="100" x2="150" y2="200" stroke="#8B5CF6" strokeWidth="2" opacity="0.3" />
          <line x1="200" y1="80" x2="150" y2="200" stroke="#8B5CF6" strokeWidth="2" opacity="0.3" />
          <line x1="300" y1="100" x2="250" y2="200" stroke="#8B5CF6" strokeWidth="2" opacity="0.3" />
          <line x1="150" y1="200" x2="200" y2="300" stroke="#8B5CF6" strokeWidth="2" opacity="0.3" />
          <line x1="250" y1="200" x2="200" y2="300" stroke="#8B5CF6" strokeWidth="2" opacity="0.3" />
          <rect x="50" y="320" width="300" height="60" fill="none" stroke="#8B5CF6" strokeWidth="2" rx="5" />
          <rect x="60" y="340" width="80" height="30" fill="#10B981" opacity="0.6" />
          <rect x="150" y="330" width="60" height="40" fill="#F59E0B" opacity="0.6" />
          <rect x="220" y="350" width="40" height="20" fill="#EF4444" opacity="0.6" />
        </svg>
      )
    case 3: // Collaborative Care Platform
      return (
        <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
          <circle cx="100" cy="120" r="30" fill="#D4A574" opacity="0.3" />
          <circle cx="100" cy="120" r="15" fill="#8B5CF6" opacity="0.5" />
          <text x="100" y="125" textAnchor="middle" fill="#8B5CF6" fontSize="20" fontWeight="bold">A</text>
          <circle cx="200" cy="100" r="30" fill="#D4A574" opacity="0.3" />
          <circle cx="200" cy="100" r="15" fill="#8B5CF6" opacity="0.5" />
          <text x="200" y="105" textAnchor="middle" fill="#8B5CF6" fontSize="20" fontWeight="bold">C</text>
          <circle cx="300" cy="120" r="30" fill="#D4A574" opacity="0.3" />
          <circle cx="300" cy="120" r="15" fill="#8B5CF6" opacity="0.5" />
          <text x="300" y="125" textAnchor="middle" fill="#8B5CF6" fontSize="20" fontWeight="bold">P</text>
          <circle cx="200" cy="220" r="40" fill="#8B5CF6" opacity="0.2" />
          <circle cx="200" cy="220" r="25" fill="#8B5CF6" opacity="0.4" />
          <circle cx="200" cy="220" r="10" fill="#8B5CF6" />
          <line x1="100" y1="150" x2="200" y2="200" stroke="#8B5CF6" strokeWidth="2" opacity="0.4" />
          <line x1="200" y1="130" x2="200" y2="200" stroke="#8B5CF6" strokeWidth="2" opacity="0.4" />
          <line x1="300" y1="150" x2="200" y2="200" stroke="#8B5CF6" strokeWidth="2" opacity="0.4" />
          <rect x="80" y="280" width="240" height="100" fill="white" stroke="#8B5CF6" strokeWidth="2" rx="5" />
          <rect x="100" y="300" width="60" height="20" fill="#8B5CF6" opacity="0.3" />
          <rect x="180" y="300" width="60" height="20" fill="#8B5CF6" opacity="0.3" />
          <rect x="260" y="300" width="40" height="20" fill="#8B5CF6" opacity="0.3" />
          <line x1="100" y1="340" x2="300" y2="340" stroke="#8B5CF6" strokeWidth="1" opacity="0.2" />
          <line x1="100" y1="360" x2="300" y2="360" stroke="#8B5CF6" strokeWidth="1" opacity="0.2" />
        </svg>
      )
    case 4: // Personalized Rehabilitation Plans
      return (
        <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
          <line x1="80" y1="200" x2="320" y2="200" stroke="#8B5CF6" strokeWidth="3" />
          <circle cx="120" cy="200" r="12" fill="#10B981" />
          <circle cx="200" cy="200" r="12" fill="#10B981" />
          <circle cx="280" cy="200" r="12" fill="#8B5CF6" opacity="0.5" />
          <rect x="100" y="140" width="40" height="30" fill="#8B5CF6" opacity="0.2" rx="3" />
          <line x1="110" y1="150" x2="130" y2="150" stroke="#8B5CF6" strokeWidth="2" />
          <line x1="120" y1="140" x2="120" y2="170" stroke="#8B5CF6" strokeWidth="2" />
          <rect x="180" y="140" width="40" height="30" fill="#8B5CF6" opacity="0.2" rx="3" />
          <circle cx="200" cy="155" r="8" fill="#8B5CF6" opacity="0.5" />
          <rect x="260" y="140" width="40" height="30" fill="#8B5CF6" opacity="0.2" rx="3" />
          <path d="M 270 155 L 290 155 M 280 145 L 280 165" stroke="#8B5CF6" strokeWidth="2" />
          <rect x="100" y="250" width="160" height="20" fill="#E5E7EB" rx="10" />
          <rect x="100" y="250" width="120" height="20" fill="#10B981" rx="10" />
          <text x="280" y="265" fill="#8B5CF6" fontSize="14" fontWeight="bold">75%</text>
          <circle cx="200" cy="320" r="40" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeDasharray="200 50" />
          <text x="200" y="330" textAnchor="middle" fill="#8B5CF6" fontSize="16" fontWeight="bold">Week 6</text>
        </svg>
      )
    case 5: // Telehealth & Education
      return (
        <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
          <rect x="50" y="80" width="120" height="90" fill="#8B5CF6" opacity="0.1" stroke="#8B5CF6" strokeWidth="2" rx="5" />
          <circle cx="110" cy="125" r="25" fill="#D4A574" opacity="0.3" />
          <circle cx="110" cy="125" r="15" fill="#8B5CF6" opacity="0.5" />
          <rect x="230" y="80" width="120" height="90" fill="#8B5CF6" opacity="0.1" stroke="#8B5CF6" strokeWidth="2" rx="5" />
          <circle cx="290" cy="125" r="25" fill="#D4A574" opacity="0.3" />
          <circle cx="290" cy="125" r="15" fill="#8B5CF6" opacity="0.5" />
          <line x1="170" y1="125" x2="230" y2="125" stroke="#8B5CF6" strokeWidth="3" strokeDasharray="5,5" />
          <circle cx="200" cy="240" r="40" fill="#8B5CF6" opacity="0.1" />
          <path d="M 200 200 L 200 280 M 180 240 L 220 240" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
          <rect x="120" y="300" width="60" height="50" fill="#8B5CF6" opacity="0.1" stroke="#8B5CF6" strokeWidth="2" rx="3" />
          <line x1="130" y1="315" x2="170" y2="315" stroke="#8B5CF6" strokeWidth="1" />
          <line x1="130" y1="325" x2="170" y2="325" stroke="#8B5CF6" strokeWidth="1" />
          <line x1="130" y1="335" x2="160" y2="335" stroke="#8B5CF6" strokeWidth="1" />
          <rect x="220" y="300" width="60" height="50" fill="#8B5CF6" opacity="0.1" stroke="#8B5CF6" strokeWidth="2" rx="3" />
          <circle cx="245" cy="320" r="8" fill="#8B5CF6" opacity="0.5" />
          <circle cx="265" cy="320" r="8" fill="#8B5CF6" opacity="0.5" />
        </svg>
      )
    default:
      return null
  }
}

export default function Discover() {
  const router = useRouter()
  const [selectedDot, setSelectedDot] = useState<MapDot | null>(null)
  const [mounted, setMounted] = useState(false)
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null)

  const features: Feature[] = [
    {
      id: 1,
      title: 'Real-Time Biomechanics Monitoring',
      description: 'AI-powered movement analysis detects high-risk patterns instantly during training',
      icon: '',
      details: [
        'Wearable device integration (IMU sensors, smart braces)',
        'Real-time movement analysis at 1000Hz sampling rate',
        'Early detection of high-risk movement patterns',
        'Instant haptic and audio feedback for athletes',
        'Live data streaming to coach dashboard during practice'
      ]
    },
    {
      id: 2,
      title: 'AI-Powered Risk Assessment',
      description: 'Machine learning models trained on biomechanical data provide personalized risk scoring',
      icon: '',
      details: [
        'Personalized risk scoring based on movement patterns',
        'Demographic and health history analysis',
        'Predictive analytics to identify at-risk athletes',
        'Louisiana-specific risk factor consideration',
        'Environmental conditions and training load integration'
      ]
    },
    {
      id: 3,
      title: 'Collaborative Care Platform',
      description: 'Connected ecosystem for athletes, coaches, trainers, and healthcare providers',
      icon: '',
      details: [
        'Multi-user dashboard system with role-based access',
        'Shared dashboards and progress tracking',
        'Real-time team risk monitoring for coaches',
        'Secure messaging for care coordination',
        'Data-driven decision making for training modifications'
      ]
    },
    {
      id: 4,
      title: 'Personalized Rehabilitation Plans',
      description: 'AI-generated, evidence-based recovery protocols that adapt to progress',
      icon: '',
      details: [
        'AI-generated, evidence-based recovery protocols',
        'Adaptive plans that adjust based on progress and compliance',
        'Integration with telehealth appointments',
        'Progress tracking toward movement goals',
        'Exercise videos and training recommendations'
      ]
    },
    {
      id: 5,
      title: 'Telehealth & Education',
      description: 'Virtual consultations and educational resources expanding access to specialized care',
      icon: '',
      details: [
        'Virtual consultations with orthopedic specialists',
        'Remote rehabilitation guidance',
        'Educational resources for injury prevention',
        'Mobile app access for rural communities',
        'Parent and coach education on ACL injury prevention'
      ]
    }
  ]

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    // Reset body opacity on mount
    document.body.style.opacity = '1'
    document.body.style.transition = 'opacity 0.5s ease-in'
    setMounted(true)
  }, [])

  const mapDots: MapDot[] = [
    {
      id: 1,
      x: 20,
      y: 25,
      color: 'green',
      title: 'Real-Time Monitoring',
      description: 'AI-powered movement analysis detects high-risk patterns instantly during training',
      stat: '1000Hz',
      icon: ''
    },
    {
      id: 2,
      x: 15,
      y: 75,
      color: 'green',
      title: 'ACL Injury Statistics',
      description: 'Female athletes are 4-6x more likely to sustain ACL injuries than males',
      stat: '4-6x',
      icon: ''
    },
    {
      id: 3,
      x: 25,
      y: 55,
      color: 'red',
      title: 'Louisiana Challenge',
      description: 'High childhood obesity rates increase joint stress and slow recovery times',
      stat: '18.9%',
      icon: ''
    },
    {
      id: 4,
      x: 80,
      y: 70,
      color: 'purple',
      title: '3D Pressure Analysis',
      description: 'Visualize real-time pressure distribution across knee structures',
      icon: ''
    },
    {
      id: 5,
      x: 85,
      y: 25,
      color: 'red',
      title: 'Rural Access',
      description: 'Limited access to orthopedic specialists in rural Louisiana areas',
      stat: '60%',
      icon: ''
    },
    {
      id: 6,
      x: 90,
      y: 80,
      color: 'green',
      title: 'Prevention Focus',
      description: 'Early detection reduces ACL injury risk by up to 50%',
      stat: '50%',
      icon: ''
    }
  ]

  const getDotColor = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500' // Challenges / Statistics
      case 'purple': return 'bg-purple-500' // Features / Technology
      case 'green': return 'bg-green-500' // Benefits / Solutions
      default: return 'bg-gray-500'
    }
  }

  return (
    <div 
      className="relative transition-opacity duration-500" 
      style={{ 
        backgroundColor: '#F3EFE7',
        opacity: mounted ? 1 : 0
      }}
    >
      {/* Map Background Illustration - only for first section */}
      <div className="absolute inset-0 opacity-30 h-screen pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          {/* Tree clusters */}
          {Array.from({ length: 50 }).map((_, i) => {
            const x = Math.random() * 1200
            const y = Math.random() * 800
            const size = 10 + Math.random() * 30
            return (
              <g key={i} transform={`translate(${x}, ${y})`}>
                <circle cx="0" cy="0" r={size} fill="#8B7355" opacity={0.1 + Math.random() * 0.1} />
                <line x1="0" y1={-size} x2="0" y2={size} stroke="#8B7355" strokeWidth="1" opacity={0.2} />
              </g>
            )
          })}
          {/* Contour lines */}
          {Array.from({ length: 20 }).map((_, i) => (
            <path
              key={`contour-${i}`}
              d={`M ${Math.random() * 1200} ${Math.random() * 800} Q ${Math.random() * 1200} ${Math.random() * 800} ${Math.random() * 1200} ${Math.random() * 800}`}
              stroke="#8B7355"
              strokeWidth="0.5"
              fill="none"
              strokeDasharray="2,2"
              opacity={0.15}
            />
          ))}
        </svg>
      </div>

      {/* Header - Sticky */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between bg-[#F3EFE7]/95 backdrop-blur-sm">
        <h1 
          className="text-2xl font-bold text-gray-900 cursor-pointer" 
          style={{ fontFamily: 'Norelli, sans-serif' }}
          onClick={() => router.push('/')}
        >
          Dear, Tear.
        </h1>
        <nav className="flex items-center space-x-8">
          <button onClick={scrollToFeatures} className="text-gray-900 hover:text-gray-700 text-sm font-medium">WHAT WE DO</button>
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

      {/* Main Content - Map Section */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-8 pt-20">
        {/* Central Text Block */}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p className="text-gray-900 text-3xl md:text-4xl font-bold leading-relaxed" style={{ fontFamily: 'Norelli, sans-serif' }}>
            We are an artificial intelligence company, focused on ACL injury prevention and recovery for Louisiana's young athletes.
          </p>
        </div>

        {/* Map Dots */}
        <div className="absolute inset-0 pointer-events-none h-screen">
          {mapDots.map((dot, index) => {
            const orbitRadii = [20, 32, 44, 20, 32, 44] // Orbit sizes for each dot
            const orbitSpeed = 8 + index * 1.2 // Different speeds (8-15s)
            const orbitRadius = orbitRadii[index]
            
            return (
              <div
                key={dot.id}
                className="absolute pointer-events-auto cursor-pointer"
                style={{ 
                  left: `${dot.x}%`, 
                  top: `${dot.y}%`,
                  width: '0px',
                  height: '0px',
                  transformOrigin: 'center',
                  animation: `orbit-rotate-${dot.id} ${orbitSpeed}s linear infinite`
                }}
                onClick={() => setSelectedDot(selectedDot?.id === dot.id ? null : dot)}
              >
                <div 
                  className={`w-3 h-3 ${getDotColor(dot.color)} rounded-full shadow-lg hover:scale-150 transition-transform absolute`}
                  style={{
                    left: `${orbitRadius}px`,
                    top: '0px',
                    transform: 'translate(-50%, -50%)'
                  }}
                ></div>
                
                
              </div>
            )
          })}
        </div>
        
        {/* Info Box - positioned next to clicked dot */}
        {selectedDot && (() => {
          const dot = mapDots.find(d => d.id === selectedDot.id)
          if (!dot) return null
          
          // Determine which side to show box (left or right of dot)
          const showOnRight = dot.x < 50 // If dot is on left side, show box on right of dot
          const boxOffsetX = showOnRight ? 40 : -340 // Distance from dot (positive = right, negative = left accounting for box width)
          const boxOffsetY = -50 // Vertical offset to center with dot
          
          return (
            <div 
              className="absolute bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-4 min-w-[280px] max-w-[320px] pointer-events-auto z-50"
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                transform: `translate(${boxOffsetX}px, ${boxOffsetY}px)`
              }}
            >
            <button
              onClick={() => setSelectedDot(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl leading-none w-6 h-6 flex items-center justify-center"
            >
              ×
            </button>
            <div className="text-sm text-gray-700 space-y-2 pr-6">
              <div className="text-gray-600 text-sm leading-relaxed">{selectedDot.description}</div>
            </div>
            </div>
          )
        })()}
      </div>

      {/* Features Section */}
      <section id="features-section" className="relative z-10 py-24 px-8 bg-[#F3EFE7]">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: 'Norelli, sans-serif' }}
            >
              What We Do
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Comprehensive ACL injury prevention and recovery for Louisiana's young athletes
            </p>
          </div>

          {/* Features List with Images */}
          <div className="space-y-24 mb-12">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className="flex flex-col md:flex-row items-center gap-12"
              >
                {/* Content Section */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-6xl font-bold text-gray-300" style={{ fontFamily: 'Norelli, sans-serif' }}>
                      {String(feature.id).padStart(2, '0')}
                    </div>
                  </div>
                  <h3 
                    className="text-4xl md:text-5xl font-bold text-gray-900"
                    style={{ fontFamily: 'Norelli, sans-serif' }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {feature.description}
                  </p>
                  <button
                    onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium underline"
                  >
                    {expandedFeature === feature.id ? 'Show less' : 'Learn more'}
                  </button>
                  
                  {expandedFeature === feature.id && (
                    <div className="mt-6 pt-6 border-t border-gray-300 animate-fade-in">
                      <ul className="space-y-3">
                        {feature.details.map((detail, idx) => (
                          <li key={idx} className="text-base text-gray-700 flex items-start">
                            <span className="text-purple-500 mr-3 mt-1">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Image/Illustration Section */}
                <div className="flex-1 w-full h-96 bg-white/40 backdrop-blur-sm rounded-lg overflow-hidden flex items-center justify-center border border-gray-200/50">
                  {getFeatureIllustration(feature.id)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16 px-8" style={{ backgroundColor: '#1A0F2B' }}>
        <div className="max-w-7xl mx-auto">
          {/* Navigation Links */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-12 mb-16">
            {/* Science Section */}
            <div>
              <h3 className="text-white text-sm font-medium mb-6">SCIENCE:</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => router.push('/science')}
                    className="text-white text-sm font-light hover:opacity-70 transition-opacity text-left"
                  >
                    RESEARCH PAPERS
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => router.push('/science')}
                    className="text-white text-sm font-light hover:opacity-70 transition-opacity text-left"
                  >
                    BIOMECHANICS & MOVEMENT ANALYSIS
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => router.push('/science')}
                    className="text-white text-sm font-light hover:opacity-70 transition-opacity text-left"
                  >
                    PREVENTION PROGRAMS
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => router.push('/science')}
                    className="text-white text-sm font-light hover:opacity-70 transition-opacity text-left"
                  >
                    ACL INJURY RESEARCH
                  </button>
                </li>
              </ul>
            </div>

            {/* Privacy Section */}
            <div>
              <h3 className="text-white text-sm font-medium mb-6">PRIVACY</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-white text-sm font-light hover:opacity-70 transition-opacity">
                    TERMS AND CONDITIONS
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white text-sm font-light hover:opacity-70 transition-opacity">
                    OUR TEAM
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white text-sm font-light hover:opacity-70 transition-opacity">
                    CONTACT US
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="flex justify-between items-center pt-8 border-t border-white/10">
            <div className="text-white text-sm font-light">
              MADE BY DEAR, TEAR
            </div>
            <div className="text-white text-sm font-light">
              2025
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}

