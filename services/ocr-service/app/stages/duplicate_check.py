import hashlib
import json
import time
from app.config import settings
from app.storage import storage
from app.job_store import job_store

DUPLICATE_CHECK_PREFIX = "ocr:duplicate:"


def check_duplicate(image_data: bytes) -> dict | None:
    content_hash = hashlib.sha256(image_data).hexdigest()

    cache_key = f"{DUPLICATE_CHECK_PREFIX}{content_hash}"
    existing_job_id = job_store.redis.get(cache_key)

    if existing_job_id:
        existing_job = job_store.get_job(existing_job_id)
        if existing_job and existing_job.get("status") == "completed":
            return {
                "is_duplicate": True,
                "original_job_id": existing_job_id,
                "content_hash": content_hash,
                "job_data": existing_job
            }

    return None


def register_document(content_hash: str, job_id: str, ttl_seconds: int = 86400 * 30):
    cache_key = f"{DUPLICATE_CHECK_PREFIX}{content_hash}"
    job_store.redis.set(cache_key, job_id, ex=ttl_seconds)


def compute_page_hashes(page_keys: list) -> list:
    hashes = []
    for key in page_keys:
        try:
            data = storage.get_object(key)
            page_hash = hashlib.md5(data).hexdigest()
            hashes.append(page_hash)
        except Exception:
            hashes.append(None)
    return hashes
