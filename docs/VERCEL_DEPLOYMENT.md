# Vercel Deployment Guide

## Prerequisites
- GitHub repository: https://github.com/vlaution/water
- Backend deployed at: https://cold-k8i4.onrender.com

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with your GitHub account
2. Click **"Add New Project"**
3. Import your repository: `vlaution/water`
4. Select the **`frontend`** folder as the root directory

### 2. Configure Project Settings

**Framework Preset**: Vite
**Root Directory**: `frontend`
**Build Command**: `npm run build` (auto-detected)
**Output Directory**: `dist` (auto-detected)

### 3. Set Environment Variables

In the Vercel project settings, add the following environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://cold-k8i4.onrender.com` |

**Important**: Make sure to add this environment variable BEFORE deploying!

### 4. Deploy

Click **"Deploy"** and Vercel will:
- Install dependencies
- Run TypeScript compilation
- Build the Vite project
- Deploy to production

### 5. Configure Custom Domain (Optional)

After deployment:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel

## Post-Deployment Checklist

- [ ] Verify the frontend loads correctly
- [ ] Test authentication (login/signup)
- [ ] Test API connectivity to backend
- [ ] Verify file upload functionality
- [ ] Test all dashboard components
- [ ] Check browser console for errors
- [ ] Test on mobile devices

## Backend CORS Configuration

Ensure your Render.com backend (`https://cold-k8i4.onrender.com`) has CORS configured to allow requests from your Vercel domain.

Add your Vercel URL (e.g., `https://water.vercel.app` or `https://water-yourusername.vercel.app`) to the CORS allowed origins in your backend `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "https://water.vercel.app",  # Your Vercel domain
        "https://water-yourusername.vercel.app",  # Alternative Vercel domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Troubleshooting

### Build Fails
- Check TypeScript errors in the build log
- Ensure all dependencies are in `package.json`
- Verify `tsconfig.json` is correct

### API Requests Fail
- Verify `VITE_API_URL` environment variable is set
- Check CORS configuration on backend
- Inspect Network tab in browser DevTools

### 404 on Refresh
- The `vercel.json` rewrites configuration handles this
- Verify `vercel.json` is in the `frontend` folder

## Continuous Deployment

Vercel automatically redeploys when you push to the `main` branch on GitHub. To deploy:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Useful Commands

```bash
# Test build locally before deploying
cd frontend
npm run build
npm run preview

# Check for TypeScript errors
npm run build
```

## Environment Variables Reference

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_API_URL` | `http://localhost:8000` | `https://cold-k8i4.onrender.com` |

The `.env.production` file in the frontend folder contains the production configuration, but it's recommended to set environment variables directly in Vercel Dashboard for security.

## Support

- Vercel Docs: https://vercel.com/docs
- React Router: https://reactrouter.com
- Vite: https://vitejs.dev
