import json
import httpx
from app.config import settings
from app.models import ExtractedQuestion, QuestionOption


async def ai_structure_questions(questions: list[dict], full_text: str) -> list[ExtractedQuestion]:
    if not questions:
        return []

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

    return structured


async def _call_openrouter(batch: list[dict], full_text: str) -> list[ExtractedQuestion]:
    prompt = f"""You are an expert educational content parser. Extract and structure questions from OCR text.

Rules:
1. Detect question numbering and preserve it
2. Extract MCQ options (A, B, C, D format)
3. Identify the correct answer if marked
4. Classify question type: mcq, true_false, fill_blank, structured, short_answer
5. Ignore headers, instructions, and non-question text
6. Preserve mathematical notation as-is
7. If no options are found, classify as "structured"

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
    "topic": "optional topic guess"
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
        options = []
        for opt in item.get("options", []):
            options.append(QuestionOption(
                id=opt.get("id", "a"),
                text=opt.get("text", ""),
                is_correct=opt.get("is_correct", False),
            ))

        results.append(ExtractedQuestion(
            id=f"q_ai_{len(results)+1}",
            text=item.get("question_text", ""),
            options=options,
            correct_answer=item.get("correct_answer"),
            question_type=item.get("question_type", "structured"),
            confidence=min(item.get("confidence", 0.7), 1.0),
            page_number=1,
        ))

    return results


def _fallback_structure(questions: list[dict]) -> list[ExtractedQuestion]:
    results = []
    for q in questions:
        options = []
        for opt in q.get("options", []):
            if isinstance(opt, dict):
                options.append(QuestionOption(
                    id=opt.get("id", "a"),
                    text=opt.get("text", ""),
                    is_correct=opt.get("is_correct", False),
                ))

        results.append(ExtractedQuestion(
            id=q.get("id", f"q_fb_{len(results)+1}"),
            text=q.get("text", q.get("question_text", "")),
            options=options,
            correct_answer=q.get("correct_answer"),
            question_type=q.get("question_type", "structured"),
            confidence=q.get("confidence", 0.6),
            page_number=q.get("page_number", 1),
            math_latex=q.get("math_latex"),
        ))

    return results
