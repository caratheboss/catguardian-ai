# CatGuardian AI Deployment (Netlify + Render)

This project uses:

- **Netlify** for the React/Vite frontend
- **Render** for the FastAPI backend

## 1. Deploy Backend to Render

1. Create a new **Web Service** in Render.
2. Connect this GitHub repository.
3. Use these settings:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add backend environment variables:

```text
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_SEARCH_MODEL=gpt-4.1-mini
AMAP_WEB_SERVICE_KEY=your_amap_web_service_key
FRONTEND_ORIGINS=https://cozy-alpaca-2fd14b.netlify.app
FRONTEND_ORIGIN_REGEX=https://.*\.(vercel|netlify)\.app
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address
SMTP_APP_PASSWORD=your_gmail_app_password
SMTP_FROM_EMAIL=your_gmail_address
REMINDER_POLL_SECONDS=3600
```

Current backend URL:

```text
https://catguardian-ai.onrender.com
```

## 2. Deploy Frontend to Netlify

1. Create or open the Netlify project.
2. Connect this GitHub repository.
3. Use these build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
4. Add frontend environment variable:

```text
VITE_API_BASE_URL=https://catguardian-ai.onrender.com
```

5. Trigger a fresh deploy:
   - Netlify project
   - `Deploys`
   - `Trigger deploy`
   - `Deploy site`

Current frontend URL:

```text
https://cozy-alpaca-2fd14b.netlify.app
```

## 3. Verify Deployment

Backend health check:

```text
https://catguardian-ai.onrender.com/
```

Expected response:

```json
{
  "name": "CatGuardian AI",
  "positioning": "Feline Early Warning Intelligence",
  "status": "ok"
}
```

Frontend:

```text
https://cozy-alpaca-2fd14b.netlify.app/
```

Test these pages:

- Cat Profile
- Daily Monitoring
- Risk Predict
- Breed Knowledge
- Find Your Veterinary

If the frontend works only on the local computer but not on another computer, check that Netlify has:

```text
VITE_API_BASE_URL=https://catguardian-ai.onrender.com
```

and that Render has:

```text
FRONTEND_ORIGINS=https://cozy-alpaca-2fd14b.netlify.app
```
