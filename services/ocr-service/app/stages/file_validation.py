from app.models import PipelineStage


ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/tiff",
    "application/pdf",
}

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".pdf"}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def validate_file(file_name: str, mime_type: str, file_size: int) -> dict:
    ext = "." + file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""

    if mime_type not in ALLOWED_MIME_TYPES and ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {mime_type or ext}. Allowed: {', '.join(ALLOWED_MIME_TYPES)}")

    if file_size > MAX_FILE_SIZE:
        raise ValueError(f"File too large: {file_size / 1024 / 1024:.1f}MB. Max: {MAX_FILE_SIZE / 1024 / 1024:.0f}MB")

    is_pdf = mime_type == "application/pdf" or ext == ".pdf"

    return {
        "valid": True,
        "is_pdf": is_pdf,
        "extension": ext,
        "file_size": file_size,
        "file_name": file_name,
    }
