# Quick Deployment Checklist

## Before Deploying

- [ ] Push all code to GitHub
- [ ] Verify all dependencies are in `requirements.txt`
- [ ] Update frontend to use environment-specific API URLs

## Deploy Backend (Render)

1. [ ] Create account at render.com
2. [ ] Click "New +" → "Web Service"  
3. [ ] Connect GitHub repository
4. [ ] Configure:
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. [ ] Add environment variables:
   - `SECRET_KEY` = (random string)
   - Optional: `DATABASE_URL` = `sqlite:///./valuation_v2.db`
6. [ ] Deploy and copy the URL (e.g., `https://xxx.onrender.com`)

## Deploy Frontend (Vercel)

1. [ ] Create account at vercel.com
2. [ ] Import project from GitHub
3. [ ] Configure:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build: `npm run build`
   - Output: `dist`
4. [ ] Add environment variable:
   - `VITE_API_URL` = (your Render backend URL)
5. [ ] Deploy

## After Deployment

1. [ ] Go back to Render
2. [ ] Add `FRONTEND_URL` = (your Vercel URL)
3. [ ] Redeploy backend
4. [ ] Test the application end-to-end

## Test Checklist

- [ ] Can sign up
- [ ] Can log in
- [ ] Can upload Excel file
- [ ] Can run manual valuation
- [ ] Can view dashboard
- [ ] Can export reports

---

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
