import io
import json
import re
import subprocess
import tempfile
import os
from app.config import settings
from app.storage import storage

TESSERACT_CONFIDENCE_THRESHOLD = 0.85


def extract_text_hybrid(job_id: str, page_key: str, page_number: int) -> dict:
    data = storage.get_object(page_key)

    tesseract_result = _run_tesseract(data, job_id, page_number)

    if tesseract_result["confidence"] >= TESSERACT_CONFIDENCE_THRESHOLD:
        tesseract_result["engine"] = "tesseract"
        tesseract_result["was_escalated"] = False
        return tesseract_result

    google_result = _run_google_vision(data, job_id, page_number)
    if google_result is None:
        tesseract_result["engine"] = "tesseract"
        tesseract_result["was_escalated"] = False
        return tesseract_result
    google_result["engine"] = "google-vision"
    google_result["was_escalated"] = True
    google_result["tesseract_confidence"] = tesseract_result["confidence"]
    google_result["tesseract_text_preview"] = tesseract_result["raw_text"][:200]

    return google_result


def _run_tesseract(image_data: bytes, job_id: str, page_number: int) -> dict:
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp.write(image_data)
        tmp_path = tmp.name

    try:
        result = subprocess.run(
            ["tesseract", tmp_path, "stdout", "--psm", "3", "-c", "tessedit_char_whitelist="],
            capture_output=True,
            text=True,
            timeout=30,
        )

        raw_text = result.stdout.strip()

        confidence = _estimate_tesseract_confidence(result.stderr, raw_text)

        blocks = _build_blocks_from_text(raw_text, confidence)

        ocr_json = {
            "full_text": raw_text,
            "blocks": blocks,
            "page_number": page_number,
            "engine": "tesseract",
        }
        json_key = storage.upload_bytes(
            job_id,
            "ocr-json",
            f"page_{page_number:03d}_tesseract.json",
            json.dumps(ocr_json, indent=2).encode(),
            content_type="application/json",
        )

        return {
            "page_number": page_number,
            "raw_text": raw_text,
            "confidence": confidence,
            "blocks": blocks,
            "ocr_json_key": json_key,
        }
    finally:
        os.unlink(tmp_path)


def _run_google_vision(image_data: bytes, job_id: str, page_number: int) -> dict | None:
    try:
        from google.cloud import vision

        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_data)

        response = client.document_text_detection(image=image)
        texts = response.text_annotations

        if response.error.message:
            print(f"Google Vision API error: {response.error.message}")
            return None

        if not texts:
            return None

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
            "engine": "google-vision",
        }
        json_key = storage.upload_bytes(
            job_id,
            "ocr-json",
            f"page_{page_number:03d}_google.json",
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
    except Exception as e:
        print(f"Google Vision call failed for page {page_number}: {e}")
        return None


def _estimate_tesseract_confidence(stderr: str, text: str) -> float:
    for line in stderr.split("\n"):
        if "Confidence" in line:
            try:
                return float(line.split(":")[-1].strip()) / 100.0
            except (ValueError, IndexError):
                pass

    if not text.strip():
        return 0.0

    word_count = len(text.split())
    if word_count < 5:
        return 0.4
    if word_count < 20:
        return 0.6
    return 0.75


def _build_blocks_from_text(text: str, confidence: float) -> list:
    lines = text.split("\n")
    blocks = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        blocks.append({
            "text": stripped,
            "bounding_box": [],
            "block_type": _classify_block(stripped),
            "confidence": confidence,
        })
    return blocks


def _classify_block(text: str) -> str:
    text_stripped = text.strip()
    if not text_stripped:
        return "empty"

    if re.match(r"^(?:question\s*)?(?:q\s*)?\d+[\.\)\-:]", text_stripped, re.IGNORECASE):
        return "numbered_question"
    if re.match(r"^question\b", text_stripped, re.IGNORECASE):
        return "numbered_question"
    if re.match(r"^(?:figure|fig\.|diagram|image)\b", text_stripped, re.IGNORECASE):
        return "diagram_reference"
    if re.match(r"^(?:Option\s+)?[A-Ha-h][\.\)\-:\s]", text_stripped, re.IGNORECASE):
        return "option"
    if re.match(r"^(true|false|t|f)[\s\.)]", text_stripped, re.IGNORECASE):
        return "true_false"
    if re.search(r"_____|blank|\(\s*\)", text_stripped, re.IGNORECASE):
        return "fill_blank"
    if len(text_stripped) < 50:
        return "short_text"
    return "paragraph"
