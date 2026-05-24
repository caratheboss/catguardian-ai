import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI


class ClinicalReasoningAgent:
    def __init__(self):
        env_path = Path(__file__).resolve().parents[2] / ".env"
        load_dotenv(env_path)
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def explain(self, payload, trends, risks, breed_context, triage):
        if not self.client:
            return (
                "Wellness monitoring summary: the risk score reflects the provided "
                "intake, activity, litter, appetite, vomiting, hiding, and breed-risk "
                "signals. This is not a diagnosis. Follow the triage recommendation "
                "and contact a veterinarian if signs worsen."
            )

        prompt = {
            "cat_input": payload,
            "trend_analysis": trends,
            "ml_risks": risks,
            "breed_context": breed_context,
            "triage": triage,
        }

        response = self.client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
            input=[
                {
                    "role": "system",
                    "content": (
                        "You explain feline wellness monitoring outputs. This is "
                        "wellness monitoring, not diagnosis. Use only provided "
                        "structured data. Do not invent medical claims. Recommend "
                        "veterinary care according to the provided triage only."
                    ),
                },
                {"role": "user", "content": str(prompt)},
            ],
        )
        return response.output_text
