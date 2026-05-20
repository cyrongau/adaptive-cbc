import io
from minio import Minio
from app.config import settings


class StorageManager:
    def __init__(self):
        self.client = Minio(
            f"{settings.MINIO_ENDPOINT}:{settings.MINIO_PORT}",
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket = settings.MINIO_BUCKET
        self._ensure_bucket()

    def _ensure_bucket(self):
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)

    def _make_key(self, job_id: str, category: str, filename: str) -> str:
        return f"{category}/{job_id}/{filename}"

    def upload_bytes(self, job_id: str, category: str, filename: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        key = self._make_key(job_id, category, filename)
        self.client.put_object(
            self.bucket,
            key,
            io.BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
        return key

    def upload_file(self, job_id: str, category: str, filename: str, filepath: str, content_type: str = "application/octet-stream") -> str:
        key = self._make_key(job_id, category, filename)
        self.client.fput_object(self.bucket, key, filepath, content_type=content_type)
        return key

    def get_presigned_url(self, key: str, expires_hours: int = 24) -> str:
        return self.client.presigned_get_object(self.bucket, key, expires=3600 * expires_hours)

    def get_object(self, key: str) -> bytes:
        response = self.client.get_object(self.bucket, key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def list_objects(self, job_id: str, category: str) -> list[str]:
        prefix = f"{category}/{job_id}/"
        return [obj.object_name for obj in self.client.list_objects(self.bucket, prefix=prefix, recursive=True)]

    def remove_object(self, key: str):
        self.client.remove_object(self.bucket, key)

    def remove_prefix(self, job_id: str, category: str):
        prefix = f"{category}/{job_id}/"
        for obj in self.client.list_objects(self.bucket, prefix=prefix, recursive=True):
            self.client.remove_object(self.bucket, obj.object_name)


storage = StorageManager()
