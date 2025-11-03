# Sign-Up and Sign-In Troubleshooting Guide

## Common Issues and Solutions

### 1. **API URL Not Set Correctly**

The frontend automatically detects the backend URL, but in production you MUST set the environment variable:

**On Render (Frontend Service):**
- Go to your frontend service → Environment tab
- Add environment variable:
  - Key: `NEXT_PUBLIC_API_URL`
  - Value: Your backend URL (e.g., `https://dear-tear-backend.onrender.com`)

### 2. **CORS Configuration**

The backend needs to allow your frontend origin:

**On Render (Backend Service):**
- Go to your backend service → Environment tab
- Find or add `ALLOWED_ORIGINS`
- Value should include your frontend URL:
  ```
  https://dear-tear-frontend.onrender.com,http://localhost:3000
  ```
- Save and redeploy

### 3. **Check Browser Console**

Open browser DevTools (F12) → Console tab:
- Look for error messages when clicking Sign Up/Sign In
- Check what API URL is being used
- Look for CORS errors (e.g., "Access to XMLHttpRequest has been blocked by CORS policy")

### 4. **Verify Backend is Running**

Check if the backend is accessible:
1. Go to `https://your-backend-url.onrender.com/docs`
2. You should see the FastAPI Swagger documentation
3. If you see an error, the backend isn't running

### 5. **Test Backend Endpoints Directly**

Test in browser console or Postman:
```javascript
// Test sign-up endpoint
fetch('https://your-backend-url.onrender.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@test.com',
    name: 'Test User',
    password: 'testpassword123',
    role: 'athlete'
  })
}).then(r => r.json()).then(console.log).catch(console.error)
```

### 6. **Database Connection Issues**

If backend logs show database errors:
- Verify `DATABASE_URL` is set correctly in backend environment
- Check if database is running (on Render dashboard)
- Verify database connection string format

### 7. **Quick Diagnostic Steps**

1. **Check API URL in browser console:**
   - Open sign-up page
   - Open DevTools → Console
   - Look for log: "API URL: ..."

2. **Test backend endpoint:**
   - Visit: `https://your-backend-url.onrender.com/docs`
   - Try the `/users` POST endpoint manually

3. **Check network tab:**
   - Open DevTools → Network tab
   - Try to sign up
   - Look for failed requests
   - Check the error status code and message

## Expected Behavior

**Sign-Up Flow:**
1. Fill form → Click "CREATE ACCOUNT"
2. Frontend sends POST to `${API_URL}/users`
3. Backend creates user → Returns user data
4. Redirects to sign-in page

**Sign-In Flow:**
1. Enter email/password → Click "SIGN IN"
2. Frontend sends POST to `${API_URL}/auth/login`
3. Backend validates → Returns JWT token + user info
4. Stores in localStorage
5. Redirects to dashboard

## Debug Information

The updated code now logs:
- API URL being used
- Full endpoint URL
- Request/response details
- Error details with status codes

Check browser console for these logs when testing sign-up/sign-in.

