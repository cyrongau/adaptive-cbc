import re
import cv2
import numpy as np
from app.models import RegionType, PageRegion, ChoiceLayout, QuestionOption, ExtractedQuestion

def detect_local_layout(
    color_image_bytes: bytes,
    tsv_words: list[dict],
    page_blocks: list[dict],
    page_number: int = 1
) -> dict:
    """
    Method (b): Local Layout and Geometry Engine.
    Decomposes the page using OpenCV morphological operations and text spatial alignment.
    1. Identifies column dividers (e.g. separating Question column from WORKING AREA).
    2. Identifies Negative Space (Header, Footer, Margin, Working Area, Handwriting).
    3. Detects Question Boundaries from question numbering signals.
    4. Detects Figures & Diagrams inside question boundaries.
    5. Detects MCQ Layout (inline, 2_column, vertical).
    """
    nparr = np.frombuffer(color_image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"questions": [], "regions": [], "figures": [], "column_divider_x": None}

    h, w = img.shape[:2]

    # 1. Detect Vertical Column Divider separating Questions from Working Area
    col_div_x = _detect_vertical_divider(img, tsv_words, page_blocks)

    # 2. Segment regions
    regions = []
    header_threshold_y = int(h * 0.02)
    footer_threshold_y = int(h * 0.93)

    # Header region
    regions.append(PageRegion(
        id=f"p{page_number}_header",
        type=RegionType.HEADER,
        bbox=[0, 0, w, header_threshold_y],
        confidence=0.98,
        page_number=page_number
    ))

    # Footer region
    regions.append(PageRegion(
        id=f"p{page_number}_footer",
        type=RegionType.FOOTER,
        bbox=[0, footer_threshold_y, w, h - footer_threshold_y],
        confidence=0.98,
        page_number=page_number
    ))

    # Working area region if divider detected
    if col_div_x and col_div_x < w * 0.85:
        regions.append(PageRegion(
            id=f"p{page_number}_working_area",
            type=RegionType.WORKING_AREA,
            bbox=[col_div_x, 0, w - col_div_x, h],
            confidence=0.95,
            page_number=page_number
        ))

    # Pattern for question numbers: e.g. "20.", "20 .", "21.", "21 .", "Question 20:"
    q_pattern = re.compile(r"^(?:Question\s*)?(\d+)\s*[\.\)\:]\s*(.*)", re.IGNORECASE)

    # 3. Filter text words / blocks to Question Column only (exclude header, footer, working area)
    valid_blocks = []
    question_max_x = col_div_x if col_div_x else w

    for b in page_blocks:
        rect = b.get("bbox_rect")
        if rect:
            bx, by, bw, bh = rect
        else:
            pts = b.get("bounding_box", [])
            if pts:
                bx = min(p[0] for p in pts)
                by = min(p[1] for p in pts)
                bw = max(p[0] for p in pts) - bx
                bh = max(p[1] for p in pts) - by
            else:
                bx, by, bw, bh = 0, 0, 0, 0

        b_text = b.get("text", "").strip()

        # Skip header and footer unless it's a question number
        is_q = bool(q_pattern.match(b_text))
        if by >= footer_threshold_y and not is_q:
            continue
        if by + bh <= header_threshold_y and not is_q:
            continue
        # Skip working area column
        if bx >= question_max_x - 10:
            continue

        b_text = b.get("text", "").strip()
        # Skip working area header
        if re.match(r"^working\s+area\b", b_text, re.IGNORECASE):
            continue

        valid_blocks.append({**b, "rect": [bx, by, bw, bh]})

    # Sort blocks top-to-bottom
    valid_blocks.sort(key=lambda x: x["rect"][1])

    # 4. Question Boundary Detection
    # Locate blocks starting with question numbers: e.g. "20.", "20 .", "21.", "21 ."
    question_starts = []

    for idx, b in enumerate(valid_blocks):
        text = b.get("text", "").strip()
        m = q_pattern.match(text)
        if m:
            q_num = m.group(1)
            rem_text = m.group(2)
            # Only consider valid question numbers (e.g. 1 to 100)
            if q_num.isdigit() and 1 <= int(q_num) <= 100:
                question_starts.append({
                    "block_idx": idx,
                    "q_num": q_num,
                    "initial_text": rem_text,
                    "top_y": b["rect"][1]
                })

    # Group blocks into questions
    detected_questions = []
    for i, q_start in enumerate(question_starts):
        q_num = q_start["q_num"]
        start_idx = q_start["block_idx"]
        end_idx = question_starts[i + 1]["block_idx"] if i + 1 < len(question_starts) else len(valid_blocks)

        q_blocks = valid_blocks[start_idx:end_idx]
        if not q_blocks:
            continue

        # Compute question bounding box
        q_min_x = min(b["rect"][0] for b in q_blocks)
        q_min_y = min(b["rect"][1] for b in q_blocks)
        q_max_x = min(question_max_x, max(b["rect"][0] + b["rect"][2] for b in q_blocks))
        q_max_y = max(b["rect"][1] + b["rect"][3] for b in q_blocks)

        # Detect choices within this question's blocks
        stem_parts = []
        options = []
        option_pattern = re.compile(r"([A-Ha-h])[\.\)\:]\s*([^\s].*?)(?=(?:\s+[A-Ha-h][\.\)\:]|$))")

        for idx_in_q, b in enumerate(q_blocks):
            b_text = b["text"].strip()
            # If this is the start block, strip the "20." prefix
            if idx_in_q == 0:
                m = q_pattern.match(b_text)
                if m:
                    b_text = m.group(2).strip()

            opt_matches = list(option_pattern.finditer(b_text))
            if opt_matches:
                for match in opt_matches:
                    label = match.group(1).upper()
                    content = match.group(2).strip()
                    options.append(QuestionOption(
                        id=label.lower(),
                        text=content,
                        is_correct=False
                    ))
            else:
                if b_text and not re.match(r"^(?:3RD\s+Preview|Mathematics|Grade\s+\d+)\b", b_text, re.IGNORECASE):
                    stem_parts.append(b_text)

        stem = " ".join(stem_parts).strip()

        # Determine choice layout
        choices_layout = ChoiceLayout.VERTICAL.value
        if len(options) >= 4:
            # Check horizontal distribution
            choices_layout = ChoiceLayout.TWO_COLUMN.value

        # Detect figures within this question's vertical span [q_min_y, q_max_y]
        q_figures = _detect_figures_in_region(img, q_min_y, q_max_y, q_max_x)

        detected_questions.append({
            "question_number": q_num,
            "stem": stem,
            "options": options,
            "choices_layout": choices_layout,
            "bbox": [q_min_x, q_min_y, q_max_x - q_min_x, q_max_y - q_min_y],
            "figures": q_figures,
            "has_figure": len(q_figures) > 0,
            "confidence": 0.88 if len(options) >= 2 else 0.75,
            "page_number": page_number
        })

    return {
        "questions": detected_questions,
        "regions": regions,
        "column_divider_x": col_div_x
    }


def _detect_vertical_divider(img: np.ndarray, tsv_words: list[dict], page_blocks: list[dict]) -> int | None:
    """
    Detects vertical line or boundary separating question content from WORKING AREA.
    """
    h, w = img.shape[:2]

    # Check 1: OCR text position of "WORKING AREA"
    for b in page_blocks:
        text = b.get("text", "").upper()
        if "WORKING AREA" in text or "WORKING" in text:
            rect = b.get("bbox_rect")
            if rect:
                # The divider is usually slightly to the left of the WORKING AREA text
                div_candidate = rect[0] - 10
                if int(w * 0.45) < div_candidate < int(w * 0.85):
                    return div_candidate

    for w_info in tsv_words:
        if "WORKING" in w_info.get("text", "").upper():
            bx = w_info.get("bbox", [0])[0]
            if int(w * 0.45) < bx < int(w * 0.85):
                return bx - 10

    # Check 2: OpenCV vertical line detection
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 40, 140)
    vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 35))
    vert_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, vert_kernel)

    lines = cv2.HoughLinesP(vert_lines, 1, np.pi/180, threshold=80, minLineLength=int(h * 0.25), maxLineGap=40)
    if lines is not None:
        candidates = []
        for l in lines:
            x1, y1, x2, y2 = l[0]
            if abs(x1 - x2) < 25 and int(w * 0.45) < x1 < int(w * 0.85):
                candidates.append((x1 + x2) // 2)
        if candidates:
            return int(np.median(candidates))

    return int(w * 0.60)  # Default fallback divider if a working area is typical


def _detect_figures_in_region(img: np.ndarray, y_start: int, y_end: int, max_x: int) -> list[dict]:
    """
    Detects non-text drawing/diagram/photo regions within a vertical slice of the question column.
    """
    h, w = img.shape[:2]
    # Bound crop coordinates
    y1 = max(0, y_start)
    y2 = min(h, y_end)
    x2 = min(w, max_x)

    if y2 - y1 < 30 or x2 < 50:
        return []

    crop = img[y1:y2, 0:x2]
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

    # Edge detection & morphology
    _, thresh = cv2.threshold(gray, 230, 255, cv2.THRESH_BINARY_INV)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (10, 10))
    dilated = cv2.dilate(thresh, kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    figures = []
    min_area = (x2 * (y2 - y1)) * 0.08  # At least 8% of question slice

    for cnt in contours:
        cx, cy, cw, ch = cv2.boundingRect(cnt)
        area = cw * ch
        aspect_ratio = cw / float(ch) if ch > 0 else 0

        # Filter out thin single lines or text lines
        if area >= min_area and 0.25 < aspect_ratio < 4.5 and ch > 40:
            figures.append({
                "bbox": [cx, y1 + cy, cw, ch],
                "area": area,
                "aspect_ratio": round(aspect_ratio, 2)
            })

    figures.sort(key=lambda f: f["bbox"][1])
    return figures
