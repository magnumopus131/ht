# Deployment Guide

This guide covers deploying the Dear, Tear platform to production.

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)
Railway can host both frontend and backend together.

**Frontend + Backend:**
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Add two services:
   - **Frontend Service**: Point to `/frontend` directory
   - **Backend Service**: Point to `/backend` directory
5. Set environment variables (see below)
6. Deploy!

### Option 2: Vercel (Frontend) + Railway/Render (Backend)
**Best for:**
- Frontend: Vercel (automatic Next.js optimization)
- Backend: Railway or Render

### Option 3: Render (Both)
**Best for:** Simple one-platform deployment

---

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory or set these in your hosting platform:

```bash
# Database (for production, use PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/dbname

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars

# CORS (set your frontend URL)
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory or set in hosting platform:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

---

## Deployment Steps

### Backend Deployment (FastAPI)

#### Railway
1. Create new service → Connect GitHub
2. Select repository → Add service
3. Set root directory to `/backend`
4. Railway auto-detects Python
5. Set environment variables
6. Deploy

#### Render
1. New → Web Service
2. Connect GitHub repository
3. Settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`
4. Set environment variables
5. Deploy

#### Fly.io
```bash
cd backend
fly launch
# Follow prompts, then:
fly deploy
```

### Frontend Deployment (Next.js)

#### Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. In `frontend/` directory: `vercel`
3. Follow prompts
4. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url.com`
5. Deploy: `vercel --prod`

#### Railway
1. Add new service → Frontend
2. Root directory: `/frontend`
3. Build command: `npm run build`
4. Start command: `npm start`
5. Set `NEXT_PUBLIC_API_URL` environment variable
6. Deploy

#### Netlify
1. Connect GitHub repository
2. Settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
3. Set environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy

---

## Database Setup

### For Production (PostgreSQL)

The app currently uses SQLite for development. For production, use PostgreSQL:

1. **Create PostgreSQL database:**
   - Railway: Add PostgreSQL service (automatic)
   - Render: Add PostgreSQL database (free tier available)
   - Fly.io: Create Postgres: `fly postgres create`

2. **Update DATABASE_URL:**
   ```bash
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   ```

3. **Run migrations:**
   The database tables will be created automatically on first run.

---

## CORS Configuration

Update `backend/main.py` line 47 to allow your frontend domain:

```python
allow_origins=[
    "https://your-frontend-domain.com",
    "http://localhost:3000"  # Keep for local testing
],
```

---

## Security Checklist

- [ ] Change `SECRET_KEY` to a strong random string (32+ characters)
- [ ] Use PostgreSQL instead of SQLite
- [ ] Update CORS origins to your frontend domain only
- [ ] Enable HTTPS (automatic on Vercel/Railway/Render)
- [ ] Set secure cookie flags if using authentication
- [ ] Review and update API rate limiting if needed

---

## Post-Deployment

1. **Test the API:**
   ```bash
   curl https://your-backend-domain.com/
   ```

2. **Test Frontend:**
   Visit your frontend URL and check browser console for API connection

3. **Monitor:**
   - Check Railway/Render/Vercel dashboards
   - Monitor logs for errors
   - Set up error tracking (Sentry, etc.)

---

## Troubleshooting

### Backend not connecting
- Check CORS settings
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend logs for errors

### Database errors
- Verify `DATABASE_URL` is correct
- Ensure database is accessible from hosting platform
- Check database connection limits

### Build failures
- Check Node.js/Python versions match requirements
- Verify all dependencies in `package.json` and `requirements.txt`
- Check build logs for specific errors

---

## Recommended Hosting Platforms

| Platform | Best For | Free Tier | Ease of Use |
|----------|----------|-----------|-------------|
| **Railway** | Both services | ✅ Limited | ⭐⭐⭐⭐⭐ |
| **Vercel** | Frontend only | ✅ Generous | ⭐⭐⭐⭐⭐ |
| **Render** | Both services | ✅ Generous | ⭐⭐⭐⭐ |
| **Fly.io** | Both services | ✅ Limited | ⭐⭐⭐ |
| **DigitalOcean** | Both services | ❌ Paid | ⭐⭐⭐ |

**Our Recommendation:** Railway for everything (simplest) or Vercel (frontend) + Railway (backend)

