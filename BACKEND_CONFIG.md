# Backend Configuration for Render.com

## Environment Variable Required

After deploying your frontend to Vercel, you'll receive a URL like:
- `https://water.vercel.app` or
- `https://water-yourusername.vercel.app`

### Update Render.com Environment Variables

1. Go to your Render.com dashboard
2. Select your backend service: `https://cold-k8i4.onrender.com`
3. Go to **Environment** tab
4. Add or update the following environment variable:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://your-vercel-url.vercel.app` |

Replace `your-vercel-url` with the actual Vercel URL you receive after deployment.

### Important Notes

- The backend is already configured to accept the `FRONTEND_URL` environment variable
- The CORS middleware will automatically allow requests from this URL
- Local development URLs (`localhost:5173`, `localhost:5174`, `localhost:5175`) are always allowed
- After adding the environment variable, Render.com will automatically redeploy your backend

### Verification

After setting the environment variable:
1. Check Render.com logs to ensure the service restarted successfully
2. Test API connectivity from your Vercel frontend
3. Check browser console for CORS errors (there should be none)

## Current CORS Configuration

The backend `main.py` includes:

```python
frontend_url = os.getenv("FRONTEND_URL", "")
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:5175"
]

if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

This means:
- ✅ Local development works out of the box
- ✅ Production frontend URL is added when `FRONTEND_URL` is set
- ✅ Credentials (cookies, auth headers) are supported
- ✅ All HTTP methods and headers are allowed
