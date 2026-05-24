from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder

try:
    from xgboost import XGBClassifier
except Exception:
    XGBClassifier = None
    from sklearn.ensemble import GradientBoostingClassifier


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "veterinary_clinical_data.csv"
MODEL_PATH = ROOT / "ml" / "model.pkl"

SYMPTOM_COLS = [
    "MedicalHistory",
    "Symptom_1",
    "Symptom_2",
    "Symptom_3",
    "Symptom_4",
    "Symptom_5",
]


def assign_risk_label(text):
    text = str(text).lower()

    scores = {
        "renal_risk": 0,
        "urinary_risk": 0,
        "gastrointestinal_risk": 0,
        "endocrine_risk": 0,
        "respiratory_risk": 0,
        "pain_injury_risk": 0,
    }

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
        return "healthy"

    return max(scores, key=scores.get)


def train():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Missing dataset: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print("Original shape:", df.shape)

    cat_df = df[df["AnimalName"].fillna("").str.lower() == "cat"].copy()
    print("Cat rows:", len(cat_df))

    cat_df["all_text"] = (
        cat_df[SYMPTOM_COLS]
        .fillna("")
        .astype(str)
        .agg(" ".join, axis=1)
        .str.lower()
    )
    cat_df["target"] = cat_df["all_text"].apply(assign_risk_label)

    print("\nTarget distribution:")
    print(cat_df["target"].value_counts())

    cat_df["feature_text"] = (
        cat_df["Breed"].fillna("").astype(str) + " " +
        cat_df["MedicalHistory"].fillna("").astype(str) + " " +
        cat_df["Symptom_1"].fillna("").astype(str) + " " +
        cat_df["Symptom_2"].fillna("").astype(str) + " " +
        cat_df["Symptom_3"].fillna("").astype(str) + " " +
        cat_df["Symptom_4"].fillna("").astype(str) + " " +
        cat_df["Symptom_5"].fillna("").astype(str)
    )

    x = cat_df[["feature_text", "Age", "Weight_kg"]]
    y = cat_df["target"]

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y_encoded,
        test_size=0.2,
        random_state=42,
        stratify=y_encoded,
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("text", TfidfVectorizer(max_features=1000), "feature_text"),
            ("num", "passthrough", ["Age", "Weight_kg"]),
        ]
    )

    classifier = (
        XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            eval_metric="mlogloss",
        )
        if XGBClassifier
        else GradientBoostingClassifier(random_state=42)
    )

    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )

    model.fit(x_train, y_train)
    y_pred = model.predict(x_test)

    print("\nAccuracy:", accuracy_score(y_test, y_pred))
    print(classification_report(
        label_encoder.inverse_transform(y_test),
        label_encoder.inverse_transform(y_pred),
    ))

    joblib.dump({"model": model, "label_encoder": label_encoder}, MODEL_PATH)
    print(f"\nSaved model: {MODEL_PATH}")


if __name__ == "__main__":
    train()
