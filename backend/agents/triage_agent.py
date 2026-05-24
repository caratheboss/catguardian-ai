class TriageAgent:
    def recommend(self, risks, payload):
        max_risk = max(risks.values()) if risks else 0
        vomiting = int(payload.get("vomiting", 0))
        hiding = int(payload.get("hiding_behavior", 0))
        appetite = str(payload.get("appetite", "normal")).lower()

        if max_risk >= 0.85 or (vomiting >= 3 and hiding):
            return "Emergency"
        if max_risk >= 0.7 or vomiting >= 2:
            return "Vet within 24h"
        if max_risk >= 0.45 or hiding or appetite == "low":
            return "Vet within 72h"
        return "Monitor"
