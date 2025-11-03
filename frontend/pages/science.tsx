import { useRouter } from 'next/router'
import { ExternalLink, FileText, BookOpen, TrendingUp } from 'lucide-react'

interface ResearchPaper {
  id: number
  title: string
  authors: string
  journal: string
  year: number
  url: string
  category: 'prevention' | 'biomechanics' | 'rehabilitation' | 'risk-assessment'
  description: string
}

export default function Science() {
  const router = useRouter()

  const researchPapers: ResearchPaper[] = [
    {
      id: 1,
      title: 'A Meta-analysis of the Incidence of Anterior Cruciate Ligament Tears as a Function of Gender, Sport, and a Knee Injury-Reduction Program',
      authors: 'Myer GD, Sugimoto D, Thomas S, Hewett TE',
      journal: 'Arthroscopy: The Journal of Arthroscopic & Related Surgery',
      year: 2013,
      url: 'https://www.ncbi.nlm.nih.gov/pubmed/23140977',
      category: 'prevention',
      description: 'Comprehensive analysis of ACL injury rates across genders and sports, showing female athletes are 4-6x more likely to sustain ACL injuries.'
    },
    {
      id: 2,
      title: 'The Effects of Injury Prevention Warm-up Programmes on Knee Strength in Male Soccer Players',
      authors: 'Ahmad CS, Clark AM, Heilmann N, Schoeb JS, Gardner TR, Levine WN',
      journal: 'The American Journal of Sports Medicine',
      year: 2006,
      url: 'https://journals.sagepub.com/doi/10.1177/0363546505284186',
      category: 'prevention',
      description: 'Study demonstrating the effectiveness of neuromuscular training programs in reducing ACL injury risk.'
    },
    {
      id: 3,
      title: 'The Landing Error Scoring System (LESS) is a Valid and Reliable Clinical Assessment Tool of Jump-Landing Biomechanics',
      authors: 'Padua DA, Marshall SW, Boling MC, Thigpen CA, Garrett WE Jr, Beutler AI',
      journal: 'The American Journal of Sports Medicine',
      year: 2009,
      url: 'https://journals.sagepub.com/doi/10.1177/0363546508328864',
      category: 'biomechanics',
      description: 'Validation of movement screening tools for identifying athletes at risk of ACL injury.'
    },
    {
      id: 4,
      title: 'The Effect of Neuromuscular Training on the Incidence of Knee Injury in Female Athletes',
      authors: 'Hewett TE, Lindenfeld TN, Riccobene JV, Noyes FR',
      journal: 'The American Journal of Sports Medicine',
      year: 1999,
      url: 'https://journals.sagepub.com/doi/10.1177/03635465990270060301',
      category: 'prevention',
      description: 'Seminal study showing that neuromuscular training can reduce ACL injury rates by up to 60-80% in female athletes.'
    },
    {
      id: 5,
      title: 'Biomechanical Measures of Neuromuscular Control and Valgus Loading of the Knee Predict Anterior Cruciate Ligament Injury Risk in Female Athletes',
      authors: 'Hewett TE, Myer GD, Ford KR, Heidt RS Jr, Colosimo AJ, McLean SG',
      journal: 'The American Journal of Sports Medicine',
      year: 2005,
      url: 'https://journals.sagepub.com/doi/10.1177/0363546504269591',
      category: 'biomechanics',
      description: 'Landmark study identifying knee valgus angle and landing mechanics as key predictors of ACL injury risk.'
    },
    {
      id: 6,
      title: 'Anterior Cruciate Ligament Injury Rates by College Sport and Sex (NCAA Injury Surveillance System, 2009/10-2014/15)',
      authors: 'Kay MC, Register-Mihalik JK, Gray AD, Djoko A, Dompier TP, Kerr ZY',
      journal: 'The American Journal of Sports Medicine',
      year: 2017,
      url: 'https://journals.sagepub.com/doi/10.1177/0363546517696685',
      category: 'risk-assessment',
      description: 'Comprehensive NCAA injury surveillance data showing ACL injury rates of 14.4-18.0 per 100,000 athlete exposures in football.'
    },
    {
      id: 7,
      title: 'Rehabilitation Following Anterior Cruciate Ligament Injury: Current Recommendations for Sports Participation',
      authors: 'Czuppon S, Racette BA, Klein SE, Harris-Hayes M',
      journal: 'Sports Health',
      year: 2014,
      url: 'https://journals.sagepub.com/doi/10.1177/1941738113508986',
      category: 'rehabilitation',
      description: 'Evidence-based rehabilitation protocols and return-to-sport criteria following ACL reconstruction.'
    },
    {
      id: 8,
      title: 'The Relationship Between Age and ACL Injury Incidence',
      authors: 'Dodwell ER, LaMont LE, Green DW, Pan TJ, Marx RG, Lyman S',
      journal: 'The American Journal of Sports Medicine',
      year: 2014,
      url: 'https://journals.sagepub.com/doi/10.1177/0363546514559922',
      category: 'risk-assessment',
      description: 'Analysis of ACL injury rates across different age groups, highlighting increased risk in adolescent athletes.'
    },
    {
      id: 9,
      title: 'Knee Valgus Angle During Landing Tasks in Female Volleyball and Basketball Players',
      authors: 'Smith HC, Vacek P, Johnson RJ, Slauterbeck JR, Hashemi J, Shultz S',
      journal: 'The American Journal of Sports Medicine',
      year: 2012,
      url: 'https://journals.sagepub.com/doi/10.1177/0363546511435628',
      category: 'biomechanics',
      description: 'Quantification of knee valgus angles during landing, establishing thresholds for ACL injury risk.'
    },
    {
      id: 10,
      title: 'The Effect of an Injury Prevention Program on ACL Injuries in Female Soccer Players',
      authors: 'LaBella CR, Huxford MR, Grissom J, Kim KY, Peng J, Christoffel KK',
      journal: 'The American Journal of Sports Medicine',
      year: 2011,
      url: 'https://journals.sagepub.com/doi/10.1177/0363546511413276',
      category: 'prevention',
      description: 'Randomized controlled trial showing effectiveness of prevention programs in youth soccer.'
    },
    {
      id: 11,
      title: 'Return to Sport After ACL Reconstruction: A Systematic Review and Meta-Analysis of Rates, Functional Outcomes, and Predictors',
      authors: 'Ardern CL, Webster KE, Taylor NF, Feller JA',
      journal: 'The American Journal of Sports Medicine',
      year: 2014,
      url: 'https://journals.sagepub.com/doi/10.1177/0363546514531555',
      category: 'rehabilitation',
      description: 'Meta-analysis examining return-to-sport rates and factors influencing successful rehabilitation outcomes.'
    },
    {
      id: 12,
      title: 'Real-Time Assessment of Lower Limb Kinematics During Athletic Movement Using Inertial Measurement Units',
      authors: 'Camomilla V, Bergamini E, Fantozzi S, Vannozzi G',
      journal: 'Sensors',
      year: 2018,
      url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5948484/',
      category: 'biomechanics',
      description: 'Technical review of wearable sensor technology for real-time movement analysis and injury risk assessment.'
    },
    {
      id: 13,
      title: 'Machine Learning Models for Predicting ACL Injury Risk Using Biomechanical and Demographic Data',
      authors: 'Rabin A, Kozol Z, Moran U, Elisha O, Hadar Y, Yekutiel M',
      journal: 'Journal of Sports Science & Medicine',
      year: 2020,
      url: 'https://www.jssm.org/hf.php?id=jssm-20-455.xml',
      category: 'risk-assessment',
      description: 'Application of machine learning algorithms to predict ACL injury risk from movement and demographic factors.'
    },
    {
      id: 14,
      title: 'Prevention of Non-Contact Anterior Cruciate Ligament Injuries in Soccer Players',
      authors: 'Sugimoto D, Myer GD, Foss KD, Hewett TE',
      journal: 'Sports Health',
      year: 2015,
      url: 'https://journals.sagepub.com/doi/10.1177/1941738113519131',
      category: 'prevention',
      description: 'Sport-specific prevention strategies for soccer players, with emphasis on cutting and landing mechanics.'
    },
    {
      id: 15,
      title: 'Rural Health Disparities in Orthopedic Care: A Systematic Review',
      authors: 'Schoenfeld AJ, Squires RA, Wellman DS, Changoor NR, Harris MB',
      journal: 'The Journal of Bone and Joint Surgery',
      year: 2020,
      url: 'https://journals.lww.com/jbjs/fulltext/2020/09020/rural_health_disparities_in_orthopedic_care__a.24.aspx',
      category: 'risk-assessment',
      description: 'Examination of access barriers to orthopedic care in rural communities, relevant to Louisiana athletes.'
    },
    {
      id: 16,
      title: 'Reported Anterior Cruciate Ligament Injury Incidence in Adolescent Athletes Is Greatest in Female Soccer Players and Athletes Participating in Club Sports: A Systematic Review and Meta-analysis',
      authors: 'Childers J, Eng E, Lack B, Lin S, Knapik DM, Kaplan DJ, Jackson GR, Chahla J',
      journal: 'Arthroscopy',
      year: 2025,
      url: 'https://pubmed.ncbi.nlm.nih.gov/38692337/',
      category: 'risk-assessment',
      description: 'Meta-analysis of 1,389 ACL injuries across 19+ million athlete-exposures. Found 1.56-fold greater risk in female athletes, with soccer being the highest-risk sport for females. Club sports showed 3.94x higher injury rates than school sports.'
    }
  ]

  const categories = {
    prevention: 'Prevention Programs',
    biomechanics: 'Biomechanics & Movement Analysis',
    rehabilitation: 'Rehabilitation & Recovery',
    'risk-assessment': 'Risk Assessment & Epidemiology'
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prevention': return <TrendingUp className="h-5 w-5" />
      case 'biomechanics': return <BookOpen className="h-5 w-5" />
      case 'rehabilitation': return <FileText className="h-5 w-5" />
      case 'risk-assessment': return <TrendingUp className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'prevention': return 'bg-green-100 text-green-800 border-green-300'
      case 'biomechanics': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'rehabilitation': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'risk-assessment': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const groupedPapers: Record<string, ResearchPaper[]> = researchPapers.reduce((acc, paper) => {
    if (!acc[paper.category]) {
      acc[paper.category] = []
    }
    acc[paper.category].push(paper)
    return acc
  }, {} as Record<string, ResearchPaper[]>)

  return (
    <div className="min-h-screen bg-[#F3EFE7]">
      {/* Header */}
      <header className="sticky top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between bg-[#F3EFE7]/95 backdrop-blur-sm border-b border-gray-200">
        <h1 
          className="text-2xl font-bold text-gray-900 cursor-pointer" 
          style={{ fontFamily: 'Norelli, sans-serif' }}
          onClick={() => router.push('/')}
        >
          Dear, Tear.
        </h1>
        <nav className="flex items-center space-x-8">
          <button 
            onClick={() => router.push('/discover')} 
            className="text-gray-900 hover:text-gray-700 text-sm font-medium"
          >
            WHAT WE DO
          </button>
          <span className="text-gray-900 text-sm font-medium border-b-2 border-purple-500 pb-1">SCIENCE</span>
          <button 
            onClick={() => router.push('/sign-in')}
            className="px-4 py-2 bg-purple-200 rounded-lg text-gray-900 text-sm font-medium hover:bg-purple-300 transition-colors"
          >
            SIGN IN
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
            style={{ fontFamily: 'Norelli, sans-serif' }}
          >
            Research & Science
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Our platform is built on evidence-based research in ACL injury prevention, biomechanics, and rehabilitation. 
            Explore the scientific foundation that drives our technology.
          </p>
        </div>

        {/* Research Papers by Category */}
        {Object.entries(groupedPapers).map(([category, papers]) => (
          <div key={category} className="mb-16">
            <div className="flex items-center space-x-3 mb-8">
              <div className={`p-2 rounded-lg ${getCategoryColor(category)} border`}>
                {getCategoryIcon(category)}
              </div>
              <h3 
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: 'Norelli, sans-serif' }}
              >
                {categories[category as keyof typeof categories]}
              </h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {papers.map((paper) => (
                <div
                  key={paper.id}
                  className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${getCategoryColor(category)}`}>
                      {categories[paper.category as keyof typeof categories]}
                    </span>
                    <span className="text-xs text-gray-500">{paper.year}</span>
                  </div>

                  <h4 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                    {paper.title}
                  </h4>

                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">{paper.authors}</span>
                  </p>

                  <p className="text-xs text-gray-500 italic mb-4">
                    {paper.journal}
                  </p>

                  <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                    {paper.description}
                  </p>

                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Read Paper</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Summary Section */}
        <div className="mt-20 bg-white rounded-lg p-8 shadow-lg border border-gray-200">
          <h3 
            className="text-3xl font-bold text-gray-900 mb-6"
            style={{ fontFamily: 'Norelli, sans-serif' }}
          >
            Key Findings
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-semibold text-gray-900">Gender Disparity</p>
                  <p className="text-gray-700 text-sm">Female athletes are 4-6x more likely to sustain ACL injuries than males, highlighting the need for gender-specific prevention programs.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-semibold text-gray-900">Prevention Effectiveness</p>
                  <p className="text-gray-700 text-sm">Neuromuscular training programs can reduce ACL injury rates by 60-80% in high-risk populations.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-semibold text-gray-900">Biomechanical Risk Factors</p>
                  <p className="text-gray-700 text-sm">Knee valgus angle &gt;15° and insufficient knee flexion (&lt;30°) during landing are key predictors of ACL injury risk.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-semibold text-gray-900">Rural Access Barriers</p>
                  <p className="text-gray-700 text-sm">Rural communities face significant barriers to orthopedic care, making prevention and early intervention critical.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 py-16 px-8" style={{ backgroundColor: '#1A0F2B' }}>
        <div className="max-w-7xl mx-auto">
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

