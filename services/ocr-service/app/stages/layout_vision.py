import io
import json
import base64
import httpx
from PIL import Image
from app.config import settings
from app.models import (
    RegionType,
    PageRegion,
    ChoiceLayout,
    QuestionOption,
    ExtractedQuestion
)

def _safe_parse_json(text: str) -> list | dict | None:
    try:
        return json.loads(text)
    except Exception:
        pass

    # Try finding the last valid closing brace in an array
    last_brace = text.rfind("}")
    if last_brace != -1:
        truncated_array = text[:last_brace + 1].strip()
        if not truncated_array.endswith("]"):
            truncated_array += "]"
        if not truncated_array.startswith("["):
            first_bracket = truncated_array.find("[")
            if first_bracket != -1:
                truncated_array = truncated_array[first_bracket:]
        try:
            return json.loads(truncated_array)
        except Exception:
            pass

    return None

async def detect_vision_layout(
    color_image_bytes: bytes,
    page_number: int = 1
) -> dict | None:
    """
    Method (c): Primary Vision LLM Layout Engine.
    Uses multimodal Vision (e.g. Gemini 2.5 Flash via OpenRouter) to decompose
    the scanned document directly from visual structure.
    Strictly filters out WORKING AREA, handwriting, headers, and footers.
    Returns compact, high-fidelity canonical questions and figure bounding boxes.
    """
    if not settings.OPENROUTER_API_KEY:
        return None

    try:
        # Resize image if too large to conserve tokens and speed up vision processing
        pil_img = Image.open(io.BytesIO(color_image_bytes))
        orig_w, orig_h = pil_img.size

        max_dim = 1200
        if max(orig_w, orig_h) > max_dim:
            scale = max_dim / float(max(orig_w, orig_h))
            new_w = int(orig_w * scale)
            new_h = int(orig_h * scale)
            pil_img_resized = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        else:
            pil_img_resized = pil_img

        buf = io.BytesIO()
        pil_img_resized.save(buf, format="JPEG", quality=85)
        img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        prompt = """Decompose this Kenyan CBC exam paper into structured questions.
Rules:
1. Identify all question numbers (e.g. 20, 21, 22...).
2. Extract the exact stem, math formulas (in LaTeX), choices (A, B, C, D).
3. Detect choice layout: "inline" | "2_column" | "vertical".
4. If a question has a diagram/figure/drawing/photo, set "fig": [ymin, xmin, ymax, xmax] (normalized 0-1000 coords on the page). If none, set "fig": null.
5. Strict Negative Space: EXCLUDE header, footer, page numbers, the "WORKING AREA" column on the right, and any student pencil/handwriting notes.
6. NEVER invent or hallucinate options.

Return ONLY a compact JSON array:
[
  {
    "q": "20",
    "stem": "...",
    "choices": {"A": "...", "B": "...", "C": "...", "D": "..."},
    "layout": "2_column",
    "fig": [80, 100, 160, 480],
    "math": ["6\\\\frac{1}{4}"]
  }
]"""

        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://adaptivecbc.co.ke",
                    "X-Title": "Adaptive CBC Question Intelligence",
                },
                json={
                    "model": settings.OPENROUTER_MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{img_b64}"
                                    }
                                }
                            ]
                        }
                    ],
                    "temperature": 0.1,
                    "max_tokens": 550
                },
            )

            # If token limit was exceeded for free tier, dynamically retry with available credits
            if response.status_code == 402:
                import re
                afford_match = re.search(r"can only afford (\d+)", response.text)
                if afford_match:
                    afford_tokens = max(150, int(afford_match.group(1)) - 20)
                    response = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://adaptivecbc.co.ke",
                            "X-Title": "Adaptive CBC Question Intelligence",
                        },
                        json={
                            "model": settings.OPENROUTER_MODEL,
                            "messages": [
                                {
                                    "role": "user",
                                    "content": [
                                        {"type": "text", "text": prompt},
                                        {
                                            "type": "image_url",
                                            "image_url": {
                                                "url": f"data:image/jpeg;base64,{img_b64}"
                                            }
                                        }
                                    ]
                                }
                            ],
                            "temperature": 0.1,
                            "max_tokens": afford_tokens
                        },
                    )

        if response.status_code != 200:
            print(f"Vision layout API returned status {response.status_code}: {response.text[:200]}")
            return None

        data = response.json()
        raw_content = data["choices"][0]["message"]["content"].strip()

        # Clean markdown wrappers if present
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:]
        if raw_content.startswith("```"):
            raw_content = raw_content[3:]
        if raw_content.endswith("```"):
            raw_content = raw_content[:-3]
        raw_content = raw_content.strip()

        parsed = _safe_parse_json(raw_content)
        if isinstance(parsed, dict) and "questions" in parsed:
            items = parsed["questions"]
        elif isinstance(parsed, list):
            items = parsed
        else:
            items = []

        if not items:
            return None

        canonical_questions = []
        regions = []

        for item in items:
            q_num = str(item.get("q") or item.get("question_number") or "")
            stem = item.get("stem") or item.get("question_text") or ""
            choices_dict = item.get("choices", {})
            layout = item.get("layout", "vertical")
            fig_coords = item.get("fig") or item.get("figure_bbox")
            math_list = item.get("math") or item.get("math_tokens") or []

            # Format options
            options = []
            if isinstance(choices_dict, dict):
                for lbl in ["A", "B", "C", "D", "E", "F"]:
                    if lbl in choices_dict:
                        options.append(QuestionOption(
                            id=lbl.lower(),
                            text=str(choices_dict[lbl]).strip(),
                            is_correct=False
                        ))
                    elif lbl.lower() in choices_dict:
                        options.append(QuestionOption(
                            id=lbl.lower(),
                            text=str(choices_dict[lbl.lower()]).strip(),
                            is_correct=False
                        ))
            elif isinstance(choices_dict, list):
                for opt in choices_dict:
                    if isinstance(opt, dict):
                        options.append(QuestionOption(
                            id=str(opt.get("id") or opt.get("label") or "a").lower(),
                            text=str(opt.get("text") or opt.get("content") or "").strip(),
                            is_correct=opt.get("is_correct", False)
                        ))

            # Convert normalized figure bbox [ymin, xmin, ymax, xmax] (0-1000 scale) to image pixel rect [x, y, w, h]
            fig_dict = None
            if fig_coords and len(fig_coords) == 4:
                ymin, xmin, ymax, xmax = fig_coords
                px_x = int((xmin / 1000.0) * orig_w)
                px_y = int((ymin / 1000.0) * orig_h)
                px_w = int(((xmax - xmin) / 1000.0) * orig_w)
                px_h = int(((ymax - ymin) / 1000.0) * orig_h)
                fig_dict = {
                    "bbox": [px_x, px_y, px_w, px_h],
                    "normalized": fig_coords,
                    "question_number": q_num,
                    "page_number": page_number
                }
                regions.append(PageRegion(
                    id=f"p{page_number}_q{q_num}_fig",
                    type=RegionType.FIGURE,
                    bbox=[px_x, px_y, px_w, px_h],
                    confidence=0.96,
                    question_number=q_num,
                    page_number=page_number
                ))

            q_obj = ExtractedQuestion(
                id=f"q_{page_number}_{q_num or len(canonical_questions)+1}",
                question_number=q_num,
                text=stem,
                stem=stem,
                options=options,
                choices_layout=layout,
                question_type="mcq" if options else "structured",
                confidence=0.95,
                page_number=page_number,
                math_latex="; ".join(math_list) if math_list else None,
                math_tokens=[{"latex": m} for m in math_list] if math_list else [],
                diagram_reference=fig_dict is not None,
                figures=[fig_dict] if fig_dict else [],
                confidence_breakdown={"boundary": 0.98, "stem": 0.96, "choices": 0.97, "overall": 0.96},
                source_provenance={
                    "page_number": page_number,
                    "question_number": q_num,
                    "method": "vision_layout"
                }
            )
            canonical_questions.append(q_obj)

        return {
            "questions": canonical_questions,
            "regions": regions,
            "source_method": "vision_llm"
        }

    except Exception as e:
        print(f"Method (c) Vision layout extraction failed: {e}")
        return None
