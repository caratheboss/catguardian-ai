# CatGuardian AI

CatGuardian AI is a feline early-warning intelligence system for hidden cat health risks. The goal is to help owners notice subtle deterioration earlier by combining cat profile context, daily health tracking, structured ML risk prediction, trusted breed knowledge, and city-based veterinary recommendations.

This is a hackathon MVP. It is wellness monitoring support, not diagnosis, and it does not replace veterinary care.

## Live App

- Frontend: https://cozy-alpaca-2fd14b.netlify.app
- Backend: https://catguardian-ai.onrender.com

## Product Flow

1. **Cat Profile**
   - Stores cat name, breed, sex, reproductive status, age, and weight.
   - Saved profile data is reused across the app with browser local storage.

2. **Daily Monitoring**
   - Tracks water, food, activity, litter frequency, and weight.
   - Shows 7-day and 30-day trend charts.
   - Automatically displays saved cat profile context such as name, age, breed, and weight.

3. **Risk Predict**
   - Uses a Python ML pipeline with TF-IDF text features and an XGBoost-style risk classifier.
   - Predicts structured disease-signal categories such as renal, urinary, gastrointestinal, endocrine, respiratory, and pain/injury risk.

4. **Breed Knowledge Base**
   - Uses OpenAI web search when available.
   - Selects useful breed resources and displays source titles and trusted URLs.
   - Falls back to curated source cards when web search times out.

5. **Find Your Veterinary**
   - Uses Amap Web Service API to search veterinary clinic POIs in the selected city.
   - Ranks clinics by Amap rating when available.
   - Supports Shanghai, Shenzhen, Beijing, and Guangzhou.

6. **Care Reminder Email**
   - Schedules monthly reminder emails for pet insurance billing checks and monthly appointments.
   - Uses Resend email API when configured, with Gmail SMTP kept as a local fallback.

## Multi-Agent Architecture

The system is organized as multiple focused agents instead of a single chatbot wrapper:

- **MonitoringAgent**: deterministic trend and baseline-style signal analysis.
- **MLRiskAgent**: structured ML risk prediction.
- **BreedKnowledgeAgent / BreedResearchAgent**: breed risk lookup and trusted breed resource retrieval.
- **VetFindAgent**: Amap clinic POI search and rating-based ranking.
- **CareReminderAgent**: monthly care reminder scheduling and email delivery.
- **ClinicalReasoningAgent**: OpenAI-based explanation support for structured agent outputs.

This architecture keeps factual lookup, ML prediction, rule-based logic, and LLM reasoning separated.

## Tech Stack

### Frontend

- React
- Vite
- TailwindCSS
- Recharts
- Netlify deployment

### Backend

- FastAPI
- Uvicorn
- Python
- pandas / NumPy
- scikit-learn
- xgboost
- joblib
- OpenAI SDK
- python-dotenv
- Render deployment

### External Services

- OpenAI API for breed resource search and reasoning support
- Amap Web Service API for veterinary clinic POI search
- Resend email API for monthly reminder emails
- Optional Gmail SMTP fallback for local testing

## Local Development

### Backend

```bash
cd backend
../venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend health check:

```bash
curl http://127.0.0.1:8000/
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Local frontend:

```text
http://localhost:5173
```

## Environment Variables

### Frontend on Netlify

```text
VITE_API_BASE_URL=https://catguardian-ai.onrender.com
```

### Backend on Render

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

Do not commit real API keys or passwords.

## Project Structure

```text
catguardian-ai/
├── backend/
│   ├── agents/
│   ├── services/
│   ├── main.py
│   └── requirements.txt
├── data/
├── frontend/
│   ├── public/
│   └── src/
├── ml/
│   ├── train.py
│   └── model.pkl
├── DEPLOY.md
├── netlify.toml
└── README.md
```

## Safety Note

CatGuardian AI does not diagnose disease or prescribe medication. It highlights monitoring signals and suggests when owners should seek veterinary help.
