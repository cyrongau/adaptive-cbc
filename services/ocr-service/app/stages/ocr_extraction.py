import io
import os
from google.cloud import vision
from app.config import settings
from app.storage import storage


def extract_text_google_vision(job_id: str, page_key: str, page_number: int) -> dict:
    data = storage.get_object(page_key)

    client = vision.ImageAnnotatorClient()
    image = vision.Image(content=data)

    response = client.text_detection(image=image)
    texts = response.text_annotations

    if response.error.message:
        raise RuntimeError(f"Google Vision API error: {response.error.message}")

    full_text = texts[0].description if texts else ""

    blocks = []
    for page in response.full_text_annotation.pages:
        for block in page.blocks:
            block_text = ""
            for paragraph in block.paragraphs:
                for word in paragraph.words:
                    block_text += "".join([symbol.text for symbol in word.symbols]) + " "
                block_text += "\n"

            vertices = [(v.x, v.y) for v in block.bounding_box.vertices]
            blocks.append({
                "text": block_text.strip(),
                "bounding_box": vertices,
                "block_type": _classify_block(block_text.strip()),
                "confidence": block.confidence,
            })

    avg_confidence = sum(b.get("confidence", 0) for b in blocks) / len(blocks) if blocks else 0

    ocr_json = {
        "full_text": full_text,
        "blocks": blocks,
        "page_number": page_number,
    }

    import json
    json_key = storage.upload_bytes(
        job_id,
        "ocr-json",
        f"page_{page_number:03d}.json",
        json.dumps(ocr_json, indent=2).encode(),
        content_type="application/json",
    )

    return {
        "page_number": page_number,
        "raw_text": full_text,
        "confidence": avg_confidence,
        "blocks": blocks,
        "ocr_json_key": json_key,
    }


def _classify_block(text: str) -> str:
    text_stripped = text.strip()
    if not text_stripped:
        return "empty"

    import re
    if re.match(r"^\d+[\.\)\-]", text_stripped):
        return "numbered_question"
    if re.match(r"^[A-Da-d][\.\)\s]", text_stripped):
        return "option"
    if re.match(r"^(true|false|t|f)[\s\.)]", text_stripped, re.IGNORECASE):
        return "true_false"
    if re.search(r"_____|blank|\(\s*\)", text_stripped, re.IGNORECASE):
        return "fill_blank"
    if len(text_stripped) < 50:
        return "short_text"
    return "paragraph"
