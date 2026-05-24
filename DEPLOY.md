# CatGuardian AI Deployment (Vercel + Render)

## 1) Deploy Backend to Render

1. Create a new **Web Service** in Render.
2. Connect this repository.
3. Set:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (example: `gpt-4.1-mini`)
   - `OPENAI_SEARCH_MODEL` (example: `gpt-5`)
   - `AMAP_WEB_SERVICE_KEY`
   - `FRONTEND_ORIGINS` (your Vercel URL, e.g. `https://catguardian-ai.vercel.app`)
   - `FRONTEND_ORIGIN_REGEX` (default: `https://.*\.vercel\.app`)

After deploy, copy your backend URL, for example:
`https://catguardian-backend.onrender.com`

## 2) Deploy Frontend to Vercel

1. Create a new project in Vercel.
2. Set:
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variable:
   - `VITE_API_BASE_URL=https://your-render-backend.onrender.com`
4. Redeploy frontend.

## 3) Verify

1. Open backend health check:
   - `https://your-render-backend.onrender.com/`
   - Expect JSON with `"status":"ok"`.
2. Open Vercel frontend URL.
3. Test:
   - `Breed Knowledge`
   - `Risk Predict`
   - `Clinical Reasoning`

If frontend can load data without localhost errors, your friend can access the same URL directly.
