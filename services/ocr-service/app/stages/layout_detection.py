import asyncio
from app.config import settings
from app.stages.layout_vision import detect_vision_layout
from app.stages.layout_local import detect_local_layout
from app.storage import storage

async def detect_hybrid_layout(
    job_id: str,
    color_master_key: str,
    page_number: int,
    tsv_words: list[dict] = None,
    page_blocks: list[dict] = None,
) -> dict:
    """
    Hybrid Layout Intelligence Engine.
    Executes Method (c) Vision LLM first as primary layout engine.
    If unavailable or fails, escalates/falls back to Method (b) Local Geometric Engine.
    """
    color_image_bytes = storage.get_object(color_master_key)
    tsv_words = tsv_words or []
    page_blocks = page_blocks or []

    vision_result = None
    # 1. Primary: Method (c) Vision LLM Layout
    if settings.LAYOUT_ENGINE in ("hybrid", "vision") and settings.OPENROUTER_API_KEY:
        try:
            vision_result = await detect_vision_layout(color_image_bytes, page_number)
        except Exception as e:
            print(f"Primary vision layout engine encountered error: {e}, falling back to local layout engine.")

    # 2. Secondary / Local Geometric Layout Engine
    local_result = detect_local_layout(
        color_image_bytes=color_image_bytes,
        tsv_words=tsv_words,
        page_blocks=page_blocks,
        page_number=page_number
    )

    local_questions = local_result.get("questions", [])
    local_regions = local_result.get("regions", [])
    figure_regions = []

    # Collect figures from local result
    for q in local_questions:
        for fig in q.get("figures", []):
            figure_regions.append({
                "bbox": fig["bbox"],
                "question_number": q.get("question_number"),
                "page_number": page_number,
                "figure_type": "diagram"
            })

    if vision_result and vision_result.get("questions"):
        vision_questions = vision_result["questions"]

        # Collect figures from vision result
        for reg in vision_result.get("regions", []):
            if reg.type == "figure" and reg.bbox:
                figure_regions.append({
                    "bbox": reg.bbox,
                    "question_number": reg.question_number,
                    "page_number": page_number,
                    "figure_type": "diagram"
                })

        for q in vision_questions:
            for f in getattr(q, "figures", []):
                if f.get("bbox") and not any(r["bbox"] == f["bbox"] for r in figure_regions):
                    figure_regions.append({
                        "bbox": f["bbox"],
                        "question_number": getattr(q, "question_number", ""),
                        "page_number": page_number,
                        "figure_type": "diagram"
                    })

        # If vision detected sufficient questions (or local detected none), use vision
        if len(vision_questions) >= len(local_questions) or not local_questions:
            return {
                "method": "vision_llm",
                "questions": vision_questions,
                "regions": vision_result.get("regions", []),
                "figure_regions": figure_regions,
                "question_count": len(vision_questions),
                "confidence": 0.95
            }
        else:
            # Vision was partially truncated: merge vision's canonical questions with local's remaining questions
            print(f"Hybrid layout: Merging {len(vision_questions)} vision questions with {len(local_questions)} local questions.")
            merged = list(vision_questions)
            seen_q_nums = {str(getattr(q, "question_number", "")) for q in merged}
            for lq in local_questions:
                lq_num = str(lq.get("question_number", ""))
                if lq_num not in seen_q_nums:
                    merged.append(lq)
                    seen_q_nums.add(lq_num)

            return {
                "method": "hybrid_merged",
                "questions": merged,
                "regions": vision_result.get("regions", []) + local_regions,
                "figure_regions": figure_regions,
                "question_count": len(merged),
                "confidence": 0.92
            }

    # Fallback to local geometric layout
    return {
        "method": "local_geometry",
        "questions": local_questions,
        "regions": local_regions,
        "figure_regions": figure_regions,
        "question_count": len(local_questions),
        "column_divider_x": local_result.get("column_divider_x"),
        "confidence": 0.82
    }


def detect_layout(blocks: list[dict]) -> dict:
    """Backward compatibility wrapper for legacy callers."""
    questions = [b for b in blocks if b.get("block_type") == "numbered_question"]
    options = [b for b in blocks if b.get("block_type") == "option"]
    diagrams = [b for b in blocks if b.get("block_type") == "diagram_reference"]

    return {
        "total_blocks": len(blocks),
        "question_count": len(questions),
        "option_count": len(options),
        "diagram_count": len(diagrams),
        "structure": "exam_paper" if len(questions) > 2 else "document",
    }
