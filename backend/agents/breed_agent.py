from pathlib import Path

import pandas as pd


class BreedKnowledgeAgent:
    def __init__(self):
        self.data_path = Path(__file__).resolve().parents[2] / "data" / "breed_risks.csv"

    def lookup(self, breed):
        if not self.data_path.exists():
            return {"known_risks": []}

        rows = pd.read_csv(self.data_path)
        match = rows[rows["breed"].str.lower() == str(breed).lower()]
        if match.empty:
            return {"known_risks": []}

        risks = match.iloc[0]["common_risks"]
        return {"known_risks": [risk.strip() for risk in str(risks).split("|")]}
