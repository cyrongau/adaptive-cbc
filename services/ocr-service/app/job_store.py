from __future__ import annotations

import json
import redis
from datetime import datetime
from typing import Optional
from app.config import settings
from app.models import PipelineStage, STAGE_PROGRESS, ExtractedQuestion, PageResult


class JobStore:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.prefix = "ocr:job:"

    def _key(self, job_id: str) -> str:
        return f"{self.prefix}{job_id}"

    def create_job(self, job_id: str, file_name: str, mime_type: str, original_key: str) -> dict:
        data = {
            "job_id": job_id,
            "status": "uploaded",
            "stage": PipelineStage.UPLOADED.value,
            "progress": STAGE_PROGRESS[PipelineStage.UPLOADED],
            "file_name": file_name,
            "mime_type": mime_type,
            "original_key": original_key,
            "created_at": datetime.utcnow().isoformat(),
            "started_at": "",
            "completed_at": "",
            "error": "",
            "full_text": "",
            "page_count": 0,
            "total_confidence": 0.0,
            "questions_json": "[]",
            "page_results_json": "[]",
            "stage_details": "{}",
            "processing_time": 0,
        }
        self.redis.set(self._key(job_id), json.dumps(data))
        return data

    def get_job(self, job_id: str) -> Optional[dict]:
        raw = self.redis.get(self._key(job_id))
        if raw is None:
            return None
        return json.loads(raw)

    def update_job(self, job_id: str, **kwargs) -> dict:
        data = self.get_job(job_id)
        if data is None:
            raise ValueError(f"Job {job_id} not found")
        data.update(kwargs)
        self.redis.set(self._key(job_id), json.dumps(data))
        return data

    def set_stage(self, job_id: str, stage: PipelineStage, details: dict = None):
        data = self.get_job(job_id)
        if data is None:
            return
        data["stage"] = stage.value
        data["status"] = "processing" if stage != PipelineStage.COMPLETED and stage != PipelineStage.FAILED else stage.value
        data["progress"] = STAGE_PROGRESS[stage]
        if details:
            sd = json.loads(data.get("stage_details", "{}"))
            sd[stage.value] = details
            data["stage_details"] = json.dumps(sd)
        self.redis.set(self._key(job_id), json.dumps(data))

    def set_completed(self, job_id: str, result: dict):
        data = self.get_job(job_id)
        if data is None:
            return
        data["status"] = "completed"
        data["stage"] = PipelineStage.COMPLETED.value
        data["progress"] = 100
        data["completed_at"] = datetime.utcnow().isoformat()
        data["full_text"] = result.get("text", "")
        data["page_count"] = result.get("pages", 0)
        data["total_confidence"] = result.get("confidence", 0.0)
        data["questions_json"] = json.dumps(result.get("questions", []))
        data["page_results_json"] = json.dumps(result.get("page_results", []))
        data["processing_time"] = result.get("processing_time", 0)
        self.redis.set(self._key(job_id), json.dumps(data))

    def set_failed(self, job_id: str, error: str, stage: PipelineStage = PipelineStage.FAILED):
        data = self.get_job(job_id)
        if data is None:
            return
        data["status"] = "failed"
        data["stage"] = stage.value
        data["progress"] = 0
        data["error"] = error
        data["completed_at"] = datetime.utcnow().isoformat()
        self.redis.set(self._key(job_id), json.dumps(data))

    def list_jobs(self, limit: int = 50) -> list[dict]:
        keys = self.redis.keys(f"{self.prefix}*")
        jobs = []
        for key in sorted(keys, reverse=True)[:limit]:
            raw = self.redis.get(key)
            if raw:
                jobs.append(json.loads(raw))
        return jobs


job_store = JobStore()
