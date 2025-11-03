# Dear, Tear Project Structure

```
healthech/
├── README.md                      # Main project overview
├── QUICKSTART.md                  # Quick setup guide
├── DOCUMENTATION.md               # Comprehensive documentation
├── SOLUTION_SUMMARY.md            # Solution overview and impact
├── .gitignore                     # Git ignore rules
│
├── backend/                       # FastAPI Backend
│   ├── main.py                   # Main API server with all endpoints
│   ├── requirements.txt          # Python dependencies
│   ├── setup.sh                  # Setup script
│   ├── seed_data.py              # Sample data seeder
│   ├── README.md                 # Backend documentation
│   └── models/                   # ML model storage (created at runtime)
│
└── frontend/                      # Next.js Frontend
    ├── pages/
    │   ├── _app.tsx              # Next.js app wrapper
    │   ├── index.tsx             # Main dashboard
    │   ├── live-monitoring.tsx   # Real-time biomechanics
    │   ├── rehabilitation.tsx    # Rehab plan tracking
    │   ├── telehealth.tsx       # Telehealth interface
    │   └── create-user.tsx      # User creation form
    ├── styles/
    │   └── globals.css           # Global styles
    ├── package.json              # Node dependencies
    ├── next.config.js            # Next.js config
    ├── tailwind.config.js        # Tailwind CSS config
    ├── tsconfig.json             # TypeScript config
    ├── postcss.config.js         # PostCSS config
    └── README.md                 # Frontend documentation
```

## Key Files Explained

### Backend (`main.py`)
- **Database Models**: User, TrainingSession, BiomechanicsData, RiskAssessment, RehabilitationPlan
- **API Endpoints**: RESTful endpoints for all operations
- **WebSocket**: Real-time biomechanics streaming
- **AI Engine**: Risk assessment calculations

### Frontend Pages
- **index.tsx**: Dashboard showing risk assessment and recent sessions
- **live-monitoring.tsx**: Real-time biomechanics monitoring interface
- **rehabilitation.tsx**: View and track rehabilitation plans
- **telehealth.tsx**: Schedule and manage telehealth appointments
- **create-user.tsx**: User account creation form

## Getting Started

1. **Backend**: Follow `backend/README.md`
2. **Frontend**: Follow `frontend/README.md`
3. **Quick Start**: See `QUICKSTART.md`
4. **Full Docs**: See `DOCUMENTATION.md`

## Key Features Location

- **Risk Assessment**: `backend/main.py` → `ACLRiskAssessmentModel`
- **WebSocket**: `backend/main.py` → `/ws/biomechanics/{session_id}`
- **Live Monitoring UI**: `frontend/pages/live-monitoring.tsx`
- **Dashboard**: `frontend/pages/index.tsx`
- **Rehab Plans**: `frontend/pages/rehabilitation.tsx`
- **Telehealth**: `frontend/pages/telehealth.tsx`
