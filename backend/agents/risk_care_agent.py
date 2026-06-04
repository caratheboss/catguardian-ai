import json
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI


RISK_GUIDES = {
    "healthy": {
        "title": "No strong risk signal detected",
        "summary": (
            "Continue observing your cat's normal appetite, water intake, litter habits, "
            "activity, and weight. Contact a veterinarian if a new or persistent change appears."
        ),
        "resources": [
            {
                "title": "Cornell Feline Health Center",
                "source": "Cornell University College of Veterinary Medicine",
                "url": "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center",
            }
        ],
    },
    "renal_risk": {
        "title": "Kidney and hydration care context",
        "summary": (
            "Changes in thirst, urination, appetite, weight, or vomiting can be useful reasons "
            "to arrange a veterinary assessment. Keep fresh water available and record changes; "
            "do not start medication or a therapeutic diet without veterinary guidance."
        ),
        "resources": [
            {
                "title": "Chronic Kidney Disease",
                "source": "Cornell Feline Health Center",
                "url": "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/chronic-kidney-disease",
            }
        ],
    },
    "urinary_risk": {
        "title": "Urinary health care context",
        "summary": (
            "Track litter-box visits, urine amount, straining, discomfort, and blood. A cat that "
            "cannot pass urine needs emergency veterinary care; do not attempt home treatment."
        ),
        "resources": [
            {
                "title": "Feline Lower Urinary Tract Disease",
                "source": "Cornell Feline Health Center",
                "url": "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feline-lower-urinary-tract-disease",
            }
        ],
    },
    "gastrointestinal_risk": {
        "title": "Digestive health care context",
        "summary": (
            "Record vomiting, diarrhea, appetite, water intake, and stool changes. Persistent "
            "vomiting, inability to keep water down, marked weakness, or blood requires prompt "
            "veterinary advice."
        ),
        "resources": [
            {
                "title": "Digestive Disorders of Cats",
                "source": "Merck Veterinary Manual",
                "url": "https://www.merckvetmanual.com/cat-owners/digestive-disorders-of-cats",
            }
        ],
    },
    "endocrine_risk": {
        "title": "Metabolic and endocrine care context",
        "summary": (
            "Changes involving thirst, urination, appetite, weight, or energy usually require "
            "veterinary examination and laboratory testing. Keep a daily log and avoid changing "
            "medication or diet without professional guidance."
        ),
        "resources": [
            {
                "title": "Endocrine System Disorders of Cats",
                "source": "Merck Veterinary Manual",
                "url": "https://www.merckvetmanual.com/cat-owners/hormonal-disorders-of-cats",
            }
        ],
    },
    "respiratory_risk": {
        "title": "Breathing and respiratory care context",
        "summary": (
            "Observe breathing effort, rate, sounds, coughing, and activity tolerance while "
            "keeping the cat calm. Open-mouth breathing or clear breathing difficulty is an "
            "emergency and needs immediate veterinary care."
        ),
        "resources": [
            {
                "title": "Respiratory Disorders of Cats",
                "source": "Merck Veterinary Manual",
                "url": "https://www.merckvetmanual.com/cat-owners/lung-and-airway-disorders-of-cats",
            }
        ],
    },
    "pain_injury_risk": {
        "title": "Pain and mobility care context",
        "summary": (
            "Limit stressful activity and record limping, posture, jumping ability, and sensitivity "
            "to touch. Never give human pain medicine to a cat; seek veterinary advice for pain, "
            "injury, or sudden mobility changes."
        ),
        "resources": [
            {
                "title": "Recognising and Assessing Feline Pain",
                "source": "International Cat Care",
                "url": "https://icatcare.org/advice/recognising-and-assessing-feline-pain/",
            }
        ],
    },
}


class RiskCareGuideAgent:
    def __init__(self):
        env_path = Path(__file__).resolve().parents[2] / ".env"
        load_dotenv(env_path)
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key, timeout=60.0, max_retries=1) if api_key else None
        self.cache = {}

    def guide(self, payload):
        risk_label = str(payload.get("risk_label") or "healthy")
        cache_key = (risk_label, str(payload.get("breed") or ""))
        if cache_key in self.cache:
            return self.cache[cache_key]

        fallback = self._fallback(risk_label)
        if risk_label == "healthy":
            return fallback
        if not self.client:
            fallback["debug_error"] = "OPENAI_API_KEY is missing."
            return fallback

        try:
            response = self.client.responses.create(
                model=os.getenv("OPENAI_SEARCH_MODEL", "gpt-4.1-mini"),
                tools=[{"type": "web_search"}],
                tool_choice="auto",
                include=["web_search_call.action.sources"],
                max_output_tokens=450,
                input=[
                    {
                        "role": "system",
                        "content": (
                            "You are RiskCareGuideAgent for a feline wellness monitoring system. "
                            "The supplied risk category is an ML signal, not a diagnosis. Use web "
                            "search to find two credible veterinary or university resources. Return "
                            "only JSON with title, summary, urgent_signs, and resources. Summary must "
                            "be one short paragraph describing safe monitoring, typical veterinary "
                            "evaluation, and supportive care context. Do not prescribe medication, "
                            "give doses, diagnose, or advise delaying veterinary care. Resources must "
                            "contain title, source, and real url."
                        ),
                    },
                    {
                        "role": "user",
                        "content": json.dumps(
                            {
                                "risk_label": risk_label,
                                "breed": payload.get("breed"),
                                "medical_history": payload.get("medical_history"),
                                "symptoms": payload.get("symptoms", []),
                                "task": "Create a brief source-grounded feline care guide for this top ML risk signal.",
                            }
                        ),
                    },
                ],
            )
            parsed = self._extract_json(response.output_text)
            validated = self._validate(parsed, risk_label)
            if validated:
                self.cache[cache_key] = validated
                return validated
            fallback["debug_error"] = (
                "OpenAI web search returned an incomplete response that did not pass "
                "the required title, summary, HTTPS resource, and JSON checks."
            )
        except Exception as exc:
            fallback["debug_error"] = str(exc)

        return fallback

    def _validate(self, parsed, risk_label):
        if not isinstance(parsed, dict):
            return None

        title = str(parsed.get("title", "")).strip()
        summary = str(parsed.get("summary", "")).strip()
        urgent_signs = str(parsed.get("urgent_signs", "")).strip()
        resources = []
        for resource in parsed.get("resources", [])[:2]:
            if not isinstance(resource, dict):
                continue
            resource_title = str(resource.get("title", "")).strip()
            source = str(resource.get("source", "")).strip()
            url = str(resource.get("url", "")).strip()
            if resource_title and source and url.startswith("https://"):
                resources.append({"title": resource_title, "source": source, "url": url})

        if not title or not summary or not resources:
            return None

        return {
            "agent": "RiskCareGuideAgent",
            "mode": "OpenAI web search",
            "risk_label": risk_label,
            "title": title,
            "summary": summary,
            "urgent_signs": urgent_signs,
            "resources": resources,
            "safety_note": "Wellness information only. This is not a diagnosis or prescription.",
        }

    def _fallback(self, risk_label):
        guide = RISK_GUIDES.get(risk_label, RISK_GUIDES["healthy"])
        return {
            "agent": "RiskCareGuideAgent",
            "mode": "curated fallback",
            "risk_label": risk_label,
            "title": guide["title"],
            "summary": guide["summary"],
            "urgent_signs": "Seek urgent veterinary care for severe, sudden, or worsening signs.",
            "resources": guide["resources"],
            "safety_note": "Wellness information only. This is not a diagnosis or prescription.",
        }

    def _extract_json(self, text):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        return None
