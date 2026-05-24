class MonitoringAgent:
    def analyze(self, payload):
        water_current = float(payload.get("water_intake", 0))
        food_current = float(payload.get("food_intake", 0))
        activity_current = float(payload.get("activity", 0))
        litter_current = float(payload.get("litter_frequency", 0))

        baselines = {
            "water": 180,
            "food": 65,
            "activity": 55,
            "litter": 3,
        }

        def pct_change(current, baseline):
            if baseline == 0:
                return 0
            return round(((current - baseline) / baseline) * 100, 1)

        return {
            "water_change_pct": pct_change(water_current, baselines["water"]),
            "food_change_pct": pct_change(food_current, baselines["food"]),
            "activity_change_pct": pct_change(activity_current, baselines["activity"]),
            "litter_change_pct": pct_change(litter_current, baselines["litter"]),
        }
