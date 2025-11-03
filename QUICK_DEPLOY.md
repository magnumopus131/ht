# Quick Deployment Guide

**Railway is the recommended choice - simplest setup, handles everything automatically!**

## 🚀 Fastest Way: Railway (Recommended)

Railway can deploy both frontend and backend in minutes.

### Steps:

1. **Sign up at [railway.app](https://railway.app)** (free tier available)

2. **Create New Project → Deploy from GitHub**

3. **Add Backend Service:**
   - Click "+ New" → "GitHub Repo"
   - Select your repository
   - Set **Root Directory**: `backend`
   - Railway auto-detects Python
   - **Add Environment Variables:**
     ```
     DATABASE_URL=postgresql://... (Railway creates this automatically if you add PostgreSQL service)
     SECRET_KEY=<generate-a-random-32-char-string>
     ALLOWED_ORIGINS=https://your-frontend.railway.app,http://localhost:3000
     ```

4. **Add Frontend Service:**
   - Click "+ New" → "GitHub Repo"
   - Select same repository
   - Set **Root Directory**: `frontend`
   - Railway auto-detects Node.js
   - **Add Environment Variable:**
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app
     ```

5. **Add PostgreSQL Database:**
   - Click "+ New" → "Database" → "Add PostgreSQL"
   - Copy the DATABASE_URL and paste it into your backend service env vars

6. **Deploy!** Railway automatically builds and deploys.

---

## 🌐 Alternative: Vercel (Frontend) + Render (Backend)

### Frontend on Vercel:

```bash
cd frontend
npm i -g vercel
vercel
# Follow prompts
# Set environment variable: NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
vercel --prod
```

### Backend on Render:

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub
4. Settings:
   - **Root Directory**: `backend`
   - **Build**: `pip install -r requirements.txt`
   - **Start**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add PostgreSQL database
6. Set environment variables
7. Deploy!

---

## 📋 Environment Variables Checklist

### Backend:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Generate: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- `ALLOWED_ORIGINS` - Comma-separated frontend URLs

### Frontend:
- `NEXT_PUBLIC_API_URL` - Your backend URL

---

## ✅ After Deployment

1. Visit your frontend URL
2. Check browser console for API connection
3. Test the live monitoring page
4. Monitor logs on your hosting platform

---

## 🆘 Troubleshooting

**Can't connect to backend?**
- Check CORS settings in backend
- Verify `NEXT_PUBLIC_API_URL` matches your backend URL exactly
- Ensure backend service is running

**Database errors?**
- Verify DATABASE_URL is correct
- Check database is accessible from your backend service
- Ensure tables are created (they auto-create on first run)

---

See `DEPLOYMENT.md` for detailed instructions.

