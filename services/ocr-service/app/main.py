import uuid
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.job_store import job_store
from app.storage import storage
from app.models import (
    UploadResponse,
    JobStatusResponse,
    JobListItem,
    OCRJobResult,
    PipelineStage,
    STAGE_PROGRESS,
)
from app.tasks import run_pipeline

app = FastAPI(title="Adaptive CBC OCR Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ocr-service",
        "version": "2.0.0",
        "pipeline_stages": [s.value for s in PipelineStage],
        "ocr_engine": "google-cloud-vision",
        "ai_structuring": "openrouter" if settings.OPENROUTER_API_KEY else "disabled",
    }


@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    job_id = str(uuid.uuid4())

    original_key = storage.upload_bytes(
        job_id,
        "originals",
        file.filename,
        content,
        content_type=file.content_type or "application/octet-stream",
    )

    job_store.create_job(
        job_id=job_id,
        file_name=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        original_key=original_key,
    )

    run_pipeline.delay(job_id)

    return UploadResponse(
        jobId=job_id,
        status="processing",
        message="File uploaded, OCR pipeline started",
    )


@app.get("/status/{job_id}")
def get_job_status(job_id: str):
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    result = None
    if job["status"] == "completed":
        import json
        questions = json.loads(job.get("questions_json", "[]"))
        page_results = json.loads(job.get("page_results_json", "[]"))
        result = OCRJobResult(
            text=job.get("full_text", ""),
            pages=job.get("page_count", 0),
            confidence=job.get("total_confidence", 0.0),
            questions=questions,
            processing_time=job.get("processing_time", 0),
            page_results=page_results,
        )

    stage_details = None
    if job.get("stage_details"):
        import json
        stage_details = json.loads(job["stage_details"])

    return {
        "jobId": job["job_id"],
        "status": job["status"],
        "stage": job["stage"],
        "progress": job["progress"],
        "fileName": job["file_name"],
        "createdAt": job["created_at"],
        "startedAt": job.get("started_at") or None,
        "completedAt": job.get("completed_at") or None,
        "result": result,
        "error": job.get("error") or None,
        "stage_details": stage_details,
    }


@app.get("/jobs")
def list_jobs(limit: int = 50):
    jobs = job_store.list_jobs(limit)
    return {
        "jobs": [
            {
                "id": j["job_id"],
                "status": j["status"],
                "stage": j["stage"],
                "progress": j["progress"],
                "fileName": j["file_name"],
                "createdAt": j["created_at"],
                "completedAt": j.get("completed_at") or None,
            }
            for j in jobs
        ],
        "total": len(jobs),
    }


@app.delete("/jobs/{job_id}")
def delete_job(job_id: str):
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    for category in ["originals", "pages", "ocr-json", "questions", "diagrams"]:
        storage.remove_prefix(job_id, category)

    job_store.redis.delete(f"ocr:job:{job_id}")

    return {"success": True, "message": "Job and artifacts deleted"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
