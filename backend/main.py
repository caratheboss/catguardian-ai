import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
    owner_email: str
    city: str
    reminder_day: int
    cat_name: str = "your cat"


app = FastAPI(title="CatGuardian AI - Feline Early Warning Intelligence")

load_dotenv()

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
configured_origins = os.getenv("FRONTEND_ORIGINS", "")
allow_origins = [origin.strip() for origin in configured_origins.split(",") if origin.strip()] or default_origins
allow_origin_regex = os.getenv("FRONTEND_ORIGIN_REGEX", r"https://.*\.vercel\.app")

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
    return {
        "agent": "CareReminderAgent",
        "status": "scheduled_demo",
        "owner_email": payload.owner_email,
        "message": (
            f"Monthly care planning reminder scheduled for day {payload.reminder_day}. "
            f"It will remind the owner to review pet insurance billings and monthly appointments for {payload.cat_name}."
        ),
        "delivery_note": "Connect RESEND_API_KEY or SENDGRID_API_KEY to send real monthly emails.",
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
