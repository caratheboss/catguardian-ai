import html
import json
import os
import re
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from openai import OpenAI


TRUSTED_SOURCES = [
    {
        "name": "Cornell Feline Health Center",
        "url": "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center",
        "why": "University veterinary health education.",
    },
    {
        "name": "VCA Animal Hospitals",
        "url": "https://vcahospitals.com/know-your-pet/cat-breeds",
        "why": "Veterinary-reviewed pet health and breed education.",
    },
    {
        "name": "International Cat Care",
        "url": "https://icatcare.org/advice/cat-breeds/",
        "why": "Cat welfare charity with veterinary education resources.",
    },
    {
        "name": "PetMD",
        "url": "https://www.petmd.com/cat/breeds",
        "why": "Veterinary-reviewed pet health articles.",
    },
    {
        "name": "CFA Breed Profiles",
        "url": "https://cfa.org/breeds/",
        "why": "Established cat breed registry profiles.",
    },
]

ALLOWED_SOURCE_DOMAINS = [
    "vet.cornell.edu",
    "vcahospitals.com",
    "icatcare.org",
    "petmd.com",
    "cfa.org",
]


BREED_SIGNALS = {
    "Persian": ["flat-face breathing comfort", "eye discharge", "coat matting", "kidney risk context", "weight changes"],
    "British Shorthair": ["weight control", "joint comfort", "dental care", "activity baseline", "heart-health context"],
    "Maine Coon": ["heart-health context", "joint comfort", "large-breed weight tracking", "coat care", "activity baseline"],
    "Siamese": ["dental care", "respiratory comfort", "high activity baseline", "appetite shifts", "stress sensitivity"],
    "Ragdoll": ["heart-health context", "weight control", "low-activity baseline", "coat care", "urinary habits"],
    "Bengal": ["high activity baseline", "environmental enrichment", "appetite shifts", "stool changes", "stress behavior"],
    "Sphynx": ["skin oil buildup", "temperature comfort", "ear cleaning", "appetite shifts", "heart-health context"],
    "Scottish Fold": ["joint comfort", "mobility changes", "weight control", "pain-hiding behavior", "activity decline"],
    "Abyssinian": ["high activity baseline", "dental care", "weight changes", "appetite shifts", "stress behavior"],
    "Russian Blue": ["weight control", "quiet behavior changes", "urinary habits", "coat condition", "appetite shifts"],
    "Norwegian Forest Cat": ["large-breed weight tracking", "coat care", "joint comfort", "activity baseline", "heart-health context"],
    "American Shorthair": ["weight control", "dental care", "urinary habits", "activity baseline", "appetite shifts"],
    "Birman": ["weight control", "coat care", "kidney risk context", "quiet behavior changes", "appetite shifts"],
    "Devon Rex": ["skin and coat condition", "temperature comfort", "dental care", "appetite shifts", "activity baseline"],
    "Oriental Shorthair": ["high activity baseline", "dental care", "respiratory comfort", "stress behavior", "appetite shifts"],
}


class BreedResearchAgent:
    def __init__(self):
        env_path = Path(__file__).resolve().parents[2] / ".env"
        load_dotenv(env_path)
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key, timeout=75.0, max_retries=1) if self.api_key else None

    def research(self, breed):
        breed_name = str(breed or "Persian")
        source_packets = self._source_packets(breed_name)
        if self.client:
            insights, agent_mode, debug_error = self._llm_web_search(breed_name, source_packets)
        else:
            insights = self._fallback_insights(breed_name)
            agent_mode = "deterministic fallback"
            debug_error = "OPENAI_API_KEY is missing."

        return {
            "breed": breed_name,
            "llm_agent": agent_mode,
            "debug_error": debug_error,
            "allowed_sources": TRUSTED_SOURCES,
            "insights": insights[:2],
            "cat_health_threads": self._cat_health_threads(),
        }

    def _source_packets(self, breed):
        signals = BREED_SIGNALS.get(breed, BREED_SIGNALS["Persian"])
        return [
            {
                "source": TRUSTED_SOURCES[index % len(TRUSTED_SOURCES)]["name"],
                "source_url": TRUSTED_SOURCES[index % len(TRUSTED_SOURCES)]["url"],
                "topic": signal,
                "note": (
                    f"For {breed} cats, summarize this topic as wellness monitoring context. "
                    "Avoid diagnosis and explain what an owner should observe."
                ),
            }
            for index, signal in enumerate(signals)
        ]

    def _llm_web_search(self, breed, source_packets):
        try:
            response = self.client.responses.create(
                model=os.getenv("OPENAI_SEARCH_MODEL", "gpt-5"),
                tools=[{"type": "web_search"}],
                tool_choice="auto",
                include=["web_search_call.action.sources"],
                input=[
                    {
                        "role": "system",
                        "content": (
                            "You are BreedResearchAgent for a feline wellness monitoring MVP. "
                            "Use web search to select two relevant pages about the requested cat breed. "
                            "Return only a JSON object with an insights array of exactly 2 objects. "
                            "Each object must have title, source, source_url. "
                            "Do not include summary text. Do not diagnose."
                        ),
                    },
                    {
                        "role": "user",
                        "content": json.dumps(
                            {
                                "breed": breed,
                                "task": (
                                    "Find and directly select 2 useful pages for someone learning about this "
                                    "breed's care, traits, or health monitoring. Return title, source name, "
                                    "and real URL only."
                                ),
                            }
                        ),
                    },
                ],
            )
            insights = self._parse_and_validate_insights(response.output_text)
            if len(insights) >= 2:
                return insights[:2], "OpenAI web search", ""
        except Exception as web_search_error:
            first_error = str(web_search_error)

        return self._fallback_insights(breed), "curated fallback", f"web search failed: {first_error}"

    def _parse_and_validate_insights(self, text):
        parsed = self._extract_json(text)
        if isinstance(parsed, dict):
            parsed = parsed.get("insights", [])
        if not isinstance(parsed, list):
            return []

        insights = []
        seen_urls = set()
        for item in parsed:
            if not isinstance(item, dict):
                continue

            title = str(item.get("title", "")).strip()
            summary = str(item.get("summary", "")).strip()
            source = str(item.get("source", "")).strip()
            source_url = str(item.get("source_url", "")).strip()
            evidence_urls = item.get("evidence_urls") or item.get("urls") or []
            if isinstance(evidence_urls, str):
                evidence_urls = [evidence_urls]
            if source_url and source_url not in evidence_urls:
                evidence_urls = [source_url, *evidence_urls]

            evidence_urls = [
                str(url).strip()
                for url in evidence_urls
                if str(url).strip()
            ]
            source_domains = sorted({self._normalized_hostname(url) for url in evidence_urls})
            source_count = len(source_domains)

            if not title or not evidence_urls:
                continue
            source_url = evidence_urls[0]
            if source_url in seen_urls:
                continue

            insights.append(
                {
                    "title": title,
                    "summary": summary,
                    "source": source or self._source_name_for_url(source_url),
                    "source_url": source_url,
                    "source_count": source_count,
                    "sources": item.get("sources") or [self._source_name_for_url(url) for url in evidence_urls],
                    "evidence_urls": evidence_urls,
                }
            )
            seen_urls.add(source_url)

        return insights

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

        match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        return None

    def _is_allowed_source_url(self, source_url):
        hostname = urlparse(source_url).hostname or ""
        hostname = hostname.lower().removeprefix("www.")
        return any(hostname == domain or hostname.endswith(f".{domain}") for domain in ALLOWED_SOURCE_DOMAINS)

    def _source_name_for_url(self, source_url):
        hostname = (urlparse(source_url).hostname or "").lower()
        if "cornell.edu" in hostname:
            return "Cornell Feline Health Center"
        if "vcahospitals.com" in hostname:
            return "VCA Animal Hospitals"
        if "icatcare.org" in hostname:
            return "International Cat Care"
        if "petmd.com" in hostname:
            return "PetMD"
        if "cfa.org" in hostname:
            return "CFA Breed Profiles"
        return "Trusted source"

    def _fallback_insights(self, breed):
        signals = BREED_SIGNALS.get(breed, BREED_SIGNALS["Persian"])
        return [
            {
                "title": f"{breed}: {signal.title()}",
                "summary": "",
                "source": TRUSTED_SOURCES[index % len(TRUSTED_SOURCES)]["name"],
                "source_url": TRUSTED_SOURCES[index % len(TRUSTED_SOURCES)]["url"],
                "source_count": 0,
                "sources": [],
                "evidence_urls": [TRUSTED_SOURCES[index % len(TRUSTED_SOURCES)]["url"]],
            }
            for index, signal in enumerate(signals[:2])
        ]

    def _normalized_hostname(self, source_url):
        return (urlparse(source_url).hostname or "").lower().removeprefix("www.")

    def _cat_health_threads(self):
        forum_url = "https://thecatsite.com/forums/cat-health.4/"
        try:
            request = Request(
                forum_url,
                headers={"User-Agent": "CatGuardianAI/1.0 wellness-monitoring-demo"},
            )
            with urlopen(request, timeout=7) as response:
                page = response.read().decode("utf-8", errors="ignore")
        except (TimeoutError, URLError, OSError):
            return {
                "source": "TheCatSite Cat Health Forum",
                "source_url": forum_url,
                "items": [],
                "error": "Live forum feed unavailable. Try again when the backend has internet access.",
            }

        items = []
        pattern = re.compile(
            r'<div class="structItem-title">.*?<a href="(?P<href>[^"]+)"[^>]*>(?P<title>.*?)</a>.*?</div>',
            re.DOTALL,
        )
        for match in pattern.finditer(page):
            title = re.sub(r"<.*?>", "", match.group("title")).strip()
            title = html.unescape(title)
            if not title or title.lower() in {"cat health"}:
                continue
            items.append(
                {
                    "title": title,
                    "url": urljoin(forum_url, html.unescape(match.group("href"))),
                    "source": "TheCatSite Cat Health Forum",
                }
            )
            if len(items) == 5:
                break

        return {
            "source": "TheCatSite Cat Health Forum",
            "source_url": forum_url,
            "items": items,
            "error": "" if items else "No forum items could be parsed from the live page.",
        }
