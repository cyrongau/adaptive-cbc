import io
import cv2
import numpy as np
from PIL import Image
from app.storage import storage


def preprocess_image(job_id: str, page_key: str, page_number: int) -> dict:
    data = storage.get_object(page_key)
    img_array = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    if img is None:
        return {"preprocessed_key": page_key, "operations": []}

    operations = []

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    operations.append("gaussian_blur")

    adaptive = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    operations.append("adaptive_threshold")

    kernel = np.ones((2, 2), np.uint8)
    cleaned = cv2.morphologyEx(adaptive, cv2.MORPH_CLOSE, kernel)
    operations.append("morphology_close")

    _, buf = cv2.imencode(".png", cleaned)
    processed_data = buf.tobytes()

    filename = f"page_{page_number:03d}_processed.png"
    processed_key = storage.upload_bytes(
        job_id,
        "pages",
        filename,
        processed_data,
        content_type="image/png",
    )

    return {
        "preprocessed_key": processed_key,
        "original_key": page_key,
        "operations": operations,
        "width": img.shape[1],
        "height": img.shape[0],
    }
