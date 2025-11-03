# Railway Deployment - Step by Step

Railway is the easiest option - it handles both frontend and backend automatically.

## 🚀 Deployment Steps

### 1. Create Railway Account
- Go to https://railway.app
- Sign up with GitHub (recommended)

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Authorize Railway to access your repositories
- Select your `healthech` repository

### 3. Add PostgreSQL Database
- In your Railway project, click "+ New"
- Select "Database" → "Add PostgreSQL"
- Railway creates the database automatically
- **Copy the DATABASE_URL** (you'll need it for the backend service)

### 4. Add Backend Service
- Click "+ New" → "GitHub Repo"
- Select your `healthech` repository again
- Railway will create a new service
- **In the service settings:**
  - **Root Directory**: Set to `backend`
  - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  
- **Add Environment Variables:**
  ```
  DATABASE_URL=<paste-the-postgres-url-from-step-3>
  SECRET_KEY=<generate-a-secret-key-see-below>
  ALLOWED_ORIGINS=https://your-frontend.railway.app,http://localhost:3000
  ```
  
  To generate SECRET_KEY, run:
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

### 5. Add Frontend Service
- Click "+ New" → "GitHub Repo"  
- Select your `healthech` repository
- **In the service settings:**
  - **Root Directory**: Set to `frontend`
  - Railway auto-detects it's Next.js
  
- **Add Environment Variable:**
  ```
  NEXT_PUBLIC_API_URL=https://your-backend-service-name.railway.app
  ```
  (Replace with your actual backend service URL - Railway shows it in the service settings)

### 6. Deploy!
- Railway automatically builds and deploys when you push to GitHub
- Or click "Deploy" in the Railway dashboard
- Wait for both services to build (takes 2-5 minutes)

### 7. Get Your URLs
- Frontend: Click on frontend service → Settings → Generate Domain
- Backend: Click on backend service → Settings → Generate Domain
- Update `NEXT_PUBLIC_API_URL` in frontend service with your backend URL
- Update `ALLOWED_ORIGINS` in backend service with your frontend URL

## ✅ Testing

1. Visit your frontend URL
2. Open browser console (F12)
3. Check that API calls are working
4. Test the live monitoring page

## 🔒 Security Notes

After deployment:
- Update `ALLOWED_ORIGINS` to only allow your frontend domain (remove localhost in production)
- Ensure `SECRET_KEY` is a strong random string
- Railway provides HTTPS automatically

## 📊 Monitoring

- Check Railway dashboard for logs
- Monitor build status
- Check service health

---

That's it! Your app is now live on the internet! 🎉

