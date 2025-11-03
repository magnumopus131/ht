# Frontend README

## Dear, Tear Frontend

Next.js-based frontend application for ACL injury prevention and recovery platform.

## Features

- Dashboard with risk assessment visualization
- Live biomechanics monitoring interface
- Rehabilitation plan tracking
- Telehealth scheduling
- User management interface
- Responsive design with Tailwind CSS

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Pages

- `/` - Main dashboard with risk assessment
- `/live-monitoring` - Real-time biomechanics monitoring
- `/rehabilitation` - Rehabilitation plan tracking
- `/telehealth` - Telehealth scheduling and consultations
- `/create-user` - User account creation form

## Environment Variables

Create a `.env.local` file:
```
API_URL=http://localhost:8000
```

## Build for Production

```bash
npm run build
npm start
```

## Technology Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Axios for API calls
- WebSocket API for real-time data
- Recharts for data visualization (ready for integration)

## Development Notes

- The live monitoring page simulates wearable device data
- In production, WebSocket connections would come from actual wearable devices
- Telehealth video calls would use WebRTC (not implemented in demo)
- Authentication should be added for production use
