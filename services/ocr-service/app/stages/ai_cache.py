import hashlib
import json
from app.config import settings
from app.job_store import job_store

AI_CACHE_PREFIX = "ocr:ai_cache:"
AI_CACHE_TTL = 86400 * 30


def get_ai_cache(service: str, input_data: dict) -> dict | None:
    cache_key = _build_cache_key(service, input_data)
    cached = job_store.redis.get(f"{AI_CACHE_PREFIX}{cache_key}")
    if cached:
        return json.loads(cached)
    return None


def set_ai_cache(service: str, input_data: dict, result: dict):
    cache_key = _build_cache_key(service, input_data)
    job_store.redis.set(
        f"{AI_CACHE_PREFIX}{cache_key}",
        json.dumps(result),
        ex=AI_CACHE_TTL,
    )


def _build_cache_key(service: str, input_data: dict) -> str:
    content = json.dumps(input_data, sort_keys=True)
    content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
    return f"{service}:{content_hash}"
