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
    OPENROUTER_MODEL: str = "google/gemini-2.5-flash"
    AI_SERVICE_URL: str = "http://ai-service:8002"

    # Layout & Recognition
    LAYOUT_ENGINE: str = "hybrid"  # "hybrid" (vision primary, local escalation), "vision", or "local"
    TESSERACT_CONFIDENCE_THRESHOLD: float = 0.80

    # Processing
    MAX_PAGES: int = 30
    OCR_DPI: int = 300
    MAX_WORKERS: int = 4

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    def model_post_init(self, __context):
        # Fallback if OPENROUTER_API_KEY was passed as empty string from environment override
        if not self.OPENROUTER_API_KEY:
            import os
            for env_path in ["/app/.env", ".env", "../backend/.env", "backend/.env"]:
                if os.path.exists(env_path):
                    try:
                        from dotenv import dotenv_values
                        vals = dotenv_values(env_path)
                        key = vals.get("OPENROUTER_API_KEY")
                        if key:
                            self.OPENROUTER_API_KEY = key
                            break
                    except Exception:
                        pass

        # Upgrade deprecated Gemini 2.0 Flash 001 model ID to Gemini 2.5 Flash
        if self.OPENROUTER_MODEL in ("google/gemini-2.0-flash-001", "google/gemini-2.0-flash"):
            self.OPENROUTER_MODEL = "google/gemini-2.5-flash"


settings = Settings()

