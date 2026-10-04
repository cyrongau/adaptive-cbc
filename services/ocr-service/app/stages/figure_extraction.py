import uuid
import cv2
import numpy as np
from app.storage import storage

def extract_figures(
    job_id: str,
    color_page_key: str,
    page_number: int,
    known_figure_regions: list[dict] = None
) -> list[dict]:
    """
    Extracts figure, diagram, and photographic illustration crops
    DIRECTLY from the Color Master Page image (preserving color, texture, geometry).
    Associates figures with their specific question_number.
    """
    data = storage.get_object(color_page_key)
    nparr = np.frombuffer(data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        return []

    height, width = image.shape[:2]
    extracted_figures = []

    # Case A: Known figure regions provided from Layout Engine (Method c or b)
    if known_figure_regions:
        for reg in known_figure_regions:
            bbox = reg.get("bbox")
            if not bbox or len(bbox) != 4:
                continue

            x, y, w, h = bbox
            # Safe bounds check and slight padding
            pad = 6
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(width, x + w + pad)
            y2 = min(height, y + h + pad)

            if x2 - x1 < 20 or y2 - y1 < 20:
                continue

            crop = image[y1:y2, x1:x2]
            is_success, buffer = cv2.imencode(".png", crop)
            if not is_success:
                continue

            q_num = reg.get("question_number", "")
            file_name = f"page_{page_number:03d}_q{q_num or 'gen'}_fig_{uuid.uuid4().hex[:6]}.png"
            key = storage.upload_bytes(job_id, "figures", file_name, buffer.tobytes(), "image/png")
            url = storage.get_presigned_url(key)

            extracted_figures.append({
                "id": f"fig_{uuid.uuid4().hex[:8]}",
                "key": key,
                "url": url,
                "question_number": q_num,
                "bbox": [x1, y1, x2 - x1, y2 - y1],
                "bounding_box": [(x1, y1), (x2, y1), (x2, y2), (x1, y2)],
                "page_number": page_number,
                "figure_type": reg.get("figure_type", "diagram")
            })

        return extracted_figures

    # Case B: Heuristic contour detection in Question Column only (exclude right 40% working area)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 235, 255, cv2.THRESH_BINARY_INV)

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (14, 14))
    dilated = cv2.dilate(thresh, kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    min_area = (width * height) * 0.01   # Minimum 1% of page area
    max_area = (width * height) * 0.40   # Maximum 40% of page area
    question_col_max_x = int(width * 0.65) # Ignore working area on right

    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        area = w * h
        aspect_ratio = float(w) / h if h > 0 else 0

        # Skip working area column or tiny text glyphs or full page lines
        if x + (w // 2) > question_col_max_x:
            continue
        if min_area < area < max_area and 0.2 < aspect_ratio < 4.0 and h > 50:
            crop = image[y:y+h, x:x+w]
            is_success, buffer = cv2.imencode(".png", crop)
            if not is_success:
                continue

            file_name = f"page_{page_number:03d}_fig_{uuid.uuid4().hex[:6]}.png"
            key = storage.upload_bytes(job_id, "figures", file_name, buffer.tobytes(), "image/png")
            url = storage.get_presigned_url(key)

            extracted_figures.append({
                "id": f"fig_{uuid.uuid4().hex[:8]}",
                "key": key,
                "url": url,
                "question_number": "",
                "bbox": [x, y, w, h],
                "bounding_box": [(x, y), (x+w, y), (x+w, y+h), (x, y+h)],
                "page_number": page_number,
                "figure_type": "diagram"
            })

    extracted_figures.sort(key=lambda f: f["bbox"][1])
    return extracted_figures
