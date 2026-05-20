import io
import os
import tempfile
from pdf2image import convert_from_bytes
from PIL import Image
from app.config import settings
from app.storage import storage


def split_pdf_to_pages(job_id: str, original_key: str, max_pages: int = None) -> list[dict]:
    max_pages = max_pages or settings.MAX_PAGES

    data = storage.get_object(original_key)

    with tempfile.TemporaryDirectory() as tmpdir:
        images = convert_from_bytes(
            data,
            dpi=settings.OCR_DPI,
            output_folder=tmpdir,
            fmt="png",
        )

        page_keys = []
        for i, img in enumerate(images[:max_pages]):
            page_num = i + 1
            filename = f"page_{page_num:03d}.png"

            buf = io.BytesIO()
            img.save(buf, format="PNG")
            buf.seek(0)

            key = storage.upload_bytes(
                job_id,
                "pages",
                filename,
                buf.read(),
                content_type="image/png",
            )
            page_keys.append({
                "page_number": page_num,
                "storage_key": key,
                "width": img.width,
                "height": img.height,
            })

    return page_keys


def split_image_to_page(job_id: str, original_key: str) -> list[dict]:
    data = storage.get_object(original_key)
    img = Image.open(io.BytesIO(data))

    filename = "page_001.png"
    key = storage.upload_bytes(
        job_id,
        "pages",
        filename,
        data,
        content_type="image/png",
    )

    return [{
        "page_number": 1,
        "storage_key": key,
        "width": img.width,
        "height": img.height,
    }]
