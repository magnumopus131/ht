import { useRouter } from 'next/router'
import { ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#F3EFE7' }}>
      {/* Background image covering whole screen with color overlay */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/bgc.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'sepia(20%) saturate(80%) hue-rotate(10deg) brightness(0.85)',
          opacity: 0.4
        }}
      ></div>
      {/* Color overlay to blend with background */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(243, 239, 231, 0.6)' }}></div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Brand Name */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Norelli, sans-serif' }}>
            Dear, Tear.
          </h1>
        </div>

        {/* Main Headline */}
        <div className="text-center mb-12 max-w-4xl">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 leading-tight mb-4" style={{ fontFamily: 'Norelli, sans-serif' }}>
            AI-powered movement
            <br />
            insights for ACL
            <br />
            injury prevention
          </h2>
        </div>

        {/* Call-to-Action Button */}
        <button
          onClick={() => {
            // Add fade out animation
            document.body.style.transition = 'opacity 0.5s ease-out'
            document.body.style.opacity = '0'
            setTimeout(() => {
              router.push('/discover')
            }, 500)
          }}
          className="group relative px-6 py-3 bg-purple-200 hover:bg-black rounded-full font-semibold text-xs transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 animate-fade-in"
          style={{ fontFamily: '"Big Casion", serif' }}
        >
          <span className="text-gray-900 group-hover:text-white transition-colors">DISCOVER DEAR, TEAR</span>
          <ArrowRight className="h-3 w-3 text-gray-900 group-hover:text-white transition-all group-hover:translate-x-1" />
        </button>
      </div>

      {/* Subtle footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-600 opacity-60">
        <p>Protecting Louisiana's Future Athletes</p>
      </div>
    </div>
  )
}
