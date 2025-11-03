import { useState } from 'react'
import { Calendar, Video, Clock, User, MapPin, Phone, Activity, MessageSquare, ChevronDown, ChevronUp, GraduationCap, Briefcase, Award, Mail } from 'lucide-react'

interface Appointment {
  id: number
  provider: string
  specialty: string
  date: string
  time: string
  duration: number
  type: 'video' | 'in-person'
  status: 'scheduled' | 'completed' | 'cancelled'
}

export default function Telehealth() {
  const [expandedProvider, setExpandedProvider] = useState<number | null>(null)
  const [upcomingAppointments] = useState<Appointment[]>([
    {
      id: 1,
      provider: 'Dr. Sarah Johnson',
      specialty: 'Orthopedic Surgery',
      date: '2024-01-15',
      time: '10:00 AM',
      duration: 30,
      type: 'video',
      status: 'scheduled'
    },
    {
      id: 2,
      provider: 'Dr. Michael Chen',
      specialty: 'Sports Medicine',
      date: '2024-01-20',
      time: '2:00 PM',
      duration: 45,
      type: 'video',
      status: 'scheduled'
    }
  ])

  const [availableProviders] = useState([
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialty: 'Orthopedic Surgery',
      credentials: 'MD, FAAOS',
      education: 'LSU Health Sciences Center',
      experience: '15 years',
      location: 'New Orleans, LA',
      email: 'sarah.johnson@deartear.com',
      phone: '(504) 555-0123',
      nextAvailable: 'Jan 18, 2024',
      rating: 4.9,
      patientsTreated: '1,200+',
      isRural: false,
      certifications: ['Board Certified Orthopedic Surgeon', 'ACL Specialist'],
      suggestions: [
        'Focus on strengthening quadriceps and hamstrings to support knee stability',
        'Incorporate plyometric exercises to improve landing mechanics',
        'Consider wearing a compression sleeve during high-intensity activities'
      ]
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialty: 'Sports Medicine',
      credentials: 'MD, CAQSM',
      education: 'Tulane University School of Medicine',
      experience: '12 years',
      location: 'Baton Rouge, LA',
      email: 'michael.chen@deartear.com',
      phone: '(225) 555-0456',
      nextAvailable: 'Jan 16, 2024',
      rating: 4.8,
      patientsTreated: '950+',
      isRural: false,
      certifications: ['Sports Medicine Fellowship', 'Primary Care Sports Medicine'],
      suggestions: [
        'Monitor movement patterns during cutting and pivoting movements',
        'Implement external focus training cues for better motor learning',
        'Regular biomechanics assessments to track improvement'
      ]
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      specialty: 'Physical Therapy',
      credentials: 'DPT, OCS',
      education: 'University of Louisiana at Lafayette',
      experience: '8 years',
      location: 'Lafayette, LA',
      email: 'emily.rodriguez@deartear.com',
      phone: '(337) 555-0789',
      nextAvailable: 'Jan 19, 2024',
      rating: 4.7,
      patientsTreated: '650+',
      isRural: true,
      certifications: ['Orthopedic Clinical Specialist', 'Certified Strength Coach'],
      suggestions: [
        'Progressive rehabilitation protocol focusing on range of motion',
        'Balance and proprioception training exercises',
        'Gradual return-to-sport progression plan'
      ]
    }
  ])

  const handleScheduleAppointment = (providerId: number) => {
    // In production, this would open a scheduling modal
    alert(`Scheduling appointment with provider ${providerId}. This feature will integrate with a scheduling system.`)
  }

  const handleJoinCall = (appointmentId: number) => {
    // In production, this would initiate WebRTC video call
    alert(`Joining video call for appointment ${appointmentId}. WebRTC integration would be implemented here.`)
  }

  return (
    <div className="min-h-screen bg-[#1a2332] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-yellow-400 rounded-lg">
              <Video className="h-6 w-6 text-[#1a2332]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Telehealth Services</h1>
              <p className="text-gray-400">Connect with orthopedic specialists and sports medicine doctors</p>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-transparent border border-white/10 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5 text-white" />
            <h2 className="text-xl font-semibold text-white">Upcoming Appointments</h2>
          </div>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <User className="h-5 w-5 text-yellow-400" />
                        <h3 className="text-lg font-semibold text-white">
                          {appointment.provider}
                        </h3>
                        <span className="px-2 py-1 bg-blue-500/30 text-blue-300 border border-blue-500/50 rounded text-xs font-medium">
                          {appointment.specialty}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400 ml-8">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{appointment.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.time} ({appointment.duration} min)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Video className="h-4 w-4" />
                          <span className="capitalize">{appointment.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {appointment.status === 'scheduled' && (
                        <button
                          onClick={() => handleJoinCall(appointment.id)}
                          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-[#1a2332] font-semibold rounded-lg transition-colors"
                        >
                          Join Call
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No upcoming appointments scheduled
            </div>
          )}
        </div>

        {/* Available Doctors */}
        <div className="bg-transparent border border-white/10 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Available Doctors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableProviders.map((provider) => (
              <div
                key={provider.id}
                className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
                    <p className="text-sm text-gray-400">{provider.specialty}</p>
                    {provider.credentials && (
                      <p className="text-xs text-gray-500 mt-1">{provider.credentials}</p>
                    )}
                  </div>
                  {provider.isRural && (
                    <span className="px-2 py-1 bg-yellow-400/30 text-yellow-300 border border-yellow-500/50 rounded text-xs font-medium">
                      Rural Access
                    </span>
                  )}
                </div>

                {/* Doctor Details */}
                <div className="space-y-2 mb-4 border-t border-white/10 pt-4">
                  {provider.education && (
                    <div className="flex items-start space-x-2 text-sm text-gray-400">
                      <GraduationCap className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>{provider.education}</span>
                    </div>
                  )}
                  {provider.experience && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Briefcase className="h-4 w-4 text-yellow-400" />
                      <span>{provider.experience} of experience</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <MapPin className="h-4 w-4 text-yellow-400" />
                    <span>{provider.location}</span>
                  </div>
                  {provider.patientsTreated && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <User className="h-4 w-4 text-yellow-400" />
                      <span>{provider.patientsTreated} patients treated</span>
                    </div>
                  )}
                  {provider.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Mail className="h-4 w-4 text-yellow-400" />
                      <span className="truncate">{provider.email}</span>
                    </div>
                  )}
                  {provider.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Phone className="h-4 w-4 text-yellow-400" />
                      <span>{provider.phone}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-400">
                    Next available: <span className="text-white">{provider.nextAvailable}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Rating: <span className="text-yellow-400">⭐ {provider.rating}/5.0</span>
                  </div>
                </div>

                {/* Certifications */}
                {provider.certifications && provider.certifications.length > 0 && (
                  <div className="mb-4 border-t border-white/10 pt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="h-4 w-4 text-yellow-400" />
                      <span className="text-xs font-semibold text-white">Certifications</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {provider.certifications.map((cert, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-500/30 text-blue-300 border border-blue-500/50 rounded text-xs">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Doctor Suggestions */}
                {provider.suggestions && provider.suggestions.length > 0 && (
                  <div className="mb-4 border-t border-white/10 pt-4">
                    <button
                      onClick={() => setExpandedProvider(expandedProvider === provider.id ? null : provider.id)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-semibold text-white">Doctor's Suggestions</span>
                      </div>
                      {expandedProvider === provider.id ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {expandedProvider === provider.id && (
                      <div className="mt-3 space-y-2">
                        {provider.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <p className="text-sm text-gray-300 leading-relaxed">{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => handleScheduleAppointment(provider.id)}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Schedule Appointment
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-6 bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-red-400" />
            <div>
              <h3 className="font-semibold text-red-300">Need Immediate Care?</h3>
              <p className="text-sm text-red-200">
                For emergency situations, call 911 or visit your nearest emergency room. Telehealth is for non-emergency consultations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
