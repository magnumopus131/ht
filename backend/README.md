# Backend README

## Dear, Tear Backend API

FastAPI-based backend for ACL injury prevention and recovery platform.

## Features

- RESTful API endpoints
- WebSocket support for real-time biomechanics streaming
- AI-powered risk assessment
- User and session management
- Rehabilitation plan tracking
- SQLite database (development) / PostgreSQL (production)

## Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI): `http://localhost:8000/docs`

## Endpoints

### Users
- `POST /users` - Create a new user
- `GET /users/{user_id}` - Get user details

### Training Sessions
- `POST /sessions` - Create a training session
- `POST /sessions/{session_id}/biomechanics` - Add biomechanics data
- `GET /athletes/{athlete_id}/sessions` - Get athlete sessions

### Risk Assessment
- `GET /athletes/{athlete_id}/risk-assessment` - Get AI risk assessment

### Rehabilitation
- `POST /rehabilitation-plans` - Create rehabilitation plan
- `GET /rehabilitation-plans/{athlete_id}` - Get athlete's plans

### WebSocket
- `WS /ws/biomechanics/{session_id}` - Real-time biomechanics streaming

## Seeding Sample Data

```bash
python seed_data.py
```

This creates sample athletes, coaches, providers, and training sessions with biomechanics data for testing.

## Database Schema

See `main.py` for complete database models:
- Users (athletes, coaches, trainers, providers)
- Training Sessions
- Biomechanics Data
- Risk Assessments
- Rehabilitation Plans
- Injury History

## Environment Variables

Create a `.env` file:
```
DATABASE_URL=sqlite:///./aclguard.db
SECRET_KEY=your-secret-key-here
```

## Production Deployment

1. Replace SQLite with PostgreSQL
2. Add authentication (JWT tokens)
3. Configure CORS properly
4. Add HTTPS/WSS
5. Implement rate limiting
6. Add logging and monitoring
7. Ensure HIPAA compliance if handling PHI
