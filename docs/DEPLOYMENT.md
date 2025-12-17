# Deployment Guide - Valuation Application

This guide will help you deploy your valuation application for client demos.

## Architecture

- **Frontend**: React/Vite → Deployed on **Vercel**
- **Backend**: FastAPI (Python) → Deployed on **Render** (recommended for free tier)
- **Database**: SQLite (file-based, included in backend deployment)

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Backend Files

The backend is already configured with `requirements.txt`. We'll add a start command.

### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended for easy deployment)

### Step 3: Deploy Backend

1. **Connect Repository:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `water` repository

2. **Configure Service:**
   - **Name**: `valuation-backend` (or any name you prefer)
   - **Region**: Choose closest to your clients
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables:**
   - Add: `SECRET_KEY` = `your-secret-key-here` (generate a random string)
   - Add: `DATABASE_URL` = `sqlite:///./valuation_v2.db` (or leave default)

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (3-5 minutes)
   - Note your backend URL: `https://valuation-backend-xxxx.onrender.com`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Update Frontend API URL

You'll need to create an environment variable for the production backend URL.

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### Step 3: Deploy Frontend

1. **Import Project:**
   - Click "Add New" → "Project"
   - Import your `water` repository

2. **Configure Project:**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables:**
   - Add: `VITE_API_URL` = `https://valuation-backend-xxxx.onrender.com` (your Render backend URL)

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment (2-3 minutes)
   - Your app will be live at: `https://your-app.vercel.app`

---

## Part 3: Configure CORS

After deploying, you need to update the backend to allow requests from your Vercel frontend.

1. Go to your Render dashboard
2. Find your backend service
3. Add environment variable:
   - **Name**: `FRONTEND_URL`
   - **Value**: `https://your-app.vercel.app`
4. Redeploy the service

---

## Part 4: Test Deployment

1. Open your Vercel URL
2. Sign up for a new account
3. Upload a test Excel file or use manual entry
4. Run a valuation
5. Verify all features work

---

## Troubleshooting

### Backend Issues

- **Database not persisting:** Render's free tier may reset the database. Consider upgrading or using an external database.
- **Timeout errors:** Free tier has cold starts (10-15 seconds). First request may be slow.

### Frontend Issues

- **API connection errors:** Check CORS settings in backend
- **Environment variables not working:** Redeploy frontend after adding env vars

### CORS Errors

Make sure your backend's `main.py` has:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Alternative: Deploy Both to Railway

If you prefer a single platform:

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Deploy both frontend and backend as separate services
4. Configure environment variables as above

---

## Cost

- **Vercel**: Free for personal projects
- **Render**: Free tier with limitations (750 hours/month, sleeps after 15 min inactivity)
- **Upgrade**: ~$7-15/month for always-on backend

---

## Next Steps

- Set up custom domain for professional look
- Configure proper database (PostgreSQL on Render)
- Add monitoring and error tracking
- Set up CI/CD for automatic deployments
