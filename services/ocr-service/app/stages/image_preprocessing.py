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
        return {
            "preprocessed_key": page_key,
            "color_master_key": page_key,
            "original_key": page_key,
            "operations": [],
            "width": 0,
            "height": 0
        }

    operations = ["preserve_master_fidelity"]

    # Use pristine master image for OCR to avoid destroying small punctuation and anti-aliased font edges
    return {
        "preprocessed_key": page_key,
        "color_master_key": page_key,
        "original_key": page_key,
        "operations": operations,
        "width": img.shape[1],
        "height": img.shape[0],
    }
