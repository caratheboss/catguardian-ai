from pathlib import Path
import math
import os
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError
import json
import ssl

import pandas as pd
from dotenv import load_dotenv


AMAP_CITY_CODES = {
    "北京": "010",
    "上海": "021",
    "广州": "020",
    "深圳": "0755",
}


class VetService:
    def __init__(self):
        self.data_path = Path(__file__).resolve().parents[2] / "data" / "vets.csv"
        env_path = Path(__file__).resolve().parents[2] / ".env"
        load_dotenv(env_path)
        self.google_api_key = os.getenv("GOOGLE_PLACES_API_KEY")
        self.amap_api_key = os.getenv("AMAP_WEB_SERVICE_KEY")
        self.last_amap_error = ""

    def nearby(self, city):
        if not self.data_path.exists():
            return []

        rows = pd.read_csv(self.data_path)
        matches = rows[rows["city"].str.lower() == str(city).lower()]
        if matches.empty:
            matches = rows.head(2)

        return matches.sort_values("rating", ascending=False).head(3).to_dict("records")

    def ranked_vets(self, city, limit=3):
        if self.amap_api_key:
            places = self._amap_vets(city, limit=limit)
            if places:
                return {
                    "agent": "VetFinderAgent",
                    "mode": "amap_poi_search",
                    "city": city,
                    "ranking_rule": "Amap place text search, rating first when available",
                    "vets": places,
                }

        if self.google_api_key:
            places = self._google_places_vets(city, limit=limit)
            if places:
                return {
                    "agent": "VetFinderAgent",
                    "mode": "google_places",
                    "city": city,
                    "ranking_rule": "rating + review_count",
                    "vets": places,
                }

        fallback_vets = self._fallback_ranked_vets(city, limit=limit)
        return {
            "agent": "VetFinderAgent",
            "mode": "local_fallback",
            "city": city,
            "ranking_rule": "local rating demo data",
            "amap_error": self.last_amap_error,
            "vets": fallback_vets,
        }

    def _amap_vets(self, city, limit=3):
        params = urlencode({
            "key": self.amap_api_key,
            "keywords": "宠物医院",
            "city": AMAP_CITY_CODES.get(str(city), str(city)),
            "citylimit": "true",
            "offset": 25,
            "page": 1,
            "extensions": "all",
            "output": "JSON",
        })
        url = f"https://restapi.amap.com/v3/place/text?{params}"

        try:
            request = Request(url, headers={"User-Agent": "CatGuardianAI/1.0"})
            with urlopen(request, timeout=8) as response:
                data = json.loads(response.read().decode("utf-8"))
        except URLError as error:
            if "CERTIFICATE_VERIFY_FAILED" not in str(error):
                self.last_amap_error = str(error)
                return []
            try:
                request = Request(url, headers={"User-Agent": "CatGuardianAI/1.0"})
                with urlopen(request, timeout=8, context=ssl._create_unverified_context()) as response:
                    data = json.loads(response.read().decode("utf-8"))
            except (TimeoutError, URLError, OSError, json.JSONDecodeError) as retry_error:
                self.last_amap_error = str(retry_error)
                return []
        except (TimeoutError, URLError, OSError, json.JSONDecodeError) as error:
            self.last_amap_error = str(error)
            return []

        if str(data.get("status")) != "1":
            self.last_amap_error = f"{data.get('infocode', '')} {data.get('info', '')}".strip()
            return []

        vets = []
        for index, poi in enumerate(data.get("pois", [])):
            clinic_name = poi.get("name") or "宠物医院"
            biz_ext = poi.get("biz_ext") if isinstance(poi.get("biz_ext"), dict) else {}
            rating = self._safe_float(biz_ext.get("rating"), 0)
            location = poi.get("location") if isinstance(poi.get("location"), str) else ""
            address = poi.get("address") if isinstance(poi.get("address"), str) else poi.get("district", "")
            photos = poi.get("photos") if isinstance(poi.get("photos"), list) else []

            vets.append({
                "clinic_name": clinic_name,
                "rating": rating,
                "review_count": 0,
                "address": address,
                "phone": poi.get("tel") if isinstance(poi.get("tel"), str) else "",
                "website": poi.get("website") if isinstance(poi.get("website"), str) else "",
                "maps_url": self._amap_uri(clinic_name, location),
                "photo_url": photos[0].get("url", "") if photos else "",
                "ranking_score": rating if rating > 0 else max(0.1, 1 - index / 100),
                "doctor_backgrounds": self._backgrounds_for_clinic(clinic_name, city),
            })

        if not vets:
            self.last_amap_error = "Amap returned zero POIs."
            return []

        self.last_amap_error = ""
        return sorted(vets, key=lambda item: item["ranking_score"], reverse=True)[:limit]

    def _amap_uri(self, name, location):
        if not location:
            return ""
        return f"https://uri.amap.com/marker?position={location}&name={name}"

    def _safe_float(self, value, fallback):
        try:
            return float(value)
        except (TypeError, ValueError):
            return fallback

    def _google_places_vets(self, city, limit=3):
        params = urlencode({
            "query": f"top rated veterinary clinic in {city}",
            "key": self.google_api_key,
        })
        url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?{params}"

        try:
            request = Request(url, headers={"User-Agent": "CatGuardianAI/1.0"})
            with urlopen(request, timeout=8) as response:
                data = json.loads(response.read().decode("utf-8"))
        except (TimeoutError, URLError, OSError, json.JSONDecodeError):
            return []

        results = data.get("results", [])
        vets = []
        for place in results:
            rating = float(place.get("rating") or 0)
            review_count = int(place.get("user_ratings_total") or 0)
            ranking_score = round((rating * 0.75) + (math.log1p(review_count) * 0.25), 2)
            name = place.get("name", "Veterinary clinic")
            place_id = place.get("place_id", "")

            vets.append({
                "clinic_name": name,
                "rating": rating,
                "review_count": review_count,
                "address": place.get("formatted_address", ""),
                "maps_url": f"https://www.google.com/maps/place/?q=place_id:{place_id}" if place_id else "",
                "ranking_score": ranking_score,
                "doctor_backgrounds": self._backgrounds_for_clinic(name, city),
            })

        return sorted(vets, key=lambda item: item["ranking_score"], reverse=True)[:limit]

    def _fallback_ranked_vets(self, city, limit=3):
        rows = self.nearby(city)
        vets = []
        for index, row in enumerate(rows):
            clinic_name = row.get("clinic_name", "Veterinary clinic")
            rating = float(row.get("rating", 0))
            vets.append({
                "clinic_name": clinic_name,
                "rating": rating,
                "review_count": [248, 176, 93][index % 3],
                "address": f"{row.get('city', city)} city area",
                "maps_url": "",
                "ranking_score": round(rating * 0.75 + math.log1p([248, 176, 93][index % 3]) * 0.25, 2),
                "doctor_backgrounds": self._backgrounds_for_clinic(clinic_name, city),
            })
        return vets[:limit]

    def _backgrounds_for_clinic(self, clinic_name, city):
        return [
            {
                "name": "Lead veterinarian",
                "background": (
                    f"Clinical small-animal veterinarian at {clinic_name}, focused on feline wellness exams, "
                    "triage intake, hydration changes, appetite shifts, and owner education."
                ),
            },
            {
                "name": "Feline care team",
                "background": (
                    f"Care team serving {city} cat owners with preventive checkups, senior-cat monitoring, "
                    "basic diagnostics, and follow-up planning."
                ),
            },
        ]
