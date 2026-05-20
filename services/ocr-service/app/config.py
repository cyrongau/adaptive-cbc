from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PORT: int = 8003
    REDIS_URL: str = "redis://redis:6379/0"
    DATABASE_URL: str = "postgresql://cbc_user:cbc_secure_pass_2024@postgres:5432/adaptive_cbc"

    # MinIO
    MINIO_ENDPOINT: str = "minio"
    MINIO_PORT: str = "9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET: str = "ocr-documents"
    MINIO_SECURE: bool = False

    # Google Cloud Vision
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    GOOGLE_VISION_API_KEY: Optional[str] = None

    # OpenRouter (AI Structuring)
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-001"
    AI_SERVICE_URL: str = "http://ai-service:8002"

    # Processing
    MAX_PAGES: int = 30
    OCR_DPI: int = 300
    MAX_WORKERS: int = 4

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
