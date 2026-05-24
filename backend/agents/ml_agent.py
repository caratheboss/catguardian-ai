from pathlib import Path

import joblib
import pandas as pd


RISK_LABELS = [
    "healthy",
    "renal_risk",
    "urinary_risk",
    "gastrointestinal_risk",
    "endocrine_risk",
    "respiratory_risk",
    "pain_injury_risk",
]


class MLRiskAgent:
    def __init__(self):
        self.model_path = Path(__file__).resolve().parents[2] / "ml" / "model.pkl"
        self.model = joblib.load(self.model_path) if self.model_path.exists() else None
        self.label_encoder = None
        if isinstance(self.model, dict):
            artifact = self.model
            self.model = artifact.get("model")
            self.label_encoder = artifact.get("label_encoder")

    def predict(self, payload, trends):
        features = pd.DataFrame([{
            "age": float(payload.get("age", 0)),
            "weight": float(payload.get("weight", 0)),
            "water_intake": float(payload.get("water_intake", 0)),
            "food_intake": float(payload.get("food_intake", 0)),
            "activity": float(payload.get("activity", 0)),
            "litter_frequency": float(payload.get("litter_frequency", 0)),
            "vomiting": float(payload.get("vomiting", 0)),
            "hiding_behavior": float(payload.get("hiding_behavior", 0)),
            "water_change_pct": trends.get("water_change_pct", 0),
            "activity_change_pct": trends.get("activity_change_pct", 0),
        }])

        if self.model and hasattr(self.model, "estimators_"):
            kidney, urinary, metabolic = self.model.predict_proba(features)
            return {
                "kidney_risk": round(float(kidney[0][1]), 2),
                "urinary_risk": round(float(urinary[0][1]), 2),
                "metabolic_risk": round(float(metabolic[0][1]), 2),
            }

        return {
            "kidney_risk": 0.0,
            "urinary_risk": 0.0,
            "metabolic_risk": 0.0,
        }

    def predict_clinical_condition(self, payload):
        feature_text = " ".join(
            str(payload.get(field, ""))
            for field in [
                "breed",
                "medical_history",
                "symptom_1",
                "symptom_2",
                "symptom_3",
                "symptom_4",
                "symptom_5",
            ]
        )

        features = pd.DataFrame([{
            "feature_text": feature_text,
            "Age": float(payload.get("age", 0)),
            "Weight_kg": float(payload.get("weight_kg", 0)),
        }])

        if self.model and hasattr(self.model, "predict") and hasattr(self.model, "steps"):
            raw_prediction = self.model.predict(features)[0]
            predicted_label = self._decode_label(raw_prediction)
            probabilities = self._clinical_probabilities(features)
            return {
                "predicted_label": predicted_label,
                "confidence": probabilities.get(predicted_label, 0.0),
                "probabilities": probabilities,
                "model_status": "xgboost_pipeline",
                "input_text": feature_text,
            }

        predicted_label, scores = self._rule_based_clinical_prediction(feature_text)
        total = sum(scores.values()) or 1
        probabilities = {
            label: round(scores.get(label, 0) / total, 2)
            for label in RISK_LABELS
        }
        probabilities[predicted_label] = max(probabilities.get(predicted_label, 0), 0.72 if predicted_label != "healthy" else 0.65)

        return {
            "predicted_label": predicted_label,
            "confidence": probabilities[predicted_label],
            "probabilities": probabilities,
            "model_status": "rule_fallback_train_new_model",
            "input_text": feature_text,
        }

    def _decode_label(self, label):
        if self.label_encoder is not None:
            return str(self.label_encoder.inverse_transform([int(label)])[0])
        return str(label)

    def _clinical_probabilities(self, features):
        if not hasattr(self.model, "predict_proba"):
            return {}

        classes = getattr(self.model, "classes_", [])
        proba = self.model.predict_proba(features)[0]
        return {
            self._decode_label(label): round(float(score), 2)
            for label, score in zip(classes, proba)
        }

    def _rule_based_clinical_prediction(self, text):
        text = str(text).lower()
        scores = {label: 0 for label in RISK_LABELS}

        if "kidney" in text or "renal" in text:
            scores["renal_risk"] += 6
        if "thirst" in text or "thrist" in text:
            scores["renal_risk"] += 3
            scores["endocrine_risk"] += 2
        if "wasting" in text:
            scores["renal_risk"] += 2
            scores["endocrine_risk"] += 2
        if "weight loss" in text:
            scores["renal_risk"] += 1
            scores["endocrine_risk"] += 3
            scores["gastrointestinal_risk"] += 1

        urinary_terms = [
            "urination",
            "urinate",
            "urine",
            "urinary",
            "bladder",
            "cystitis",
            "bloody urine",
            "urine infection",
            "urine retention",
            "unable to urinate",
            "attempt to urinate",
            "urination problem",
            "exessive urination",
            "excessive urination",
            "thrist and urination",
        ]
        for term in urinary_terms:
            if term in text:
                scores["urinary_risk"] += 5

        if "vomiting" in text:
            scores["gastrointestinal_risk"] += 3
        if "diarrhea" in text:
            scores["gastrointestinal_risk"] += 5
        if "loss of appetite" in text or "loss of appettite" in text:
            scores["gastrointestinal_risk"] += 4
        if "anorexia" in text:
            scores["gastrointestinal_risk"] += 4
        if "rectal bleeding" in text:
            scores["gastrointestinal_risk"] += 5
        if "increased passing gas" in text:
            scores["gastrointestinal_risk"] += 3
        if "swollen abdomen" in text or "swollen belly" in text:
            scores["gastrointestinal_risk"] += 3

        if "increased appetite" in text:
            scores["endocrine_risk"] += 5
        if "rapid heart rate" in text:
            scores["endocrine_risk"] += 3
        if "thyroid" in text:
            scores["endocrine_risk"] += 6
        if "diabetes" in text:
            scores["endocrine_risk"] += 6
        if "weight loss" in text and ("thirst" in text or "thrist" in text):
            scores["endocrine_risk"] += 3

        if "coughing" in text:
            scores["respiratory_risk"] += 4
        if "noisy breathing" in text:
            scores["respiratory_risk"] += 5
        if "difficulty breathing" in text or "diffculty breathing" in text:
            scores["respiratory_risk"] += 5
        if "outstretched neck" in text or "extension of neck" in text:
            scores["respiratory_risk"] += 5
        if "sneezing" in text:
            scores["respiratory_risk"] += 4

        if "pain" in text or "pains" in text:
            scores["pain_injury_risk"] += 3
        if "limping" in text:
            scores["pain_injury_risk"] += 5
        if "sensitive to touch" in text:
            scores["pain_injury_risk"] += 4
        if "edema" in text:
            scores["pain_injury_risk"] += 3
        if "recent surgery" in text:
            scores["pain_injury_risk"] += 4
        if "inability to jump" in text:
            scores["pain_injury_risk"] += 4
        if "change in gait" in text:
            scores["pain_injury_risk"] += 4
        if "stumbling" in text or "staggering" in text:
            scores["pain_injury_risk"] += 3

        max_score = max(scores.values())
        if max_score == 0:
            scores["healthy"] = 1
            return "healthy", scores

        return max(scores, key=scores.get), scores
