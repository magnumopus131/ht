# Quick Start Guide

## Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

## Backend Setup

```bash
cd backend
chmod +x setup.sh
./setup.sh
source venv/bin/activate
python main.py
```

Backend runs on: http://localhost:8000

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:3000

## Quick Test

1. Create a user: Visit http://localhost:3000/create-user
2. View dashboard: Visit http://localhost:3000
3. Live monitoring: Visit http://localhost:3000/live-monitoring
4. API docs: Visit http://localhost:8000/docs

## Example Workflow

1. Create athlete profile via `/create-user` page
2. Start a training session (backend API)
3. Connect wearable device (simulated via live-monitoring page)
4. View real-time risk assessment
5. Review personalized recommendations
6. Schedule telehealth consultation if needed
7. Follow rehabilitation plan

See DOCUMENTATION.md for detailed information.
