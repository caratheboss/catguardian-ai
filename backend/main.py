import os
import smtplib
import threading
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path
from typing import Dict, List

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agents.breed_agent import BreedKnowledgeAgent
from agents.breed_research_agent import BreedResearchAgent
from agents.ml_agent import MLRiskAgent
from agents.monitoring_agent import MonitoringAgent
from agents.reasoning_agent import ClinicalReasoningAgent
from agents.triage_agent import TriageAgent
from services.vet_service import VetService


class CatHealthInput(BaseModel):
    breed: str
    age: float
    weight: float
    city: str
    water_intake: float
    food_intake: float
    activity: float
    litter_frequency: float
    appetite: str
    vomiting: int
    hiding_behavior: int


class BreedKnowledgeRequest(BaseModel):
    breed: str


class ClinicalMLInput(BaseModel):
    breed: str
    age: float
    weight_kg: float
    medical_history: str
    symptom_1: str
    symptom_2: str
    symptom_3: str
    symptom_4: str
    symptom_5: str


class ClinicalVetRequest(BaseModel):
    city: str


class CareReminderRequest(BaseModel):
    owner_email: str = Field(min_length=3)
    city: str
    reminder_day: int
    cat_name: str = Field(min_length=1)


app = FastAPI(title="CatGuardian AI - Feline Early Warning Intelligence")

PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env")

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
configured_origins = os.getenv("FRONTEND_ORIGINS", "")
allow_origins = [origin.strip() for origin in configured_origins.split(",") if origin.strip()] or default_origins
allow_origin_regex = os.getenv("FRONTEND_ORIGIN_REGEX", r"https://.*\.(vercel|netlify)\.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

monitoring_agent = MonitoringAgent()
ml_agent = MLRiskAgent()
breed_agent = BreedKnowledgeAgent()
breed_research_agent = BreedResearchAgent()
triage_agent = TriageAgent()
reasoning_agent = ClinicalReasoningAgent()
vet_service = VetService()

REMINDER_STORE_PATH = Path(__file__).resolve().parent / "data" / "care_reminders.json"
REMINDER_STORE_LOCK = threading.Lock()
REMINDER_POLL_SECONDS = int(os.getenv("REMINDER_POLL_SECONDS", "3600"))
SHUTDOWN_EVENT = threading.Event()
REMINDER_WORKER: threading.Thread | None = None


def _smtp_enabled() -> bool:
    return bool(os.getenv("SMTP_USER") and os.getenv("SMTP_APP_PASSWORD"))


def _smtp_settings() -> Dict[str, str]:
    return {
        "host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "port": os.getenv("SMTP_PORT", "587"),
        "user": os.getenv("SMTP_USER", ""),
        "password": os.getenv("SMTP_APP_PASSWORD", ""),
        "from_email": os.getenv("SMTP_FROM_EMAIL", os.getenv("SMTP_USER", "")),
    }


def _load_reminders() -> List[Dict]:
    if not REMINDER_STORE_PATH.exists():
        return []
    try:
        import json

        with REMINDER_STORE_PATH.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        if isinstance(data, list):
            return data
    except Exception:
        return []
    return []


def _save_reminders(reminders: List[Dict]) -> None:
    import json

    REMINDER_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with REMINDER_STORE_PATH.open("w", encoding="utf-8") as handle:
        json.dump(reminders, handle, indent=2, ensure_ascii=False)


def _normalize_day(day: int) -> int:
    return max(1, min(28, day))


def _compose_reminder_email(cat_name: str, city: str, reminder_day: int) -> EmailMessage:
    settings = _smtp_settings()
    subject = f"CatGuardian Monthly Reminder for {cat_name}"
    body = (
        f"Hello,\n\n"
        f"This is your CatGuardian monthly reminder for {cat_name}.\n\n"
        f"- Review pet insurance billings\n"
        f"- Review this month's appointments and follow-up plans\n"
        f"- Check local veterinary contacts in {city}\n\n"
        f"Scheduled day of month: {reminder_day}\n\n"
        f"Best,\nCatGuardian AI"
    )
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings["from_email"]
    message.set_content(body)
    return message


def _send_email(to_email: str, message: EmailMessage) -> None:
    settings = _smtp_settings()
    message["To"] = to_email
    with smtplib.SMTP(settings["host"], int(settings["port"]), timeout=30) as smtp:
        smtp.starttls()
        smtp.login(settings["user"], settings["password"])
        smtp.send_message(message)


def _should_send_today(reminder: Dict, now: datetime) -> bool:
    scheduled_day = _normalize_day(int(reminder.get("reminder_day", 1)))
    if now.day != scheduled_day:
        return False
    last_sent_month = reminder.get("last_sent_month")
    current_month = now.strftime("%Y-%m")
    return last_sent_month != current_month


def _run_reminder_worker() -> None:
    while not SHUTDOWN_EVENT.is_set():
        now = datetime.now()
        if _smtp_enabled():
            with REMINDER_STORE_LOCK:
                reminders = _load_reminders()
                changed = False
                for reminder in reminders:
                    if not _should_send_today(reminder, now):
                        continue
                    try:
                        message = _compose_reminder_email(
                            cat_name=reminder.get("cat_name", "your cat"),
                            city=reminder.get("city", "your city"),
                            reminder_day=int(reminder.get("reminder_day", 1)),
                        )
                        _send_email(reminder["owner_email"], message)
                        reminder["last_sent_month"] = now.strftime("%Y-%m")
                        reminder["last_sent_at"] = now.isoformat()
                        changed = True
                    except Exception as exc:
                        reminder["last_error"] = str(exc)
                        changed = True
                if changed:
                    _save_reminders(reminders)
        SHUTDOWN_EVENT.wait(REMINDER_POLL_SECONDS)


@app.on_event("startup")
def startup_event():
    global REMINDER_WORKER
    SHUTDOWN_EVENT.clear()
    REMINDER_WORKER = threading.Thread(target=_run_reminder_worker, daemon=True)
    REMINDER_WORKER.start()


@app.on_event("shutdown")
def shutdown_event():
    SHUTDOWN_EVENT.set()


@app.get("/")
def root():
    return {"name": "CatGuardian AI", "positioning": "Feline Early Warning Intelligence", "status": "ok"}


@app.post("/breed-knowledge")
def breed_knowledge(payload: BreedKnowledgeRequest):
    return breed_research_agent.research(payload.breed)


@app.post("/ml-predict")
def ml_predict(payload: ClinicalMLInput):
    return ml_agent.predict_clinical_condition(payload.model_dump())


@app.post("/clinical-vets")
def clinical_vets(payload: ClinicalVetRequest):
    return vet_service.ranked_vets(payload.city, limit=5)


@app.post("/care-reminder")
def care_reminder(payload: CareReminderRequest):
    reminder_day = _normalize_day(payload.reminder_day)
    current_month = datetime.now().strftime("%Y-%m")
    reminder_entry = {
        "owner_email": payload.owner_email.strip(),
        "city": payload.city,
        "cat_name": payload.cat_name.strip(),
        "reminder_day": reminder_day,
        "updated_at": datetime.now().isoformat(),
    }

    with REMINDER_STORE_LOCK:
        reminders = _load_reminders()
        existing_index = next((index for index, item in enumerate(reminders) if item.get("owner_email") == reminder_entry["owner_email"]), None)
        if existing_index is None:
            reminders.append(reminder_entry)
        else:
            keep_last_sent = reminders[existing_index].get("last_sent_month")
            keep_last_sent_at = reminders[existing_index].get("last_sent_at")
            reminders[existing_index] = reminder_entry
            if keep_last_sent:
                reminders[existing_index]["last_sent_month"] = keep_last_sent
            if keep_last_sent_at:
                reminders[existing_index]["last_sent_at"] = keep_last_sent_at
        _save_reminders(reminders)

    smtp_live = _smtp_enabled()
    if smtp_live and datetime.now().day == reminder_day:
        try:
            message = _compose_reminder_email(payload.cat_name, payload.city, reminder_day)
            _send_email(payload.owner_email, message)
            with REMINDER_STORE_LOCK:
                reminders = _load_reminders()
                for reminder in reminders:
                    if reminder.get("owner_email") == payload.owner_email.strip():
                        reminder["last_sent_month"] = current_month
                        reminder["last_sent_at"] = datetime.now().isoformat()
                        reminder.pop("last_error", None)
                _save_reminders(reminders)
        except Exception as exc:
            return {
                "agent": "CareReminderAgent",
                "status": "scheduled_with_send_error",
                "owner_email": payload.owner_email,
                "message": (
                    f"Reminder saved for day {reminder_day}, but instant send failed: {exc}. "
                    f"Scheduler will retry on day {reminder_day}."
                ),
            }

    return {
        "agent": "CareReminderAgent",
        "status": "scheduled_live" if smtp_live else "scheduled_without_mailer",
        "owner_email": payload.owner_email,
        "message": (
            f"Monthly reminder scheduled for day {reminder_day}. "
            f"It will send to {payload.owner_email} for {payload.cat_name.strip()} in {payload.city} "
            f"to review pet insurance billings and monthly appointments."
        ),
        "delivery_note": (
            "Gmail SMTP is active." if smtp_live
            else "Set SMTP_USER and SMTP_APP_PASSWORD (Gmail app password) to enable real sending."
        ),
    }


@app.post("/analyze")
def analyze(payload: CatHealthInput):
    data = payload.model_dump()
    trends = monitoring_agent.analyze(data)
    risks = ml_agent.predict(data, trends)
    breed_context = breed_agent.lookup(data["breed"])
    triage = triage_agent.recommend(risks, data)
    explanation = reasoning_agent.explain(data, trends, risks, breed_context, triage)
    vets = vet_service.nearby(data["city"])

    return {
        "ml_risk_score": risks,
        "ai_explanation": explanation,
        "triage_recommendation": triage,
        "nearby_vets": vets,
        "agent_pipeline": [
            {"agent": "MonitoringAgent", "output": trends},
            {"agent": "MLRiskAgent", "output": risks},
            {"agent": "BreedKnowledgeAgent", "output": breed_context},
            {"agent": "ClinicalReasoningAgent", "output": explanation},
            {"agent": "TriageAgent", "output": triage},
        ],
    }
