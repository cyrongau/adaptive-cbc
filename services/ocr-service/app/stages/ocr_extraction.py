import io
import json
import re
import csv
import subprocess
import tempfile
import os
from app.config import settings
from app.storage import storage

TESSERACT_CONFIDENCE_THRESHOLD = settings.TESSERACT_CONFIDENCE_THRESHOLD


def extract_text_hybrid(job_id: str, page_key: str, page_number: int) -> dict:
    data = storage.get_object(page_key)

    tesseract_result = _run_tesseract(data, job_id, page_number)

    if tesseract_result["confidence"] >= settings.TESSERACT_CONFIDENCE_THRESHOLD:
        tesseract_result["engine"] = "tesseract"
        tesseract_result["was_escalated"] = False
        return tesseract_result

    # Escalate to Google Cloud Vision only if credentials configured and confidence is low
    if settings.GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS):
        google_result = _run_google_vision(data, job_id, page_number)
        if google_result is not None:
            google_result["engine"] = "google-vision"
            google_result["was_escalated"] = True
            google_result["tesseract_confidence"] = tesseract_result["confidence"]
            google_result["tesseract_text_preview"] = tesseract_result["raw_text"][:200]
            return google_result

    tesseract_result["engine"] = "tesseract"
    tesseract_result["was_escalated"] = False
    return tesseract_result


def _run_tesseract(image_data: bytes, job_id: str, page_number: int) -> dict:
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp.write(image_data)
        tmp_path = tmp.name

    try:
        # Run Tesseract with TSV output to get true word confidences and precise bounding boxes
        result_tsv = subprocess.run(
            ["tesseract", tmp_path, "stdout", "--psm", "3", "tsv"],
            capture_output=True,
            text=True,
            timeout=30,
        )

        result_txt = subprocess.run(
            ["tesseract", tmp_path, "stdout", "--psm", "3"],
            capture_output=True,
            text=True,
            timeout=30,
        )

        raw_text = result_txt.stdout.strip()
        tsv_output = result_tsv.stdout

        blocks, avg_confidence, words_data = _parse_tsv_blocks(tsv_output, raw_text)

        ocr_json = {
            "full_text": raw_text,
            "blocks": blocks,
            "words": words_data,
            "page_number": page_number,
            "engine": "tesseract",
            "confidence": avg_confidence,
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
            "confidence": avg_confidence,
            "blocks": blocks,
            "words": words_data,
            "ocr_json_key": json_key,
        }
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


def _parse_tsv_blocks(tsv_output: str, fallback_text: str) -> tuple[list[dict], float, list[dict]]:
    blocks = []
    words_data = []
    confs = []

    if not tsv_output.strip():
        return _build_blocks_from_text(fallback_text, 0.5), 0.5, []

    try:
        reader = csv.DictReader(io.StringIO(tsv_output), delimiter="\t")
        current_block_words = []
        current_block_num = None

        for row in reader:
            if row.get("level") == "5":
                text = (row.get("text") or "").strip()
                if not text:
                    continue

                conf_val = float(row.get("conf", -1))
                left = int(row.get("left", 0))
                top = int(row.get("top", 0))
                width = int(row.get("width", 0))
                height = int(row.get("height", 0))
                block_num = row.get("block_num")
                line_num = row.get("line_num")

                word_info = {
                    "text": text,
                    "conf": max(0.0, conf_val / 100.0) if conf_val >= 0 else 0.5,
                    "bbox": [left, top, width, height],
                    "block_num": block_num,
                    "line_num": line_num,
                }
                words_data.append(word_info)

                if conf_val >= 0:
                    confs.append(conf_val / 100.0)

                if current_block_num != block_num:
                    if current_block_words:
                        b_text = " ".join(w["text"] for w in current_block_words)
                        b_confs = [w["conf"] for w in current_block_words]
                        b_avg = sum(b_confs) / len(b_confs) if b_confs else 0.5
                        min_x = min(w["bbox"][0] for w in current_block_words)
                        min_y = min(w["bbox"][1] for w in current_block_words)
                        max_x = max(w["bbox"][0] + w["bbox"][2] for w in current_block_words)
                        max_y = max(w["bbox"][1] + w["bbox"][3] for w in current_block_words)
                        blocks.append({
                            "text": b_text,
                            "bounding_box": [(min_x, min_y), (max_x, min_y), (max_x, max_y), (min_x, max_y)],
                            "bbox_rect": [min_x, min_y, max_x - min_x, max_y - min_y],
                            "block_type": _classify_block(b_text),
                            "confidence": round(b_avg, 3),
                        })
                    current_block_words = [word_info]
                    current_block_num = block_num
                else:
                    current_block_words.append(word_info)

        if current_block_words:
            b_text = " ".join(w["text"] for w in current_block_words)
            b_confs = [w["conf"] for w in current_block_words]
            b_avg = sum(b_confs) / len(b_confs) if b_confs else 0.5
            min_x = min(w["bbox"][0] for w in current_block_words)
            min_y = min(w["bbox"][1] for w in current_block_words)
            max_x = max(w["bbox"][0] + w["bbox"][2] for w in current_block_words)
            max_y = max(w["bbox"][1] + w["bbox"][3] for w in current_block_words)
            blocks.append({
                "text": b_text,
                "bounding_box": [(min_x, min_y), (max_x, min_y), (max_x, max_y), (min_x, max_y)],
                "bbox_rect": [min_x, min_y, max_x - min_x, max_y - min_y],
                "block_type": _classify_block(b_text),
                "confidence": round(b_avg, 3),
            })

    except Exception as e:
        print(f"Failed parsing TSV blocks: {e}")
        blocks = _build_blocks_from_text(fallback_text, 0.6)

    avg_conf = sum(confs) / len(confs) if confs else 0.5
    return blocks, round(avg_conf, 3), words_data


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
        words_data = []
        for page in response.full_text_annotation.pages:
            for block in page.blocks:
                block_text = ""
                for paragraph in block.paragraphs:
                    for word in paragraph.words:
                        w_text = "".join([symbol.text for symbol in word.symbols])
                        block_text += w_text + " "
                        w_verts = [(v.x, v.y) for v in word.bounding_box.vertices]
                        if w_verts:
                            wx = min(v[0] for v in w_verts)
                            wy = min(v[1] for v in w_verts)
                            ww = max(v[0] for v in w_verts) - wx
                            wh = max(v[1] for v in w_verts) - wy
                            w_conf = getattr(word, "confidence", 0.95)
                            words_data.append({
                                "text": w_text,
                                "confidence": w_conf,
                                "bbox_rect": [wx, wy, ww, wh],
                                "left": wx,
                                "top": wy,
                                "width": ww,
                                "height": wh,
                            })
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
            "words": words_data,
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
            "words": words_data,
            "ocr_json_key": json_key,
        }
    except Exception as e:
        print(f"Google Vision call failed for page {page_number}: {e}")
        return None


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
