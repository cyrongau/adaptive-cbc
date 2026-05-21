import json
# pyright: ignore [missing-import]
import httpx
from app.config import settings
from app.models import ExtractedQuestion, QuestionOption
from app.stages.ai_cache import get_ai_cache, set_ai_cache


async def ai_structure_questions(questions: list[dict], full_text: str) -> list[ExtractedQuestion]:
    if not questions:
        print("No questions found by segmentation, falling back to full text AI extraction.")
        return await _extract_all_from_text_ai(full_text)

    cache_input = {"questions": questions, "full_text_preview": full_text[:500]}
    cached = get_ai_cache("ai_structuring", cache_input)
    if cached:
        print(f"AI structuring cache hit for {len(questions)} questions")
        return _reconstruct_from_cache(cached)

    if not settings.OPENROUTER_API_KEY:
        return _fallback_structure(questions)

    structured = []
    batch_size = 5

    for i in range(0, len(questions), batch_size):
        batch = questions[i:i + batch_size]
        try:
            result = await _call_openrouter(batch, full_text)
            if result:
                structured.extend(result)
            else:
                structured.extend(_fallback_structure(batch))
        except Exception as e:
            print(f"AI structuring failed for batch {i}: {e}")
            structured.extend(_fallback_structure(batch))

    cache_output = {
        "questions": [
            {
                "text": q.text,
                "options": [{"id": o.id, "text": o.text, "is_correct": o.is_correct} for o in q.options],
                "correct_answer": q.correct_answer,
                "question_type": q.question_type,
                "confidence": q.confidence,
                "diagram_reference": getattr(q, 'diagram_reference', False),
                "diagram_description": getattr(q, 'diagram_description', None),
                "needs_review": getattr(q, 'needs_review', False),
                "review_reason": getattr(q, 'review_reason', None),
            }
            for q in structured
        ]
    }
    set_ai_cache("ai_structuring", cache_input, cache_output)

    return structured


def _reconstruct_from_cache(cached: dict) -> list[ExtractedQuestion]:
    results = []
    for item in cached.get("questions", []):
        options = [
            QuestionOption(id=o["id"], text=o["text"], is_correct=o["is_correct"])
            for o in item.get("options", [])
        ]
        results.append(ExtractedQuestion(
            id=f"q_cached_{len(results)+1}",
            text=item.get("text", ""),
            options=options,
            correct_answer=item.get("correct_answer"),
            question_type=item.get("question_type", "structured"),
            confidence=item.get("confidence", 0.7),
            page_number=1,
            needs_review=item.get("needs_review", False),
            review_reason=item.get("review_reason", None),
        ))
    return results


async def _call_openrouter(batch: list[dict], full_text: str) -> list[ExtractedQuestion]:
    prompt = f"""You are an expert educational content parser. Extract and structure questions from OCR text.

Rules:
1. Detect question numbering and preserve it
2. Extract MCQ options (A, B, C, D, E, F format) and preserve all choices
3. Identify the correct answer if marked
4. Classify question type: mcq, true_false, fill_blank, structured, short_answer
5. If the question refers to a diagram or figure, include "diagram_reference": true and a short "diagram_description"
6. Ignore headers, instructions, and non-question text
7. Preserve mathematical notation as-is
8. If no options are found but the question is clearly an MCQ, auto-generate 4 plausible options (A, B, C, D) based on the question context.
9. If no options are found and it's not an MCQ, classify as "structured"
10. If a question is unreadable, garbled, or seems incomplete, set "needs_review": true and provide a brief "review_reason". Otherwise, set it to false.

OCR Text context:
{full_text[:3000]}

Questions to structure:
{json.dumps(batch, indent=2)}

Return ONLY a valid JSON array with this structure:
[
  {{
    "question_text": "the full question text",
    "options": [{{"id": "a", "text": "option text", "is_correct": false}}],
    "correct_answer": "a",
    "question_type": "mcq",
    "confidence": 0.9,
    "topic": "optional topic guess",
    "needs_review": false,
    "review_reason": null
  }}
]"""

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://adaptivecbc.co.ke",
                "X-Title": "Adaptive CBC OCR",
            },
            json={
                "model": settings.OPENROUTER_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 4000,
            },
        )
        response.raise_for_status()
        data = response.json()

    content = data["choices"][0]["message"]["content"].strip()

    content = content.strip("`").strip()
    if content.startswith("json"):
        content = content[4:].strip()

    parsed = json.loads(content)

    if not isinstance(parsed, list):
        parsed = [parsed]

    results = []
    for item in parsed:
        options = [
            QuestionOption(
                id=opt.get("id", "a"),
                text=opt.get("text", ""),
                is_correct=opt.get("is_correct", False),
            )
            for opt in item.get("options", [])
        ]

        question_text = item.get("question_text", item.get("text", ""))
        question_kwargs = {
            "id": f"q_ai_{len(results)+1}",
            "text": question_text,
            "options": options,
            "correct_answer": item.get("correct_answer"),
            "question_type": item.get("question_type", "structured"),
            "confidence": min(item.get("confidence", 0.7), 1.0),
            "page_number": 1,
            "needs_review": item.get("needs_review", False),
            "review_reason": item.get("review_reason", None),
        }
        if item.get("diagram_reference"):
            question_kwargs["diagram_reference"] = item.get("diagram_reference")
            question_kwargs["diagram_description"] = item.get("diagram_description")

        results.append(ExtractedQuestion(**question_kwargs))

    return results

async def _extract_all_from_text_ai(full_text: str) -> list[ExtractedQuestion]:
    if not settings.OPENROUTER_API_KEY:
        return []

    prompt = f"""You are an expert educational content parser. The following text contains an exam, worksheet, or learning material.
Extract and structure ALL questions found in the text.

Rules:
1. Detect question numbering and preserve it.
2. Extract MCQ options (A, B, C, D, E, F format) and preserve all choices.
3. Identify the correct answer if marked.
4. Classify question type: mcq, true_false, fill_blank, structured, short_answer.
5. If the question refers to a diagram or figure, include "diagram_reference": true and a short "diagram_description".
6. Ignore headers, instructions, and non-question text.
7. Preserve mathematical notation as-is.
8. If no options are found but the question is clearly an MCQ, auto-generate 4 plausible options (A, B, C, D) based on the question context.
9. If no options are found and it's not an MCQ, classify as "structured".
10. If a question is unreadable, garbled, or seems incomplete, set "needs_review": true and provide a brief "review_reason". Otherwise, set it to false.

OCR Text:
{full_text[:6000]}

Return ONLY a valid JSON array with this structure:
[
  {{
    "question_text": "the full question text",
    "options": [{{"id": "a", "text": "option text", "is_correct": false}}],
    "correct_answer": "a",
    "question_type": "mcq",
    "confidence": 0.9,
    "topic": "optional topic guess",
    "needs_review": false,
    "review_reason": null
  }}
]"""

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://adaptivecbc.co.ke",
                    "X-Title": "Adaptive CBC OCR",
                },
                json={
                    "model": settings.OPENROUTER_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": 4000,
                },
            )
            response.raise_for_status()
            data = response.json()

        content = data["choices"][0]["message"]["content"].strip()
        content = content.strip("`").strip()
        if content.startswith("json"):
            content = content[4:].strip()

        parsed = json.loads(content)
        if not isinstance(parsed, list):
            parsed = [parsed]

        results = []
        for item in parsed:
            options = [
                QuestionOption(
                    id=opt.get("id", "a"),
                    text=opt.get("text", ""),
                    is_correct=opt.get("is_correct", False),
                )
                for opt in item.get("options", [])
            ]

            question_text = item.get("question_text", item.get("text", ""))
            if not question_text:
                continue

            question_kwargs = {
                "id": f"q_ai_fb_{len(results)+1}",
                "text": question_text,
                "options": options,
                "correct_answer": item.get("correct_answer"),
                "question_type": item.get("question_type", "structured"),
                "confidence": min(item.get("confidence", 0.7), 1.0),
                "page_number": 1,
                "needs_review": item.get("needs_review", False),
                "review_reason": item.get("review_reason", None),
            }
            if item.get("diagram_reference"):
                question_kwargs["diagram_reference"] = item.get("diagram_reference")
                question_kwargs["diagram_description"] = item.get("diagram_description")

            results.append(ExtractedQuestion(**question_kwargs))

        print(f"AI fallback extracted {len(results)} questions.")
        return results
    except Exception as e:
        print(f"AI fallback extraction failed: {e}")
        return []

def _fallback_structure(batch: list[dict]) -> list[ExtractedQuestion]:
    results = []
    for q in batch:
        results.append(ExtractedQuestion(
            id=f"q_fallback_{len(results)+1}",
            text=q.get("text", "Unknown question text"),
            question_type="structured",
            confidence=0.5,
            page_number=1,
            needs_review=True,
            review_reason="AI extraction failed or unavailable, fell back to basic structuring."
        ))
    return results
